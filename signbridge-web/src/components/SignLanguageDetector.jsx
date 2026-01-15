
import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Box, Typography, Paper, CircularProgress, Button, Container, Grid, Switch, FormControlLabel } from '@mui/material';
import { recognizeGesture } from '../utils/gestureRecognition';
import { addExample, predict, getClassInfo } from '../utils/classifier';
import TrainingPanel from './TrainingPanel';

const SignLanguageDetector = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const currentLandmarksRef = useRef(null); // Store latest landmarks for capturing

    const [webcamRunning, setWebcamRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [handLandmarker, setHandLandmarker] = useState(null);
    const [gesture, setGesture] = useState("Waiting for hands...");
    const [confidence, setConfidence] = useState(0);

    // Training State
    const [trainingMode, setTrainingMode] = useState(false);
    const [classCounts, setClassCounts] = useState({});

    // Initialize HandLandmarker
    useEffect(() => {
        const createHandLandmarker = async () => {
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
                    numHands: 1 // Simplify to 1 hand for training consistency
                });
                setHandLandmarker(landmarker);
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
            console.log("Wait for handLandmarker to load before clicking!");
            return;
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
            // Update counts
            setClassCounts(getClassInfo());
            console.log(`Captured example for ${label}`);
        } else {
            console.log("No hands detected to capture!");
        }
    };

    const predictWebcam = async () => {
        if (webcamRunning && handLandmarker && webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
            const video = webcamRef.current.video;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            let startTimeMs = performance.now();
            const results = handLandmarker.detectForVideo(video, startTimeMs);

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const drawingUtils = new DrawingUtils(ctx);

            if (results.landmarks && results.landmarks.length > 0) {
                // Only take the first hand for simplicity in MVP training
                const landmarks = results.landmarks[0];
                currentLandmarksRef.current = landmarks;

                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 5
                });
                drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });

                // Prediction Logic
                if (Object.keys(classCounts).length > 0) {
                    // Use KNN if available
                    const result = await predict(landmarks);
                    if (result && result.confidences[result.label] > 0.7) {
                        setGesture(result.label);
                        setConfidence(Math.round(result.confidences[result.label] * 100));
                    } else {
                        setGesture("Unknown (Train more)");
                        setConfidence(0);
                    }
                } else {
                    // Fallback to static rules
                    const recognized = recognizeGesture(landmarks);
                    if (recognized) {
                        setGesture(recognized);
                        setConfidence(100);
                    } else {
                        setGesture("Unknown Gesture");
                        setConfidence(0);
                    }
                }

            } else {
                currentLandmarksRef.current = null;
                setGesture("No Hands Detected");
                setConfidence(0);
            }
            ctx.restore();
        }

        if (webcamRunning) {
            requestAnimationFrame(predictWebcam);
        }
    };

    useEffect(() => {
        if (webcamRunning) {
            requestAnimationFrame(predictWebcam);
        }
    }, [webcamRunning, handLandmarker, classCounts]);

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>
                SignBridge AI
            </Typography>

            <Grid container spacing={3}>
                {/* Main Video Area */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#e3f2fd' }}>
                        <Box>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                                {gesture}
                            </Typography>
                            {confidence > 0 && <Typography variant="caption">Confidence: {confidence}%</Typography>}
                        </Box>
                        <FormControlLabel
                            control={<Switch checked={trainingMode} onChange={(e) => setTrainingMode(e.target.checked)} />}
                            label="Training Mode"
                        />
                    </Paper>

                    <Box sx={{ position: 'relative', width: '100%', height: '540px', bgcolor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                        {loading && (
                            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
                                <CircularProgress color="inherit" />
                                <Typography variant="h6" sx={{ mt: 2 }}>Loading AI Model...</Typography>
                            </Box>
                        )}

                        {!webcamRunning && !loading && (
                            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                                <Button variant="contained" size="large" onClick={enableCam}>
                                    Enable Webcam
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
                    </Box>
                </Grid>

                {/* Training Panel */}
                <Grid item xs={12} md={4}>
                    {trainingMode ? (
                        <TrainingPanel
                            classCounts={classCounts}
                            onAddClass={handleAddClass}
                            onCapture={handleCapture}
                        />
                    ) : (
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6">How to use:</Typography>
                            <Typography paragraph>1. Enable Webcam.</Typography>
                            <Typography paragraph>2. Show gestures 'Hello', 'Yes' (Fist), 'No' (Pinch).</Typography>
                            <Typography paragraph>3. Switch to <strong>Training Mode</strong> to teach new signs!</Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
};

export default SignLanguageDetector;
