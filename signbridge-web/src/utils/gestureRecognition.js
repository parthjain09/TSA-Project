
// Helper to calculate distance between two points
const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const recognizeGesture = (landmarks) => {
  // landmarks is an array of 21 points {x, y, z}
  if (!landmarks || landmarks.length !== 21) return null;

  // Finger indices
  const WRIST = 0;
  const THUMB_CMC = 1;
  const THUMB_MCP = 2;
  const THUMB_IP = 3;
  const THUMB_TIP = 4;
  const INDEX_MCP = 5;
  const INDEX_PIP = 6;
  const INDEX_DIP = 7;
  const INDEX_TIP = 8;
  const MIDDLE_MCP = 9;
  const MIDDLE_PIP = 10;
  const MIDDLE_DIP = 11;
  const MIDDLE_TIP = 12;
  const RING_MCP = 13;
  const RING_PIP = 14;
  const RING_DIP = 15;
  const RING_TIP = 16;
  const PINKY_MCP = 17;
  const PINKY_PIP = 18;
  const PINKY_DIP = 19;
  const PINKY_TIP = 20;

  // Check which fingers are extended
  // For index, middle, ring, pinky: Tip is higher (lower y) than PIP
  const isIndexExtended = landmarks[INDEX_TIP].y < landmarks[INDEX_PIP].y;
  const isMiddleExtended = landmarks[MIDDLE_TIP].y < landmarks[MIDDLE_PIP].y;
  const isRingExtended = landmarks[RING_TIP].y < landmarks[RING_PIP].y;
  const isPinkyExtended = landmarks[PINKY_TIP].y < landmarks[PINKY_PIP].y;

  // Thumb is extended if tip is further from base of palm (wrist) than IP joint?? 
  // Or just use x distance for side-facing thumb?
  // Simple check: Thumb tip to pinky tip distance is large -> Open hand
  const thumbTipToPinkyTip = getDistance(landmarks[THUMB_TIP], landmarks[PINKY_TIP]);
  const wristToMiddleTip = getDistance(landmarks[WRIST], landmarks[MIDDLE_TIP]);
  
  // "Hello" / Open Hand
  // All fingers extended
  if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
    // Check if thumb is also somewhat away?
    if (thumbTipToPinkyTip > 0.3) { // Heuristic threshold
        return "Hello";
    }
    return "B"; // B is flat hand, thumb tucked. But for now Hello/B overlap is fine.
  }

  // "B" 
  // 4 fingers up, thumb crossed over palm. 
  // For simplicity, if 4 fingers up but not "Hello" (maybe thumb is close to index base)
  if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      if (thumbTipToPinkyTip < 0.2) return "B"; 
  }

  // "Yes" (Fist / S shape)
  // All fingers curled
  if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      // Check thumb position for A vs S vs Yes
      // "S" / "Yes" -> Thumb crosses over fingers.
      // "A" -> Thumb on side.
      return "Yes";
  }

  // "C"
  // Fingers curved but not fully curled. 
  // Tips vs Wrist distance is medium? 
  // Shape analysis: C shape means tips and thumb tip form a C.
  // Distances between thumb tip and index tip is noticeable but not touching (O).
  const thumbTipToIndexTip = getDistance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
  if (!isMiddleExtended && !isRingExtended && !isPinkyExtended) { 
      // If fingers are not fully extended but not fully curled... hard to check "curved" with just y < pip
      // Better check: Index Tip y is close to Thumb Tip y, and x gap exists.
      // Let's rely on simple state: Index/Middle/Ring/Pinky are somewhat curled?
  }
  
  // Let's try C detection by curvature:
  // Tips are NOT below PIP (extended) but also NOT fully curled down to MCP?
  // C is hard with simple boolean isExtended.
  
  // Let's add "No"
  // "No" in ASL: Thumb touches Index and Middle fingers (snapping motion).
  // Check if Thumb tip is close to Index tip AND Middle tip
  if (getDistance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]) < 0.05 && 
      getDistance(landmarks[THUMB_TIP], landmarks[MIDDLE_TIP]) < 0.05) {
      return "No";
  }
  
  // "A"
  // Fist, but thumb is ALONGSIDE index finger.
  if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
       // Differentiate A and Yes (S)
       // S: Thumb crosses fingers. Thumb tip x is between index and pinky x?
       // A: Thumb tip is to the side.
       // This is subtle for MVP. Let's return "Yes" for any fist for now, or toggle based on thumb y?
       // Let's skip distinct A vs S for now and focus on requested list.
       return "Yes"; 
  }

  return null;
};
