import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, List, ListItem, ListItemText, IconButton, Divider, Fade } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CameraIcon from '@mui/icons-material/Camera';

// This component is where we can actually "teach" the AI new signs.
// We added this because sometimes the pre-trained models don't recognize 
// specific hand shapes correctly, so this lets the user fix it.
const TrainingPanel = ({ classCounts, onAddClass, onCapture }) => {
    const [newClassName, setNewClassName] = useState("");

    const handleAddClass = () => {
        // Just checking if they actually typed a name
        if (newClassName.trim()) {
            onAddClass(newClassName.trim());
            setNewClassName("");
        }
    };

    const sortedClasses = Object.keys(classCounts).sort();

    return (
        <Paper className="simple-panel" elevation={0} sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)' }}>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: 'var(--primary-color)' }}>
                Teach The Bot
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: 'var(--text-color)' }}>
                Click the button to add examples so it learns.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 4 }}>
                <TextField
                    placeholder="Letter Name"
                    variant="standard"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            bgcolor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            px: 2,
                            py: 0.5,
                            color: '#fff',
                            fontSize: '14px',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'var(--accent-blue)' },
                            '&.Mui-focused': { borderColor: 'var(--accent-blue)', bgcolor: 'rgba(255,255,255,0.05)' }
                        }
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddClass()}
                />
                <IconButton
                    onClick={handleAddClass}
                    disabled={!newClassName.trim()}
                    sx={{
                        color: 'var(--accent-blue)',
                        bgcolor: 'rgba(79, 172, 254, 0.1)',
                        borderRadius: '12px',
                        '&.Mui-disabled': { color: 'rgba(255,255,255,0.1)', bgcolor: 'transparent' }
                    }}
                >
                    <AddCircleIcon />
                </IconButton>
            </Box>

            <Divider sx={{ mb: 3, opacity: 0.05 }} />

            <List sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                {sortedClasses.map((label, index) => (
                    <Fade in={true} timeout={300 + index * 100} key={label}>
                        <ListItem
                            secondaryAction={
                                <Button
                                    variant="contained"
                                    startIcon={<CameraIcon />}
                                    onClick={() => onCapture(label)}
                                    sx={{
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        boxShadow: 'none',
                                        background: 'linear-gradient(45deg, var(--accent-blue), var(--accent-cyan))',
                                        '&:hover': { transform: 'scale(1.05)' }
                                    }}
                                >
                                    CAPTURE
                                </Button>
                            }
                            sx={{
                                background: 'rgba(255,255,255,0.02)',
                                mb: 2,
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.2s',
                                '&:hover': { background: 'rgba(255,255,255,0.04)', borderColor: 'var(--accent-blue)' }
                            }}
                        >
                            <ListItemText
                                primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff' }}>{label}</Typography>}
                                secondary={
                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                        {classCounts[label]} payloads
                                    </Typography>
                                }
                            />
                        </ListItem>
                    </Fade>
                ))}

                {sortedClasses.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 8, opacity: 0.3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Zero Weights Loaded</Typography>
                        <Typography variant="caption">Define a class above to begin training.</Typography>
                    </Box>
                )}
            </List>
        </Paper>
    );
};

export default TrainingPanel;
