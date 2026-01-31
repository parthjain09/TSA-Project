import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Box, Typography, Paper, CircularProgress, Button, Switch, FormControlLabel, Chip, Divider, Grid, Paper as MuiPaper } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { recognizeGesture } from '../utils/gestureRecognition';
import { predict } from '../utils/classifier';
import TrainingPanel from './TrainingPanel';

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

    // Sentence Translation Engine - This was the hardest part to get right!
    // We have to "hold" the sign for a second so it doesn't type by accident.
    const [sentence, setSentence] = useState("");
    const [currentWord, setCurrentWord] = useState("");
    const [lastChar, setLastChar] = useState("");
    const [holdStartTime, setHoldStartTime] = useState(0);
    const TRANSLATION_HOLD_THRESHOLD = 600; // Faster typing (600ms)

    const [trainingMode, setTrainingMode] = useState(false);
    const [isMeetingMode, setIsMeetingMode] = useState(false);
    const [isConverseMode, setIsConverseMode] = useState(false); // New Converse Mode
    const [cameraError, setCameraError] = useState(null);
    // TODO: Add more pre-trained gesture models for full phrases
    const [classCounts, setClassCounts] = useState({});
    const [deviceId, setDeviceId] = useState(undefined);
    const [devices, setDevices] = useState([]);
    const [diag, setDiag] = useState({ state: 'Idle', res: '0x0', hands: false, raw: '---', handedness: 'None' });

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
                        delegate: "GPU" // Try GPU for better performance
                    },
                    runningMode: "VIDEO",
                    numHands: 2,
                    minHandDetectionConfidence: 0.6, // Lower threshold for fewer drops
                    minHandPresenceConfidence: 0.6,
                    minTrackingConfidence: 0.6
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
            // Only clear history if we've lost tracking for a bit
            if (gestureHistory.length > 0) {
                const updatedHistory = [...gestureHistory].slice(1);
                setGestureHistory(updatedHistory);
            }
            return { gesture: newGesture, confidence: newConfidence };
        }

        const updatedHistory = [...gestureHistory, { gesture: newGesture, confidence: newConfidence }].slice(-6); // Smaller buffer for speed
        setGestureHistory(updatedHistory);

        const counts = {};
        const confs = {};
        updatedHistory.forEach(item => {
            counts[item.gesture] = (counts[item.gesture] || 0) + 1;
            confs[item.gesture] = (confs[item.gesture] || 0) + item.confidence;
        });

        const mostCommon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        // Require 4/6 frames for faster response
        if (counts[mostCommon] >= 4) {
            return { gesture: mostCommon, confidence: Math.round(confs[mostCommon] / counts[mostCommon]) };
        }
        return { gesture, confidence };
    };

    const processTranslation = (detected) => {
        if (!detected || ["...", "Ready", "Position Hand"].includes(detected)) {
            setHoldStartTime(0);
            return;
        }

        if (detected === lastChar) {
            if (holdStartTime === 0) {
                setHoldStartTime(Date.now());
            } else {
                const holdDuration = Date.now() - holdStartTime;
                if (holdDuration > TRANSLATION_HOLD_THRESHOLD) {
                    if (detected === 'B' || detected === 'Space') {
                        // Word separator
                        if (currentWord) {
                            setSentence(prev => prev + currentWord + " ");
                            setCurrentWord("");
                        } else if (!sentence.endsWith(" ")) {
                            setSentence(prev => prev + " ");
                        }
                    } else {
                        // Character addition
                        setCurrentWord(prev => prev + detected);
                    }
                    // Reset to prevent double-typing the same instance
                    setLastChar("");
                    setHoldStartTime(0);
                }
            }
        } else {
            setLastChar(detected);
            setHoldStartTime(Date.now());
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
                    let detectedGesture = null;
                    let detectedHand = "Right";

                    // Process all detected hands
                    for (let i = 0; i < results.landmarks.length; i++) {
                        const landmarks = results.landmarks[i];
                        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#60a5fa", lineWidth: 3 });
                        drawingUtils.drawLandmarks(landmarks, { color: "#ffffff", lineWidth: 1, radius: 2 });

                        const hand = results.handedness?.[i]?.[0]?.categoryName || "Right";
                        const raw = recognizeGesture(landmarks, hand);

                        if (raw) {
                            detectedGesture = raw;
                            detectedHand = hand;
                        }
                    }

                    if (detectedGesture) {
                        // Valid gesture detected
                        setDiag(prev => ({ ...prev, hands: true, handedness: detectedHand, raw: detectedGesture, state: 'Translating' }));
                        const final = smoothGesture(detectedGesture, 95);
                        setGesture(final.gesture);
                        setConfidence(final.confidence);
                        processTranslation(final.gesture);
                    } else {
                        // No specific gesture recognized
                        setGesture("Unknown Sign");
                        setHoldStartTime(0);
                    }
                } else {
                    setDiag(prev => ({ ...prev, hands: false, raw: '---', state: 'Scanning...' }));
                    setGesture(webcamRunning ? "Position Hand" : "Ready");
                    setConfidence(0);
                    setGestureHistory([]);
                    setHoldStartTime(0);
                }
            } catch (err) {
                console.error("Prediction Error:", err);
                setDiag(prev => ({ ...prev, state: 'Error: ' + err.message }));
            }
        }
        if (webcamRunning) requestAnimationFrame(predictFrame);
    };

    useEffect(() => {
        if (webcamRunning) requestAnimationFrame(predictFrame);
    }, [webcamRunning, handLandmarker]);

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#050510',
            p: isMeetingMode ? 0 : 4,
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

            <Grid container spacing={isMeetingMode ? 0 : 4} sx={{ flexGrow: 1, maxWidth: 1400, mx: 'auto' }}>
                {/* Left: Main Interaction Area */}
                <Grid item xs={12} md={isMeetingMode ? 12 : 9}>
                    <MuiPaper elevation={0} sx={{
                        position: 'relative',
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: isMeetingMode ? 0 : 6,
                        overflow: 'hidden',
                        height: isMeetingMode ? '75vh' : '550px',
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
                                    sx={{
                                        bgcolor: '#60a5fa',
                                        px: 6,
                                        py: 2,
                                        borderRadius: 4,
                                        fontSize: '1.1rem',
                                        textTransform: 'none',
                                        boxShadow: '0 8px 25px rgba(96, 165, 250, 0.3)',
                                        '&:hover': { bgcolor: '#3b82f6' }
                                    }}
                                >
                                    Activate Camera & Sensors
                                </Button>

                                <Box sx={{ mt: 6, opacity: 0.4 }}>
                                    <Typography variant="body2">Privacy Layer: Active (Local processing only)</Typography>
                                    <Typography variant="body2">Language: ASL Alphabet v2.1</Typography>
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
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff' }}>{gesture}</Typography>
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
                        mt: 3,
                        p: 3,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Typography variant="h5" sx={{ fontFamily: 'monospace', opacity: sentence ? 1 : 0.4 }}>
                            {sentence || "Translation will appear here..."}
                            <Box component="span" sx={{ bgcolor: '#60a5fa', width: '2px', height: '1em', display: 'inline-block', ml: 1, animation: 'blink 1s infinite' }} />
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={() => setSentence("")} sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none' }}>Clear</Button>
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
                </Grid>

                {/* Right: Sidebar */}
                {!isMeetingMode && (
                    <Grid item xs={12} md={3}>
                        <Stack spacing={3}>
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
        </Box>
    );
};

const Stack = ({ children, spacing }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing }}>{children}</Box>
);

export default SignLanguageDetector;
