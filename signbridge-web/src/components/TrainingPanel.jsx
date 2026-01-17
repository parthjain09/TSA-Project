import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, List, ListItem, ListItemText, Chip, IconButton, Divider } from '@mui/material';
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
        <Paper elevation={0} sx={{ p: 3, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Training Studio
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Teach SignBridge new signs instantly.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                    label="Gesture Name"
                    variant="outlined"
                    size="small"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    fullWidth
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddClass()}
                />
                <IconButton color="primary" onClick={handleAddClass} disabled={!newClassName.trim()} size="large">
                    <AddCircleIcon fontSize="inherit" />
                </IconButton>
            </Box>

            <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

            <List dense sx={{ flexGrow: 1 }}>
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
                                sx={{ borderRadius: 20 }}
                            >
                                Learn
                            </Button>
                        }
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.03)',
                            mb: 1.5,
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                        }}
                    >
                        <ListItemText
                            primary={<Typography variant="subtitle1" fontWeight="500">{label}</Typography>}
                            secondary={`${classCounts[label]} samples`}
                        />
                    </ListItem>
                ))}
                {sortedClasses.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4, opacity: 0.5 }}>
                        <Typography variant="body2">No custom gestures yet.</Typography>
                        <Typography variant="caption">Add one above to start!</Typography>
                    </Box>
                )}
            </List>
        </Paper>
    );
};

export default TrainingPanel;
