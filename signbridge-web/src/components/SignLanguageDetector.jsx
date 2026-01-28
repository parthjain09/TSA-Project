import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Box, Typography, Paper, CircularProgress, Button, Switch, FormControlLabel, Chip, Divider, Fade, Zoom } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import InfoIcon from '@mui/icons-material/Info';
import { recognizeGesture } from '../utils/gestureRecognition';
import { addExample, predict, getClassInfo } from '../utils/classifier';
import TrainingPanel from './TrainingPanel';

const SignLanguageDetector = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    // This ref stores the latest hand points so we can save them for training later
    const currentLandmarksRef = useRef(null);

    // State variables for the app
    const [webcamRunning, setWebcamRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [handLandmarker, setHandLandmarker] = useState(null);
    const [gesture, setGesture] = useState("Ready");
    const [confidence, setConfidence] = useState(0);
    const [gestureHistory, setGestureHistory] = useState([]);

    // Sentence Engine State
    const [sentence, setSentence] = useState("");
    const [currentWord, setCurrentWord] = useState("");
    const [lastChar, setLastChar] = useState("");
    const [holdStartTime, setHoldStartTime] = useState(0);
    const LETTER_HOLD_THRESHOLD = 1200; // 1.2s to type a letter

    const [trainingMode, setTrainingMode] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [classCounts, setClassCounts] = useState({});
    const [deviceId, setDeviceId] = useState(undefined);
    const [devices, setDevices] = useState([]);
    const [diag, setDiag] = useState({ state: 'Idle', track: 'None', ready: 0, res: '0x0', hands: false });

    const handleDevices = useCallback((mediaDevices) => {
        setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput"));
    }, []);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }, [handleDevices]);

    // load model
    // makes the hand mesh
    useEffect(() => {
        const initHandLandmarker = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );

                // setup detector
                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU" // fast mode
                    },
                    runningMode: "VIDEO",
                    numHands: 1,
                    minHandDetectionConfidence: 0.7,
                    minHandPresenceConfidence: 0.7,
                    minTrackingConfidence: 0.7
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
        setCameraError(null);
        setDiag(prev => ({ ...prev, state: 'Requesting...' }));
        try {
            const constraints = {
                video: deviceId ? {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            console.log("Requesting camera with constraints:", constraints);

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Stream acquired:", stream.id);

            const video = videoRef.current;
            if (video) {
                video.srcObject = stream;

                // Track metadata and readiness
                const track = stream.getVideoTracks()[0];
                setDiag(prev => ({
                    ...prev,
                    state: 'Attaching...',
                    track: track ? `${track.label} (${track.readyState})` : 'No Track'
                }));

                // Force play as soon as possible
                video.onloadedmetadata = () => {
                    console.log("Metadata loaded. Forcing play.");
                    setDiag(prev => ({ ...prev, res: `${video.videoWidth}x${video.videoHeight}`, state: 'Metadata OK' }));
                    video.play().catch(e => console.error("Auto-play failed:", e));
                };

                video.onloadeddata = () => {
                    console.log("Data loaded. Stream should be visible.");
                    setDiag(prev => ({ ...prev, state: 'Streaming', ready: video.readyState }));
                    video.play();
                };

                // Fallback: If neither event fires in 2 seconds, force it
                setTimeout(() => {
                    if (video && video.paused) {
                        console.log("Fallback: Forcing video play");
                        video.play();
                        setDiag(prev => ({ ...prev, state: 'Forced Play', ready: video.readyState }));
                    }
                }, 2000);
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setCameraError(`${err.name}: ${err.message}`);
            setWebcamRunning(false);
            setDiag(prev => ({ ...prev, state: `Err: ${err.name}` }));

            // Fallback if specific ID failed
            if (deviceId) {
                console.log("Retrying with generic constraints...");
                setDeviceId(undefined);
            }
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

    const handleAddClass = (label) => {
        const newCounts = { ...classCounts };
        if (!newCounts[label]) newCounts[label] = 0;
        setClassCounts(newCounts);
    };

    const handleCapture = (label) => {
        if (currentLandmarksRef.current) {
            addExample(currentLandmarksRef.current, label);
            setClassCounts(getClassInfo());
        }
    };

    // Temporal smoothing: Use majority voting from last 5 frames
    const smoothGesture = (newGesture, newConfidence) => {
        if (!newGesture || newGesture === '...' || newGesture === 'Ready' || newGesture === 'Position Hand') {
            setGestureHistory([]);
            return { gesture: newGesture, confidence: newConfidence };
        }

        const updatedHistory = [...gestureHistory, { gesture: newGesture, confidence: newConfidence }].slice(-5);
        setGestureHistory(updatedHistory);

        // Count occurrences
        const gestureCounts = {};
        let totalConfidence = 0;
        updatedHistory.forEach(item => {
            gestureCounts[item.gesture] = (gestureCounts[item.gesture] || 0) + 1;
            if (item.gesture === newGesture) totalConfidence += item.confidence;
        });

        // Find most common gesture
        const mostCommon = Object.keys(gestureCounts).reduce((a, b) =>
            gestureCounts[a] > gestureCounts[b] ? a : b
        );

        // Only update if gesture appears in at least 3 of last 5 frames
        if (gestureCounts[mostCommon] >= 3) {
            const avgConfidence = Math.round(totalConfidence / gestureCounts[newGesture]);
            return { gesture: mostCommon, confidence: avgConfidence };
        }

        return { gesture: gesture, confidence: confidence }; // Keep previous
    };

    // sentence typer
    // waits 1.2s to type
    const processSentenceEngine = (detectedGesture) => {
        // checks for letters
        if (!detectedGesture || detectedGesture === '...' || detectedGesture === 'Ready' || detectedGesture === 'Detecting...') {
            setHoldStartTime(0);
            return;
        }

        // Special Gestures
        if (detectedGesture === 'Hello') return; // Ignore greeting

        // Check if same gesture is being held
        if (detectedGesture === lastChar) {
            if (holdStartTime === 0) {
                setHoldStartTime(Date.now());
            } else {
                const heldDuration = Date.now() - holdStartTime;
                if (heldDuration > LETTER_HOLD_THRESHOLD) {
                    // Action Triggered!
                    if (detectedGesture === 'Space' || detectedGesture === 'B') { // B/Open Palm as Space
                        setSentence(prev => prev + (currentWord ? currentWord + " " : ""));
                        setCurrentWord("");
                        // Haptic/Visual feedback could go here
                    } else {
                        setCurrentWord(prev => prev + detectedGesture);
                    }
                    setLastChar(""); // Reset to force re-hold
                    setHoldStartTime(0);
                }
            }
        } else {
            // New gesture detected, reset timer
            setLastChar(detectedGesture);
            setHoldStartTime(Date.now());
        }
    };

    const predictFrame = async () => {
        if (webcamRunning && handLandmarker && videoRef.current?.readyState >= 2) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            const results = handLandmarker.detectForVideo(video, performance.now());
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.landmarks?.length > 0) {
                if (!diag.hands) setDiag(prev => ({ ...prev, hands: true }));
                const landmarks = results.landmarks[0];
                currentLandmarksRef.current = landmarks;

                const drawingUtils = new DrawingUtils(ctx);
                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#4facfe80", lineWidth: 3 });
                drawingUtils.drawLandmarks(landmarks, { color: "#00f2fe80", lineWidth: 1, radius: 2 });

                if (Object.keys(classCounts).length > 0) {
                    // check AI
                    const res = await predict(landmarks);
                    if (res?.confidences[res.label] > 0.7) {
                        const s = smoothGesture(res.label, Math.round(res.confidences[res.label] * 100));
                        setGesture(s.gesture);
                        setConfidence(s.confidence);
                        processSentenceEngine(s.gesture);
                    } else {
                        // bad match
                        setGesture("...");
                        setConfidence(0);
                    }
                } else {
                    // check geometry
                    // get current hand
                    let hand = "Right";
                    // get hand info
                    if (results.handedness && results.handedness.length > 0) {
                        hand = results.handedness[0][0].categoryName;
                    }

                    // run math
                    const g = recognizeGesture(landmarks, hand);
                    const val = g || "Position Hand";

                    // trust the math
                    const conf = g ? 95 : 0;

                    // smooth it
                    const final = smoothGesture(val, conf);
                    setGesture(final.gesture);
                    setConfidence(final.confidence);

                    // add to sentence
                    processSentenceEngine(final.gesture);
                }
            } else {
                // lost hand
                if (diag.hands) setDiag(prev => ({ ...prev, hands: false }));
                currentLandmarksRef.current = null;
                setGestureHistory([]); // Reset history when no hand
                setGesture(webcamRunning ? "Position Hand" : "Ready");
                setConfidence(0);
            }
        }

        if (webcamRunning) requestAnimationFrame(predictFrame);
    };

    useEffect(() => {
        if (webcamRunning) {
            const frameId = requestAnimationFrame(predictFrame);
            return () => cancelAnimationFrame(frameId);
        }
    }, [webcamRunning, handLandmarker, classCounts]);

    return (
        <Box className="container">
            {/* Header: Basic and Clean */}
            <Typography variant="h4" align="center" gutterBottom style={{ color: 'var(--primary-color)', fontFamily: 'var(--font-family)' }}>
                SignLanguage Detector v1.0
            </Typography>

            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
                {/* Main Camera View - No Glass, Simple Border */}
                <Box flex={1} className="simple-panel" display="flex" flexDirection="column" alignItems="center">
                    <Box position="relative" width="100%" style={{ backgroundColor: '#000', borderRadius: '4px', overflow: 'hidden' }}>
                        {/* Camera & Overlay */}
                        <video
                            ref={videoRef}
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: webcamRunning ? 'block' : 'none',
                                transform: 'scaleX(-1)' // Mirror effect
                            }}
                            autoPlay
                            playsInline
                        />
                        <canvas
                            ref={canvasRef}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                transform: 'scaleX(-1)'
                            }}
                        />
                        {/* Simple "Loading" Text if needed */}
                        {loading && webcamRunning && (
                            <Box position="absolute" top="50%" left="50%" style={{ transform: 'translate(-50%, -50%)', color: 'white' }}>
                                Loading Model...
                            </Box>
                        )}

                        {/* Simple Result Overlay */}
                        <Box
                            position="absolute"
                            bottom={10}
                            left="50%"
                            style={{
                                transform: 'translateX(-50%)',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                textAlign: 'center'
                            }}
                        >
                            <Typography variant="h5" style={{ color: '#fff' }}>
                                {gesture}
                            </Typography>
                            <Typography variant="caption" style={{ color: '#ccc' }}>
                                Confidence: {confidence}%
                            </Typography>
                        </Box>
                    </Box>

                    {/* Controls: Standard Buttons */}
                    <Box mt={2} display="flex" gap={2}>
                        <Button
                            variant="contained"
                            color={webcamRunning ? "secondary" : "primary"}
                            onClick={() => setWebcamRunning(!webcamRunning)}
                        >
                            {webcamRunning ? "Stop Camera" : "Start Camera"}
                        </Button>
                    </Box>

                    {/* Sentence Output: Simple Text Box */}
                    <Paper elevation={0} style={{ width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#333', border: '1px solid #555' }}>
                        <Typography variant="subtitle2" style={{ color: '#aaa', marginBottom: '5px' }}>
                            DETECTED SENTENCE:
                        </Typography>
                        <Box display="flex" alignItems="center">
                            <Typography variant="h6" style={{ fontFamily: 'var(--font-family)', flexGrow: 1, color: '#fff' }}>
                                {sentence}<span className="caret"></span>
                            </Typography>
                            <Button size="small" variant="outlined" onClick={() => { setSentence(""); setCurrentWord(""); }}>
                                CLEAR
                            </Button>
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                            Word Buffer: {currentWord}...
                        </Typography>
                    </Paper>

                </Box>

                {/* Info Panel: Initial Student Guide */}
                <Box flexBasis={{ xs: '100%', md: '250px' }} className="simple-panel">
                    <Typography variant="h6" gutterBottom>
                        Quick Key
                    </Typography>
                    <Divider style={{ marginBottom: '10px' }} />

                    <Typography variant="body2" paragraph>
                        <strong>A-Z:</strong> Spelling
                    </Typography>
                    <Typography variant="body2" paragraph>
                        <strong>Space:</strong> Open Palm (B)
                    </Typography>
                    <Typography variant="body2" paragraph>
                        <strong>Hold:</strong> 1.2s to type
                    </Typography>

                    <Divider style={{ margin: '10px 0' }} />
                    {/* Training Mode Toggle - Hidden/Basic */}
                    <FormControlLabel
                        control={<Switch size="small" checked={trainingMode} onChange={(e) => setTrainingMode(e.target.checked)} />}
                        label={<Typography variant="caption">Dev Mode</Typography>}
                    />

                    {trainingMode && (
                        <Box mt={2}>
                            <TrainingPanel
                                addExample={handleCapture}
                                classCounts={classCounts}
                                clearAll={handleClearAll}
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default SignLanguageDetector;
