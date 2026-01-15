import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, List, ListItem, ListItemText, Chip, IconButton } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CameraIcon from '@mui/icons-material/Camera';

const TrainingPanel = ({ classCounts, onAddClass, onCapture }) => {
    const [newClassName, setNewClassName] = useState("");

    const handleAddClass = () => {
        if (newClassName.trim()) {
            onAddClass(newClassName.trim());
            setNewClassName("");
        }
    };

    const sortedClasses = Object.keys(classCounts).sort();

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>
                Training Mode
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                1. Name a gesture
                2. Click "+" to add it
                3. Hold the gesture and click "Capture" repeatedly to train
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                    label="New Gesture Name"
                    variant="outlined"
                    size="small"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    fullWidth
                    onKeyPress={(e) => e.key === 'Enter' && handleAddClass()}
                />
                <IconButton color="primary" onClick={handleAddClass} disabled={!newClassName.trim()}>
                    <AddCircleIcon />
                </IconButton>
            </Box>

            <List dense>
                {sortedClasses.map((label) => (
                    <ListItem
                        key={label}
                        secondaryAction={
                            <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                startIcon={<CameraIcon />}
                                onClick={() => onCapture(label)}
                            >
                                Capture
                            </Button>
                        }
                        sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 1 }}
                    >
                        <ListItemText
                            primary={<Typography variant="subtitle2">{label}</Typography>}
                        />
                        <Chip label={`${classCounts[label]} samples`} size="small" variant="outlined" sx={{ mr: 2 }} />
                    </ListItem>
                ))}
                {sortedClasses.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                        No custom gestures yet.
                    </Typography>
                )}
            </List>
        </Paper>
    );
};

export default TrainingPanel;
