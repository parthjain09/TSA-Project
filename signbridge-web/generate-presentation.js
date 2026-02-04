const pptxgen = require('pptxgenjs');
const fs = require('fs');

// Create a new presentation
const pres = new pptxgen();

// Set presentation properties
pres.author = 'SignBridge AI Team';
pres.company = 'TSA Software Development';
pres.subject = 'SignBridge AI - ASL Translation Application';
pres.title = 'SignBridge AI Presentation';

// Define color scheme
const colors = {
    primary: '60a5fa',
    secondary: 'a78bfa',
    accent: 'f472b6',
    dark: '0f0f23',
    light: 'ffffff'
};

// Slide 1: Title Slide
let slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('SignBridge AI', {
    x: 0.5, y: 2, w: 9, h: 1.5,
    fontSize: 54, bold: true, color: colors.light,
    align: 'center'
});
slide.addText('Real-Time ASL Translation System', {
    x: 0.5, y: 3.5, w: 9, h: 0.8,
    fontSize: 28, color: colors.primary,
    align: 'center'
});
slide.addText('TSA Software Development Competition', {
    x: 0.5, y: 5, w: 9, h: 0.5,
    fontSize: 18, color: '999999',
    align: 'center'
});

// Slide 2: Problem Statement
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('The Problem', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 40, bold: true, color: colors.primary
});
slide.addText([
    { text: '26 million', options: { bold: true, color: colors.accent } },
    { text: ' deaf/hard-of-hearing individuals in the US face daily communication barriers' }
], { x: 1, y: 1.8, w: 8, fontSize: 20, color: colors.light, bullet: true });
slide.addText([
    { text: 'Only 500,000', options: { bold: true, color: colors.accent } },
    { text: ' people know ASL fluently (less than 2%)' }
], { x: 1, y: 2.5, w: 8, fontSize: 20, color: colors.light, bullet: true });
slide.addText('Existing solutions require internet and raise privacy concerns', {
    x: 1, y: 3.2, w: 8, fontSize: 20, color: colors.light, bullet: true
});
slide.addText('Professional interpreters cost $50-150/hour and require scheduling', {
    x: 1, y: 3.9, w: 8, fontSize: 20, color: colors.light, bullet: true
});

// Slide 3: Our Solution
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('SignBridge AI Solution', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 40, bold: true, color: colors.primary
});
slide.addText('Real-time ASL alphabet recognition using webcam', {
    x: 1, y: 1.8, w: 8, fontSize: 22, color: colors.light, bullet: true
});
slide.addText('100% local processing - no data sent to servers', {
    x: 1, y: 2.5, w: 8, fontSize: 22, color: colors.light, bullet: true
});
slide.addText('Cross-platform: Web, macOS, Windows, Linux, Mobile', {
    x: 1, y: 3.2, w: 8, fontSize: 22, color: colors.light, bullet: true
});
slide.addText('Two-handed signing support for natural communication', {
    x: 1, y: 3.9, w: 8, fontSize: 22, color: colors.light, bullet: true
});
slide.addText('Meeting Mode with transcript saving', {
    x: 1, y: 4.6, w: 8, fontSize: 22, color: colors.light, bullet: true
});

// Slide 4: Key Features
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('Key Features', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 40, bold: true, color: colors.primary
});
slide.addText('Translate Mode', {
    x: 1, y: 1.6, w: 4, fontSize: 24, bold: true, color: colors.secondary
});
slide.addText('• Live camera feed\n• Real-time detection\n• Translation bar\n• Meeting Mode', {
    x: 1.5, y: 2.2, w: 3.5, fontSize: 16, color: colors.light
});
slide.addText('Converse Mode', {
    x: 5.5, y: 1.6, w: 4, fontSize: 24, bold: true, color: colors.secondary
});
slide.addText('• Text-to-speech\n• Bidirectional communication\n• Accessibility-focused', {
    x: 6, y: 2.2, w: 3.5, fontSize: 16, color: colors.light
});

// Slide 5: Technical Architecture
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('Technical Architecture', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 40, bold: true, color: colors.primary
});
slide.addText('Frontend: React 19 + Vite + Material UI', {
    x: 1, y: 1.8, w: 8, fontSize: 20, color: colors.light, bullet: true
});
slide.addText('AI Engine: MediaPipe Hand Landmarker (21 landmarks/hand)', {
    x: 1, y: 2.4, w: 8, fontSize: 20, color: colors.light, bullet: true
});
slide.addText('Desktop: Electron 28 (Mac, Windows, Linux)', {
    x: 1, y: 3.0, w: 8, fontSize: 20, color: colors.light, bullet: true
});
slide.addText('Recognition: Custom algorithm analyzing finger positions/angles', {
    x: 1, y: 3.6, w: 8, fontSize: 20, color: colors.light, bullet: true
});
slide.addText('Performance: GPU acceleration for 30+ FPS', {
    x: 1, y: 4.2, w: 8, fontSize: 20, color: colors.light, bullet: true
});

// Slide 6: How It Works
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('How It Works', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 40, bold: true, color: colors.primary
});
slide.addText('1. Camera captures video at 30 FPS', {
    x: 1, y: 1.8, w: 8, fontSize: 22, color: colors.light
});
slide.addText('2. MediaPipe detects hands and extracts 21 3D landmarks', {
    x: 1, y: 2.5, w: 8, fontSize: 22, color: colors.light
});
slide.addText('3. Custom algorithm analyzes finger angles and positions', {
    x: 1, y: 3.2, w: 8, fontSize: 22, color: colors.light
});
slide.addText('4. Applies ASL-specific rules to identify sign', {
    x: 1, y: 3.9, w: 8, fontSize: 22, color: colors.light
});
slide.addText('5. Displays result with confidence filtering (50% threshold)', {
    x: 1, y: 4.6, w: 8, fontSize: 22, color: colors.light
});

// Slide 7: Code Example
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('Gesture Recognition Algorithm', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 36, bold: true, color: colors.primary
});
slide.addText(
    'export const recognizeGesture = (landmarks, handedness) => {\n' +
    '  // Check finger positions\n' +
    '  const f1 = checkFinger(landmarks, 1); // index\n' +
    '  const f2 = checkFinger(landmarks, 2); // middle\n' +
    '  const f3 = checkFinger(landmarks, 3); // ring\n' +
    '  const f4 = checkFinger(landmarks, 4); // pinky\n\n' +
    '  // Decision tree for ASL signs\n' +
    '  if (f1 && f2 && f3 && f4) { // All fingers down\n' +
    '    if (thumbToSide) return "A";\n' +
    '    if (thumbAcrossPalm) return "S";\n' +
    '  }\n' +
    '  // ... 100+ more checks for all 26 letters\n' +
    '};',
    {
        x: 0.8, y: 1.5, w: 8.4, h: 4,
        fontSize: 14, fontFace: 'Courier New',
        color: '00ff00', fill: { color: '1a1a1a' },
        margin: 0.2
    }
);

// Slide 8: End-User Applications
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('End-User Applications', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 40, bold: true, color: colors.primary
});
slide.addText('Education', {
    x: 1, y: 1.6, w: 4, fontSize: 22, bold: true, color: colors.secondary
});
slide.addText('• ASL learning tool\n• Classroom inclusion\n• Language labs', {
    x: 1.5, y: 2.1, w: 3.5, fontSize: 16, color: colors.light
});
slide.addText('Professional', {
    x: 5.5, y: 1.6, w: 4, fontSize: 22, bold: true, color: colors.secondary
});
slide.addText('• Business meetings\n• Customer service\n• Healthcare', {
    x: 6, y: 2.1, w: 3.5, fontSize: 16, color: colors.light
});
slide.addText('Personal', {
    x: 1, y: 3.5, w: 4, fontSize: 22, bold: true, color: colors.secondary
});
slide.addText('• Family communication\n• Social situations\n• Emergency use', {
    x: 1.5, y: 4, w: 3.5, fontSize: 16, color: colors.light
});

// Slide 9: Technical Challenges
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('Technical Challenges & Solutions', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 36, bold: true, color: colors.primary
});
slide.addText('Challenge: Lighting sensitivity', {
    x: 1, y: 1.6, w: 8, fontSize: 18, bold: true, color: colors.accent
});
slide.addText('Solution: Lowered confidence thresholds, adaptive brightness hints', {
    x: 1.5, y: 2.1, w: 7.5, fontSize: 16, color: colors.light
});
slide.addText('Challenge: Similar sign confusion (H/G/Q)', {
    x: 1, y: 2.8, w: 8, fontSize: 18, bold: true, color: colors.accent
});
slide.addText('Solution: Refined angle calculations, multi-frame consistency', {
    x: 1.5, y: 3.3, w: 7.5, fontSize: 16, color: colors.light
});
slide.addText('Challenge: Two-handed sign priority', {
    x: 1, y: 4.0, w: 8, fontSize: 18, bold: true, color: colors.accent
});
slide.addText('Solution: Gesture activity scoring, ignore passive hands', {
    x: 1.5, y: 4.5, w: 7.5, fontSize: 16, color: colors.light
});

// Slide 10: Impact & Accessibility
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('Impact & Accessibility', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 40, bold: true, color: colors.primary
});
slide.addText([
    { text: '26 million', options: { bold: true, color: colors.accent } },
    { text: ' potential users in the US alone' }
], { x: 1, y: 2, w: 8, fontSize: 24, color: colors.light, bullet: true });
slide.addText([
    { text: 'Zero cost', options: { bold: true, color: colors.accent } },
    { text: ' compared to $50-150/hour for interpreters' }
], { x: 1, y: 2.8, w: 8, fontSize: 24, color: colors.light, bullet: true });
slide.addText([
    { text: 'Instant availability', options: { bold: true, color: colors.accent } },
    { text: ' - no scheduling needed' }
], { x: 1, y: 3.6, w: 8, fontSize: 24, color: colors.light, bullet: true });
slide.addText([
    { text: 'Privacy preserved', options: { bold: true, color: colors.accent } },
    { text: ' - no third parties involved' }
], { x: 1, y: 4.4, w: 8, fontSize: 24, color: colors.light, bullet: true });

// Slide 11: Future Enhancements
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('Future Enhancements', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 40, bold: true, color: colors.primary
});
slide.addText('Short-Term (3 months)', {
    x: 1, y: 1.6, w: 8, fontSize: 22, bold: true, color: colors.secondary
});
slide.addText('• Full ASL word recognition (motion-based)\n• Custom gesture training\n• Multi-language support (BSL, JSL)', {
    x: 1.5, y: 2.2, w: 7, fontSize: 18, color: colors.light
});
slide.addText('Long-Term (6-12 months)', {
    x: 1, y: 3.6, w: 8, fontSize: 22, bold: true, color: colors.secondary
});
slide.addText('• Real-time sentence translation with grammar\n• Video conferencing integration (Zoom, Teams)\n• Community-contributed gesture library', {
    x: 1.5, y: 4.2, w: 7, fontSize: 18, color: colors.light
});

// Slide 12: Closing
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText('SignBridge AI', {
    x: 0.5, y: 2, w: 9, h: 1.2,
    fontSize: 48, bold: true, color: colors.primary,
    align: 'center'
});
slide.addText('Breaking Down Communication Barriers', {
    x: 0.5, y: 3.3, w: 9, h: 0.8,
    fontSize: 28, color: colors.light,
    align: 'center'
});
slide.addText('Free • Private • Accessible', {
    x: 0.5, y: 4.5, w: 9, h: 0.6,
    fontSize: 22, color: colors.secondary,
    align: 'center'
});
slide.addText('Questions?', {
    x: 0.5, y: 5.5, w: 9, h: 0.5,
    fontSize: 20, color: '999999',
    align: 'center'
});

// Save the presentation
pres.writeFile({ fileName: '/Users/amoghpratap/Downloads/SignBridge_TSA_Presentation.pptx' })
    .then(() => {
        console.log('✅ Presentation created successfully!');
        console.log('📁 Saved to: ~/Downloads/SignBridge_TSA_Presentation.pptx');
    })
    .catch(err => {
        console.error('❌ Error creating presentation:', err);
    });
