import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Box, Typography, Paper, CircularProgress, Button, Container, Grid, Switch, FormControlLabel, Chip, Divider } from '@mui/material';
import { recognizeGesture } from '../utils/gestureRecognition';
import { addExample, predict, getClassInfo } from '../utils/classifier';
import TrainingPanel from './TrainingPanel';

const SignLanguageDetector = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const currentLandmarksRef = useRef(null);

    const [webcamRunning, setWebcamRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [handLandmarker, setHandLandmarker] = useState(null);
    const [gesture, setGesture] = useState("Ready");
    const [confidence, setConfidence] = useState(0);

    // Training State
    const [trainingMode, setTrainingMode] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [classCounts, setClassCounts] = useState({});
    const [deviceId, setDeviceId] = useState(undefined);
    const [devices, setDevices] = useState([]);

    const handleDevices = useCallback((mediaDevices) => {
        setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput"));
    }, [setDevices]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }, [handleDevices]);

    useEffect(() => {
        setWebcamRunning(false); // Force off on mount
        const createHandLandmarker = async () => {
            try {
                // Safety timeout
                const timeoutId = setTimeout(() => {
                    console.warn("Model load timed out. Unlocking UI.");
                    setLoading(false);
                }, 3000);

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

    const startCamera = async () => {
        setCameraError(null);
        try {
            // RELAXED CONSTRAINTS: Match the working diagnostic mode exactly first
            const constraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : true
            };

            console.log("Requesting camera with constraints:", JSON.stringify(constraints));
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                    console.log("Video data loaded");
                    videoRef.current.play().catch(e => setCameraError("Play failed: " + e.message));
                };
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setCameraError(err.name + ": " + err.message);
            setWebcamRunning(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    // Watch webcamRunning to toggle camera
    useEffect(() => {
        if (webcamRunning) {
            startCamera();
        } else {
            stopCamera();
        }
    }, [webcamRunning, deviceId]);

    const enableCam = () => {
        if (!handLandmarker) {
            console.warn("HandLandmarker not loaded. Starting camera without recognition.");
        }
        setWebcamRunning(prev => !prev);
    };

    const testCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            alert(`SUCCESS: Stream Active!\nLabel: ${track.label}\nReadyState: ${track.readyState}\nVariable Res: ${settings.width}x${settings.height}`);
            // Stop stream immediately
            track.stop();
        } catch (err) {
            alert("FAILURE: " + err.name + ": " + err.message);
        }
    };

    const forceStart = async () => {
        try {
            alert("1. Requesting Camera...");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            alert("2. Got Stream: " + stream.id + "\nTracks: " + stream.getTracks().length);

            if (videoRef.current) {
                alert("3. Video Element Found. Assigning...");
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    alert("4. Metadata Loaded. Playing...");
                    videoRef.current.play()
                        .then(() => alert("5. Playing Success!"))
                        .catch(e => alert("Play Error: " + e.message));
                };
            } else {
                alert("ERROR: Video Ref is NULL");
            }
        } catch (e) {
            alert("Force Error: " + e.name + " - " + e.message);
        }
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
        // Ensure video is playing and has data
        if (webcamRunning && handLandmarker && videoRef.current && videoRef.current.readyState >= 2) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

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
                    if (recognized && recognized.gesture) {
                        setGesture(recognized.gesture);
                        setConfidence(recognized.confidence || 100);
                    } else {
                        setGesture("Thinking...");
                        setConfidence(0);
                    }
                }
            } else {
                currentLandmarksRef.current = null;
                setGesture(webcamRunning ? "Show Hand" : "Ready");
                setConfidence(0);
            }
            ctx.restore();
        }

        if (webcamRunning) {
            requestAnimationFrame(predictWebcam);
        }
    };

    // Start prediction loop only when webcam starts
    useEffect(() => {
        if (webcamRunning) {
            const animationId = requestAnimationFrame(predictWebcam);
            return () => cancelAnimationFrame(animationId);
        }
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
                    {webcamRunning && devices.length > 1 && (
                        <select
                            onChange={(e) => setDeviceId(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                padding: '5px 10px'
                            }}
                        >
                            {devices.map((device, key) => (
                                <option key={key} value={device.deviceId} style={{ color: 'black' }}>
                                    {device.label || `Camera ${key + 1}`}
                                </option>
                            ))}
                        </select>
                    )}
                    <Chip
                        label={webcamRunning ? "Stop Camera" : "Offline"}
                        color={webcamRunning ? "success" : "default"}
                        variant={webcamRunning ? "filled" : "outlined"}
                        onClick={() => setWebcamRunning(!webcamRunning)}
                        sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    />
                    <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        onClick={testCamera}
                        sx={{ borderRadius: 4 }}
                    >
                        Diag
                    </Button>
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

                    {!webcamRunning && !loading && !cameraError && (
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center', width: '100%' }}>
                            <Typography variant="h5" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>Ready to bridge communication?</Typography>
                            <Box display="flex" gap={2} justifyContent="center">
                                <Button variant="contained" size="large" onClick={enableCam} sx={{ fontSize: '1.2rem', py: 1.5, px: 4, borderRadius: 50, background: 'linear-gradient(to right, #3b82f6, #8b5cf6)' }}>
                                    Start Camera
                                </Button>
                                <Button variant="outlined" size="large" onClick={testCamera} sx={{ fontSize: '1rem', py: 1.5, px: 3, borderRadius: 50, color: '#aaa', borderColor: '#555' }}>
                                    Test Hardware
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {cameraError && (
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, textAlign: 'center', width: '80%', bgcolor: 'rgba(255,0,0,0.1)', p: 4, borderRadius: 4, border: '1px solid red' }}>
                            <Typography variant="h5" color="error" gutterBottom>Camera Error</Typography>
                            <Typography color="white">{cameraError}</Typography>
                            <Button variant="outlined" color="error" sx={{ mt: 2 }} onClick={() => { setCameraError(null); setWebcamRunning(false); }}>
                                Retry
                            </Button>
                        </Box>
                    )}

                    <video
                        ref={videoRef}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: webcamRunning ? 'block' : 'none',
                            transform: 'scaleX(-1)' // Mirror effect
                        }}
                        autoPlay
                        playsInline
                        muted
                    />
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scaleX(-1)' // Mirror effect for canvas too
                        }}
                    />

                    {/* Debug Overlay */}
                    {webcamRunning && (
                        <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 20, bgcolor: 'rgba(0,0,0,0.7)', color: '#0f0', p: 1, fontSize: '10px' }}>
                            <Button size="small" variant="contained" color="error" onClick={forceStart} sx={{ mb: 1 }}>FORCE CONNECT</Button><br />
                            DEBUG: <br />
                            Ref: {videoRef.current ? "OK" : "NULL"} <br />
                            Src: {videoRef.current?.srcObject ? "ACTIVE" : "NONE"} <br />
                            State: {videoRef.current?.readyState} <br />
                            Paused: {videoRef.current?.paused ? "YES" : "NO"} <br />
                            Size: {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}
                        </Box>
                    )}

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
