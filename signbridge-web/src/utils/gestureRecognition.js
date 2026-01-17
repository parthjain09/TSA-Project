
// Helper to calculate distance between two points
const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const recognizeGesture = (landmarks) => {
  if (!landmarks || landmarks.length !== 21) return null;

  // Finger Indices
  const THUMB_TIP = 4;
  const INDEX_TIP = 8;
  const MIDDLE_TIP = 12;
  const RING_TIP = 16;
  const PINKY_TIP = 20;

  const INDEX_PIP = 6;
  const MIDDLE_PIP = 10;
  const RING_PIP = 14;
  const PINKY_PIP = 18;

  const WRIST = 0;

  // Finger States (Extended or Not)
  // Simple check: Tip above PIP (y is lower in screen coords)
  const isIndexUp = landmarks[INDEX_TIP].y < landmarks[INDEX_PIP].y;
  const isMiddleUp = landmarks[MIDDLE_TIP].y < landmarks[MIDDLE_PIP].y;
  const isRingUp = landmarks[RING_TIP].y < landmarks[RING_PIP].y;
  const isPinkyUp = landmarks[PINKY_TIP].y < landmarks[PINKY_PIP].y;

  // Thumb is harder. Check if tip is far from pinky base or index base? 
  // Let's use simple boolean array for [Index, Middle, Ring, Pinky]
  const fingers = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp];

  // A: All fingers curled, thumb alongside index.
  if (!isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
    // Check thumb. If thumb tip is close to index MAP/base?
    // Simplification: Fist = 'A' or 'S'.
    // S: Thumb crosses fingers. A: Thumb on side.
    // Distinguish 'A', 'E', 'S', 'M', 'N', 'T' (all fist-like)

    // Heuristic for A: Thumb tip is NOT crossing.
    if (landmarks[THUMB_TIP].x < landmarks[INDEX_PIP].x) return "A"; // Right hand logic?
    return "S"; // Default to S (Yes) if fully clenched
  }

  // B: All 4 fingers up, thumb crossed?
  if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
    return "B"; // Or 'Hello'
  }

  // C: Curved fingers. Hard to detect with just isUp. 
  // shape check: Thumb tip and Index tip form a C gap?

  // D: Index UP, others curled.
  if (isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
    return "D";
  }

  // E: All curled (like S) but tips on thumb? Very subtle.

  // F: Index+Thumb touch (circle), others UP.
  // Check dist(Thumb, Index) < threshold, others UP.
  const distThumbIndex = getDistance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
  if (distThumbIndex < 0.05 && isMiddleUp && isRingUp && isPinkyUp) {
    return "F";
  }

  // G: Index pointing left, Thumb parallel. (Side view)

  // H: Index + Middle UP (together), others curled. Thumb tucked?
  // H vs U: H is horizontal, U is vertical. MediaPipe coordinates are normalized. 
  // Assuming 'U' (vertical) for now.
  if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
    // Check if spread?
    const distIndexMiddle = getDistance(landmarks[INDEX_TIP], landmarks[MIDDLE_TIP]);
    if (distIndexMiddle < 0.05) return "U";
    return "V"; // "V" if spread
  }

  // I: Pinky UP, others curled.
  if (!isIndexUp && !isMiddleUp && !isRingUp && isPinkyUp) {
    return "I"; // or 'J' (motion)
  }

  // L: Index UP, Thumb OUT (L shape). Others curled.
  if (isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
    // Thumb needs to be extended?
    // Let's distinguish 'D' (thumb touching middle) vs 'L' (thumb out).
    // Check distance thumb tip to index base.
    return "L";
  }

  // W: Index, Middle, Ring UP. Pinky curled.
  if (isIndexUp && isMiddleUp && isRingUp && !isPinkyUp) {
    return "W"; // or '6'
  }

  // Y: Thumb + Pinky UP. Others curled.
  if (!isIndexUp && !isMiddleUp && !isRingUp && isPinkyUp) {
    // Need thumb out.
    // Check thumb tip distance from index knuckle?
    return "Y";
  }

  return null;
};
