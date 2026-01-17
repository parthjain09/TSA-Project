import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Box, Typography, Paper, CircularProgress, Button, Container, Grid, Switch, FormControlLabel, Chip, Divider } from '@mui/material';
import { recognizeGesture } from '../utils/gestureRecognition';
import { addExample, predict, getClassInfo } from '../utils/classifier';
import TrainingPanel from './TrainingPanel';

const SignLanguageDetector = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const currentLandmarksRef = useRef(null);

    const [webcamRunning, setWebcamRunning] = useState(true); // Auto-start camera
    const [loading, setLoading] = useState(true);
    const [handLandmarker, setHandLandmarker] = useState(null);
    const [gesture, setGesture] = useState("Ready");
    const [confidence, setConfidence] = useState(0);

    // Training State
    const [trainingMode, setTrainingMode] = useState(false);
    const [classCounts, setClassCounts] = useState({});

    useEffect(() => {
        const createHandLandmarker = async () => {
            try {
                // Safety timeout: If model takes > 8s, unlock UI (likely offline/network issue)
                const timeoutId = setTimeout(() => {
                    console.warn("Model load timed out. Unlocking UI.");
                    setLoading(false);
                }, 8000);

                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );
                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1,
                    minHandDetectionConfidence: 0.7,
                    minHandPresenceConfidence: 0.7,
                    minTrackingConfidence: 0.7
                });
                setHandLandmarker(landmarker);
                clearTimeout(timeoutId);
                setLoading(false);
            } catch (error) {
                console.error("Error creating hand landmarker:", error);
                setLoading(false);
            }
        };
        createHandLandmarker();
    }, []);

    const enableCam = () => {
        if (!handLandmarker) {
            console.warn("HandLandmarker not loaded. Starting camera without recognition.");
            // Allow camera to start so user sees something (graceful degradation)
        }
        setWebcamRunning(!webcamRunning);
    };

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

    const predictWebcam = async () => {
        if (webcamRunning && handLandmarker && webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
            const video = webcamRef.current.video;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            let startTimeMs = performance.now();
            const results = handLandmarker.detectForVideo(video, startTimeMs);

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const drawingUtils = new DrawingUtils(ctx);

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                currentLandmarksRef.current = landmarks;

                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                    color: "rgba(0, 255, 0, 0.6)",
                    lineWidth: 4
                });
                drawingUtils.drawLandmarks(landmarks, { color: "rgba(255, 0, 0, 0.6)", lineWidth: 2 });

                if (Object.keys(classCounts).length > 0) {
                    const result = await predict(landmarks);
                    if (result && result.confidences[result.label] > 0.7) {
                        setGesture(result.label);
                        setConfidence(Math.round(result.confidences[result.label] * 100));
                    } else {
                        setGesture("Unknown");
                        setConfidence(0);
                    }
                } else {
                    const recognized = recognizeGesture(landmarks);
                    if (recognized) {
                        setGesture(recognized);
                        setConfidence(100);
                    } else {
                        setGesture("Thinking...");
                        setConfidence(0);
                    }
                }
            } else {
                currentLandmarksRef.current = null;
                setGesture("Show Hand");
                setConfidence(0);
            }
            ctx.restore();
        }

        if (webcamRunning) {
            requestAnimationFrame(predictWebcam);
        }
    };

    useEffect(() => {
        if (webcamRunning) requestAnimationFrame(predictWebcam);
    }, [webcamRunning, handLandmarker, classCounts]);

    return (
        <Box sx={{
            height: '100vh',
            width: '100vw',
            bgcolor: 'background.default',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: '800', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', backgroundClip: 'text', color: 'transparent', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    SignBridge AI
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                    <Chip label={webcamRunning ? "Live Camera" : "Offline"} color={webcamRunning ? "success" : "default"} variant="outlined" />
                    <FormControlLabel
                        control={<Switch checked={trainingMode} onChange={(e) => setTrainingMode(e.target.checked)} color="secondary" />}
                        label={<Typography sx={{ fontWeight: 600 }}>Training Mode</Typography>}
                    />
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexGrow: 1, overflow: 'hidden' }}>
                {/* Main Video Area */}
                <Box sx={{ flex: 2, position: 'relative', bgcolor: '#000', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                    {loading && (
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', textAlign: 'center', zIndex: 20 }}>
                            <CircularProgress color="secondary" />
                            <Typography variant="h6" sx={{ mt: 2 }}>Loading Neural Network...</Typography>
                        </Box>
                    )}

                    {!webcamRunning && !loading && (
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center', width: '100%' }}>
                            <Typography variant="h5" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>Ready to bridge communication?</Typography>
                            <Button variant="contained" size="large" onClick={enableCam} sx={{ fontSize: '1.2rem', py: 1.5, px: 4, borderRadius: 50, background: 'linear-gradient(to right, #3b82f6, #8b5cf6)' }}>
                                Start Camera
                            </Button>
                        </Box>
                    )}

                    <Webcam
                        ref={webcamRef}
                        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', visibility: webcamRunning ? 'visible' : 'hidden' }}
                        mirrored={true}
                    />
                    <canvas
                        ref={canvasRef}
                        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Gesture Overlay */}
                    <Box sx={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', zIndex: 15 }}>
                        <Box sx={{ display: 'inline-block', backdropFilter: 'blur(10px)', bgcolor: 'rgba(0,0,0,0.6)', px: 4, py: 2, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                                {gesture}
                            </Typography>
                            {confidence > 0 && <Typography variant="caption" sx={{ color: '#94a3b8' }}>Confidence: {confidence}%</Typography>}
                        </Box>
                    </Box>
                </Box>

                {/* Side Panel (Training or Info) */}
                <Box sx={{ flex: 1, minWidth: '300px', height: '100%' }}>
                    {trainingMode ? (
                        <TrainingPanel
                            classCounts={classCounts}
                            onAddClass={handleAddClass}
                            onCapture={handleCapture}
                        />
                    ) : (
                        <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                            <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">Quick Guide</Typography>

                            <Box sx={{ my: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">👋 Hello / B</Typography>
                                <Typography variant="body2" color="text.secondary">Open hand, fingers together.</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ my: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">✊ Yes / A / S</Typography>
                                <Typography variant="body2" color="text.secondary">Closed fist.</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ my: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">🤏 No</Typography>
                                <Typography variant="body2" color="text.secondary">Pinch thumb to index/middle fingers.</Typography>
                            </Box>

                            <Box sx={{ mt: 'auto', p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="primary">💡 Pro Tip</Typography>
                                <Typography variant="caption">Switch to <strong>Training Mode</strong> to teach the AI your own custom signs like "Thank You" or your name!</Typography>
                            </Box>
                        </Paper>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default SignLanguageDetector;
