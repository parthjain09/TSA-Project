import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Box, Typography, Paper, CircularProgress, LinearProgress, Button, Switch, FormControlLabel, Chip, Divider, Grid, Stack, Paper as MuiPaper } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { recognizeGesture } from '../utils/gestureRecognition';
import { predict } from '../utils/classifier';
import TrainingPanel from './TrainingPanel';
import { MeetingManager } from '../utils/meetingManager';
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import GitHubIcon from '@mui/icons-material/GitHub';
import { TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';

const SIGN_DESCRIPTIONS = {
    A: "Fist, thumb on side",
    B: "Flat palm, thumb tucked",
    C: "Cup hand C-shape",
    D: "Index finger up",
    E: "Fingers curled to thumb",
    F: "OK sign (Index+Thumb)",
    G: "Index finger points left",
    H: "Index+Middle point left",
    I: "Pinky finger up",
    J: "Pinky draws a J",
    K: "Peace sign, thumb mid",
    L: "L-shape (Thumb+Index)",
    M: "3 fingers over thumb",
    N: "2 fingers over thumb",
    O: "Fingertips touch thumb",
    P: "Upside down K",
    Q: "Upside down G",
    R: "Crossed fingers",
    S: "Fist, thumb over fingers",
    T: "Thumb between index/mid",
    U: "Index+Middle up together",
    V: "Peace sign",
    W: "3 fingers up",
    X: "Index finger hooked",
    Y: "Thumb+Pinky out",
    Z: "Index finger draws Z"
};

const ConversePanel = () => {
    const [text, setText] = useState("");

    return (
        <Box sx={{ p: 4, width: '100%', maxWidth: 800, mx: 'auto', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#60a5fa' }}>Text-to-Sign Visualizer</Typography>
            <MuiPaper sx={{ p: 2, mb: 4, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value.toUpperCase())}
                    placeholder="Type here to see how to sign it..."
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        outline: 'none',
                        fontFamily: 'monospace'
                    }}
                />
            </MuiPaper>

            <Grid container spacing={2} justifyContent="center">
                {text.split('').map((char, i) => (
                    <Grid item key={i}>
                        {char === ' ' ? (
                            <Box sx={{ width: 40 }} /> // Spacer
                        ) : (
                            <MuiPaper sx={{
                                p: 2,
                                width: 100,
                                height: 120,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 3
                            }}>
                                <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>{char}</Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.1 }}>
                                    {SIGN_DESCRIPTIONS[char] || "Spelling"}
                                </Typography>
                            </MuiPaper>
                        )}
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

const SignLanguageDetector = () => {
    // These refs keep track of the webcam and canvas without causing too many re-renders
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const currentLandmarksRef = useRef(null);

    const [webcamRunning, setWebcamRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [handLandmarker, setHandLandmarker] = useState(null);
    const [gesture, setGesture] = useState("Ready");
    const [confidence, setConfidence] = useState(0);
    const [gestureHistory, setGestureHistory] = useState([]);
    const gestureHistoryRef = useRef([]);

    // Sentence Translation Engine - This was the hardest part to get right!
    // We have to "hold" the sign for a second so it doesn't type by accident.
    const [sentence, setSentence] = useState("");
    const [currentWord, setCurrentWord] = useState("");
    const sentenceRef = useRef("");
    const currentWordRef = useRef("");
    const [lastChar, setLastChar] = useState("");
    const lastCharRef = useRef("");
    const [holdStartTime, setHoldStartTime] = useState(0);
    const holdStartTimeRef = useRef(0);
    const TRANSLATION_HOLD_THRESHOLD = 900;

    const [trainingMode, setTrainingMode] = useState(false);
    const [isMeetingMode, setIsMeetingMode] = useState(false);
    const [isConverseMode, setIsConverseMode] = useState(false); // New Converse Mode
    const [cameraError, setCameraError] = useState(null);
    // TODO: Add more pre-trained gesture models for full phrases
    const [classCounts, setClassCounts] = useState({});
    const [deviceId, setDeviceId] = useState(undefined);
    const [devices, setDevices] = useState([]);
    const [diag, setDiag] = useState({ state: 'Idle', res: '0x0', hands: false, raw: '---', handedness: 'None' });

    // Meeting Mode State
    const [meetingManager, setMeetingManager] = useState(null);
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [participants, setParticipants] = useState({});
    const [remoteTranslations, setRemoteTranslations] = useState({});
    const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 6));

    const handleCreateMeeting = async () => {
        const manager = new MeetingManager(userId, 'Person ' + userId.split('_')[1]);
        const code = await manager.createMeeting();
        setMeetingManager(manager);
        setRoomCode(code);
        setIsMeetingMode(true);

        manager.listenToTranslations((data) => {
            setRemoteTranslations(data);
        });
    };

    const handleJoinMeeting = async () => {
        if (!joinCode) return;
        const manager = new MeetingManager(userId, 'Person ' + userId.split('_')[1]);
        await manager.joinMeeting(joinCode);
        setMeetingManager(manager);
        setRoomCode(joinCode);
        setIsMeetingMode(true);

        manager.listenToTranslations((data) => {
            setRemoteTranslations(data);
        });
    };

    const handleLeaveMeeting = async () => {
        if (meetingManager) {
            await meetingManager.leaveMeeting();
            setMeetingManager(null);
            setRoomCode('');
            setRemoteTranslations({});
        }
    };

    const handleClear = () => {
        // Clear States
        setSentence("");
        setCurrentWord("");
        setLastChar("");
        setHoldStartTime(0);
        setGestureHistory([]);

        // Clear Refs (Crucial for the prediction loop!)
        sentenceRef.current = "";
        currentWordRef.current = "";
        lastCharRef.current = "";
        holdStartTimeRef.current = 0;
        gestureHistoryRef.current = [];

        // If in a meeting, broadcast the clear
        if (meetingManager) {
            meetingManager.sendTranslation("");
        }
    };

    // Broadcast local translation when it updates
    useEffect(() => {
        if (meetingManager && (sentence || currentWord)) {
            meetingManager.sendTranslation(sentence + currentWord);
        }
    }, [sentence, currentWord, meetingManager]);

    // Download Transcript Function
    const downloadTranscript = () => {
        const element = document.createElement("a");
        const file = new Blob([sentence || "No text recorded."], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `SignBridge_Transcript_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleDevices = useCallback((mediaDevices) => {
        setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput"));
    }, []);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }, [handleDevices]);

    useEffect(() => {
        const initHandLandmarker = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );
                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 2,
                    minHandDetectionConfidence: 0.5,
                    minHandPresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                setHandLandmarker(landmarker);
                setLoading(false);
            } catch (error) {
                console.error("Init Error:", error);
                setLoading(false);
            }
        };
        initHandLandmarker();
    }, []);

    const startCamera = async () => {
        setDiag(prev => ({ ...prev, state: 'Connecting...' }));
        try {
            const constraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setDiag(prev => ({ ...prev, res: `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`, state: 'Streaming' }));
                    videoRef.current.play();
                };
            }
        } catch (err) {
            console.error("Camera Error:", err);
            alert("Camera Failed: " + err.name + " - " + err.message);
            setCameraError(`${err.name}: ${err.message}`);
            setWebcamRunning(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        webcamRunning ? startCamera() : stopCamera();
        return () => stopCamera();
    }, [webcamRunning, deviceId]);

    const smoothGesture = (newGesture, newConfidence) => {
        if (!newGesture || ["...", "Ready", "Position Hand"].includes(newGesture)) {
            // Gradually clear history
            if (gestureHistoryRef.current.length > 0) {
                gestureHistoryRef.current = gestureHistoryRef.current.slice(1);
                setGestureHistory([...gestureHistoryRef.current]);
            }
            return { gesture: newGesture || "Scanning...", confidence: 0 };
        }

        gestureHistoryRef.current = [...gestureHistoryRef.current, { gesture: newGesture, confidence: newConfidence }].slice(-25);
        setGestureHistory([...gestureHistoryRef.current]);

        const history = gestureHistoryRef.current;
        const counts = {};
        const confs = {};

        history.forEach(item => {
            counts[item.gesture] = (counts[item.gesture] || 0) + 1;
            confs[item.gesture] = (confs[item.gesture] || 0) + item.confidence;
        });

        const mostCommon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        // Require 18/25 frames (~72% consensus) for rock-solid stability
        if (counts[mostCommon] >= 18) {
            return {
                gesture: mostCommon,
                confidence: Math.round(confs[mostCommon] / counts[mostCommon])
            };
        }

        // If not enough confidence yet, return the raw gesture but don't commit it to translation yet
        return { gesture: newGesture, confidence: newConfidence, pending: true };
    };

    const processTranslation = (detected) => {
        if (!detected || ["...", "Ready", "Position Hand", "Scanning...", "Unknown Sign"].includes(detected)) {
            holdStartTimeRef.current = 0;
            setHoldStartTime(0);
            return;
        }

        const now = Date.now();

        // New gesture detected
        if (detected !== lastCharRef.current) {
            lastCharRef.current = detected;
            setLastChar(detected);

            holdStartTimeRef.current = now;
            setHoldStartTime(now);

            if (detected === 'B' || detected === 'Space') {
                if (currentWordRef.current) {
                    sentenceRef.current += currentWordRef.current + " ";
                    setSentence(sentenceRef.current);

                    currentWordRef.current = "";
                    setCurrentWord("");
                }
            } else {
                currentWordRef.current = detected;
                setCurrentWord(detected);
            }
        } else {
            // Same sign held
            const holdDuration = now - holdStartTimeRef.current;
            if (holdDuration > TRANSLATION_HOLD_THRESHOLD) {
                if (detected === 'B' || detected === 'Space') {
                    if (currentWordRef.current) {
                        sentenceRef.current += currentWordRef.current + " ";
                        setSentence(sentenceRef.current);
                        currentWordRef.current = "";
                        setCurrentWord("");
                    }
                } else {
                    sentenceRef.current += currentWordRef.current;
                    setSentence(sentenceRef.current);
                    currentWordRef.current = "";
                    setCurrentWord("");
                }
                lastCharRef.current = "";
                setLastChar("");
                holdStartTimeRef.current = 0;
                setHoldStartTime(0);
            }
        }
    };

    const predictFrame = async () => {
        if (webcamRunning && handLandmarker && videoRef.current?.readyState >= 2) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            try {
                const startTimeMs = performance.now();
                const results = handLandmarker.detectForVideo(video, startTimeMs);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (results.landmarks?.length > 0) {
                    const drawingUtils = new DrawingUtils(ctx);
                    let bestGesture = null;
                    let bestHand = "Right";

                    // Process all detected hands
                    for (let i = 0; i < results.landmarks.length; i++) {
                        const landmarks = results.landmarks[i];
                        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#60a5fa", lineWidth: 3 });
                        drawingUtils.drawLandmarks(landmarks, { color: "#ffffff", lineWidth: 1, radius: 2 });

                        const hand = results.handedness?.[i]?.[0]?.categoryName || "Right";
                        const raw = recognizeGesture(landmarks, hand);

                        if (raw) {
                            if (!bestGesture) {
                                // First match found
                                bestGesture = raw;
                                bestHand = hand;
                            } else if (bestGesture === "B" && raw !== "B") {
                                // Upgrade: We found a 'B' (likely rest) before, but this is a specific sign. Take it.
                                bestGesture = raw;
                                bestHand = hand;
                            }
                        }
                    }

                    if (bestGesture) {
                        // Valid gesture detected
                        setDiag(prev => ({ ...prev, hands: true, handedness: bestHand, raw: bestGesture, state: 'Translating' }));

                        const final = smoothGesture(bestGesture, 95);

                        setGesture(final.gesture);
                        setConfidence(final.confidence);

                        // Only send to translation bar if it's "smooth" (not just a flicker)
                        if (!final.pending) {
                            processTranslation(final.gesture);
                        }
                    } else {
                        // No specific gesture recognized
                        setGesture("Unknown Sign");
                        holdStartTimeRef.current = 0;
                        setHoldStartTime(0);
                    }
                } else {
                    setDiag(prev => ({ ...prev, hands: false, raw: '---', state: 'Scanning...' }));
                    setGesture(webcamRunning ? "Scanning..." : "Ready");
                    setConfidence(0);
                    setGestureHistory([]);
                    setHoldStartTime(0);
                }
            } catch (err) {
                console.error("Prediction Error:", err);
                setDiag(prev => ({ ...prev, state: 'Error: ' + err.message }));
                setGesture("Error: " + err.message); // Show error to user
            }
        }
        if (webcamRunning) requestAnimationFrame(predictFrame);
    };

    useEffect(() => {
        if (webcamRunning) requestAnimationFrame(predictFrame);
    }, [webcamRunning, handLandmarker]);

    return (
        <Box sx={{
            height: '100vh', // Fixed height for full screen app
            overflow: isMeetingMode ? 'hidden' : 'auto', // Allow scroll in normal mode, fixed in meeting
            bgcolor: '#050510',
            p: isMeetingMode ? 2 : 4, // Add padding even in meeting mode for edge safety
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            fontFamily: '"Outfit", "Inter", sans-serif'
        }}>
            {/* Header - Hidden in Meeting Mode */}
            {/* Header - Hidden in Meeting Mode */}
            {!isMeetingMode && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                    <Typography variant="h4" sx={{
                        fontWeight: 800,
                        background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        SignBridge AI
                    </Typography>

                    <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, p: 0.5, mx: 4 }}>
                        <Button
                            variant={!isConverseMode ? "contained" : "text"}
                            onClick={() => setIsConverseMode(false)}
                            sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', color: !isConverseMode ? 'white' : 'rgba(255,255,255,0.5)' }}
                        >
                            Translate
                        </Button>
                        <Button
                            variant={isConverseMode ? "contained" : "text"}
                            onClick={() => setIsConverseMode(true)}
                            sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', color: isConverseMode ? 'white' : 'rgba(255,255,255,0.5)' }}
                        >
                            Converse
                        </Button>
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="contained" onClick={() => setWebcamRunning(!webcamRunning)}
                        disabled={isConverseMode}
                        sx={{
                            background: webcamRunning ? '#ef4444' : 'linear-gradient(to right, #34d399, #059669)',
                            textTransform: 'none',
                            borderRadius: '12px',
                            px: 4,
                            opacity: isConverseMode ? 0 : 1
                        }}>
                        {webcamRunning ? "Stop Camera" : "Launch Translation"}
                    </Button>
                </Box>
            )}

            <Grid container spacing={isMeetingMode ? 2 : 4} sx={{ flexGrow: 1, height: isMeetingMode ? '100%' : 'auto', maxWidth: 1400, mx: 'auto' }}>
                {/* Left: Main Interaction Area */}
                <Grid item xs={12} md={isMeetingMode ? 12 : 9} sx={{
                    height: isMeetingMode ? '100%' : 'auto',
                    display: isMeetingMode ? 'flex' : 'block',
                    flexDirection: 'column'
                }}>
                    <MuiPaper elevation={0} sx={{
                        position: 'relative',
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: isMeetingMode ? 4 : 6,
                        overflow: 'hidden',
                        flex: isMeetingMode ? 1 : 'none', // Flex grow in meeting mode
                        height: isMeetingMode ? 'auto' : '550px',
                        minHeight: 0, // Important for flex scrolling
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isMeetingMode ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.3s ease'
                    }}>
                        {isConverseMode ? (
                            <ConversePanel />
                        ) : !webcamRunning ? (
                            <Box sx={{ textAlign: 'center', zIndex: 5 }}>
                                <Typography variant="h5" sx={{ mb: 3, opacity: 0.6, fontWeight: 500 }}>
                                    Neural Sign Recognition System
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => setWebcamRunning(true)}
                                    disabled={!handLandmarker}
                                    sx={{
                                        bgcolor: '#60a5fa',
                                        px: 6,
                                        py: 2,
                                        borderRadius: 4,
                                        fontSize: '1.1rem',
                                        textTransform: 'none',
                                        boxShadow: '0 8px 25px rgba(96, 165, 250, 0.3)',
                                        '&:hover': { bgcolor: '#3b82f6' },
                                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                                    }}
                                >
                                    {!handLandmarker ? (
                                        <>
                                            <CircularProgress size={20} sx={{ mr: 2, color: 'rgba(255,255,255,0.5)' }} />
                                            Initializing AI...
                                        </>
                                    ) : (
                                        "Activate Camera & Sensors"
                                    )}
                                </Button>
                                {cameraError && (
                                    <Typography color="error" sx={{ mt: 2, bgcolor: 'rgba(255,0,0,0.1)', p: 1, borderRadius: 2 }}>
                                        {cameraError}
                                    </Typography>
                                )}

                                <Box sx={{ mt: 6, opacity: 0.4 }}>
                                    <Typography variant="body2">Privacy Layer: Active (Local processing only)</Typography>
                                    <Typography variant="body2">Version: v2.0 (New Port 5174)</Typography>
                                </Box>
                            </Box>
                        ) : (
                            <>
                                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} autoPlay playsInline muted />
                                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />

                                {/* Detection Overlay */}
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 40,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    bgcolor: 'rgba(0,0,0,0.85)',
                                    px: 6,
                                    py: 2,
                                    borderRadius: 4,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    textAlign: 'center',
                                    zIndex: 10
                                }}>
                                    <Typography variant="h3" sx={{
                                        fontWeight: 800,
                                        color: holdStartTime > 0 ? '#fbbf24' : '#fff', // Turn yellow/orange when holding
                                        transition: 'color 0.2s'
                                    }}>
                                        {gesture}
                                    </Typography>
                                    {holdStartTime > 0 && gesture !== "Position Hand" && (
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min(100, ((Date.now() - holdStartTime) / TRANSLATION_HOLD_THRESHOLD) * 100)}
                                            sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)' }}
                                        />
                                    )}
                                </Box>

                                <Button
                                    onClick={() => setWebcamRunning(false)}
                                    sx={{ position: 'absolute', top: 20, right: 20, color: 'rgba(255,255,255,0.3)', textTransform: 'none' }}
                                >
                                    Stop Camera
                                </Button>

                            </>
                        )}
                    </MuiPaper>

                    {/* Translation Result Bar */}
                    <MuiPaper sx={{
                        mt: 2,
                        p: 3,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Box sx={{ flex: 1, minWidth: '200px' }}>
                            <Typography variant="h5" sx={{ fontFamily: 'monospace', opacity: (sentence || currentWord) ? 1 : 0.4 }}>
                                {sentence}{currentWord}
                                {!sentence && !currentWord && "Translation will appear here..."}
                                <Box component="span" sx={{ bgcolor: '#60a5fa', width: '2px', height: '1em', display: 'inline-block', ml: 1, animation: 'blink 1s infinite' }} />
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={handleClear} sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none' }}>Clear</Button>
                            {isMeetingMode && (
                                <Button size="small" variant="outlined" onClick={downloadTranscript} sx={{ color: '#60a5fa', borderColor: '#60a5fa', textTransform: 'none' }}>
                                    Save Notes
                                </Button>
                            )}
                            <Button size="small" variant="contained" onClick={() => setIsMeetingMode(!isMeetingMode)} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', textTransform: 'none' }}>
                                {isMeetingMode ? "Exit Fullscreen" : "Meeting Mode"}
                            </Button>
                        </Stack>
                    </MuiPaper>

                    {/* Participant Translations Feed (Meeting Mode) */}
                    {isMeetingMode && Object.keys(remoteTranslations).length > 0 && (
                        <MuiPaper sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: 'rgba(96,165,250,0.05)',
                            borderRadius: 4,
                            border: '1px solid rgba(96,165,250,0.2)'
                        }}>
                            <Typography variant="caption" sx={{ color: '#60a5fa', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PeopleIcon fontSize="small" /> LIVE PARTICIPANTS
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', py: 1 }}>
                                {Object.entries(remoteTranslations)
                                    .filter(([id]) => id !== userId) // Don't show self in remote feed
                                    .map(([id, data]) => (
                                        <Paper key={id} sx={{
                                            p: 2,
                                            minWidth: 200,
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            borderRadius: 3,
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            <Typography variant="caption" sx={{ color: '#f472b6', fontWeight: 700 }}>
                                                {data.name}
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                                                {data.text || "..."}
                                            </Typography>
                                        </Paper>
                                    ))}
                            </Stack>
                        </MuiPaper>
                    )}
                </Grid>

                {/* Right: Sidebar */}
                {!isMeetingMode && (
                    <Grid item xs={12} md={3}>
                        <Stack spacing={3}>
                            {/* Meeting Room Card */}
                            <MuiPaper sx={{ p: 3, bgcolor: 'rgba(96, 165, 250, 0.05)', borderRadius: 5, border: '1px solid rgba(96, 165, 250, 0.2)' }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MeetingRoomIcon /> {roomCode ? `Room: ${roomCode}` : 'Meeting Room'}
                                </Typography>

                                {!roomCode ? (
                                    <Stack spacing={2}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handleCreateMeeting}
                                            sx={{ background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)' }}
                                        >
                                            Create Meeting
                                        </Button>
                                        <Divider sx={{ opacity: 0.1 }}>OR</Divider>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Enter Room Code"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value)}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={handleJoinMeeting} color="primary" size="small">
                                                            <SendIcon fontSize="small" />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Stack>
                                ) : (
                                    <Stack spacing={2}>
                                        <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="h6" sx={{ letterSpacing: 2, fontWeight: 800 }}>{roomCode}</Typography>
                                            <Tooltip title="Copy Code">
                                                <IconButton onClick={() => navigator.clipboard.writeText(roomCode)} size="small">
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                        <Button fullWidth variant="outlined" color="error" onClick={handleLeaveMeeting} sx={{ textTransform: 'none' }}>
                                            Leave Meeting
                                        </Button>
                                    </Stack>
                                )}
                            </MuiPaper>

                            <MuiPaper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Quick Key</Typography>
                                <Divider sx={{ mb: 2, opacity: 0.1 }} />
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>A-Z: <Typography component="span" variant="body2" sx={{ opacity: 0.7, fontWeight: 400 }}>Spelling</Typography></Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Space: <Typography component="span" variant="body2" sx={{ opacity: 0.7, fontWeight: 400 }}>Open Palm (B)</Typography></Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Hold: <Typography component="span" variant="body2" sx={{ opacity: 0.7, fontWeight: 400 }}>1.2s to type</Typography></Typography>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 3, opacity: 0.1 }} />
                                <FormControlLabel
                                    control={<Switch size="small" checked={trainingMode} onChange={(e) => setTrainingMode(e.target.checked)} />}
                                    label={<Typography variant="body2">Dev Mode</Typography>}
                                />
                            </MuiPaper>

                            {trainingMode && (
                                <MuiPaper sx={{ p: 3, bgcolor: '#000', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Typography variant="caption" sx={{ color: '#60a5fa', fontWeight: 800, display: 'block', mb: 1 }}>DIAGNOSTICS</Typography>
                                    <Stack spacing={1}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" sx={{ opacity: 0.5 }}>Hand:</Typography>
                                            <Typography variant="caption" sx={{ color: diag.hands ? '#34d399' : '#ef4444' }}>{diag.hands ? diag.handedness : 'No'}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" sx={{ opacity: 0.5 }}>Raw:</Typography>
                                            <Typography variant="caption">{diag.raw}</Typography>
                                        </Box>
                                    </Stack>
                                    <Box sx={{ mt: 2 }}>
                                        <TrainingPanel
                                            classCounts={classCounts}
                                            onAddClass={addClass}
                                            onCapture={captureExample}
                                        />
                                    </Box>
                                </MuiPaper>
                            )}
                        </Stack>
                    </Grid>
                )}
            </Grid>

            <style>{`
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            `}</style>
        </Box >
    );
};

export default SignLanguageDetector;
