/**
 * Gesture Recognition for ASL Alphabet
 * Uses MediaPipe hand landmarks to detect static ASL signs
 * Optimized for SignBridge AI Translation
 */

const checkFinger = (list, idx, hand) => {
  const wrist = list[0];
  const tip = list[idx * 4 + 4];
  const pip = list[idx * 4 + 2];
  const mcp = list[idx * 4 + 1];

  if (idx === 0) { // Thumb
    // Thumb is open if it's far from the palm
    const d = Math.abs(tip.x - list[9].x); // Distance to middle finger base
    return d > 0.1;
  }

  // A finger is "open" if the tip is further from the wrist than the PIP joint
  const distTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
  const distPip = Math.sqrt(Math.pow(pip.x - wrist.x, 2) + Math.pow(pip.y - wrist.y, 2));
  return distTip > distPip;
};

export const recognizeGesture = (l, h = "Right") => {
  if (!l || l.length < 21) return null;

  const m = (h !== "Right") ? -1 : 1;
  const dX = (a, b) => (l[a].x - l[b].x) * m;
  const dY = (a, b) => l[a].y - l[b].y;
  const dist = (a, b) => Math.sqrt(Math.pow(l[a].x - l[b].x, 2) + Math.pow(l[a].y - l[b].y, 2));

  // Finger states: true = OPEN, false = CLOSED
  const thumbOpen = checkFinger(l, 0, h);
  const indexOpen = checkFinger(l, 1, h);
  const middleOpen = checkFinger(l, 2, h);
  const ringOpen = checkFinger(l, 3, h);
  const pinkyOpen = checkFinger(l, 4, h);

  // 1. ALL CLOSED (Fist variants: A, S, E, T, M, N)
  if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
    const t = l[4];
    // A: Thumb on side
    if (dX(4, 5) > 0.05) return "A";
    // E: Thumb tucked in front of curled fingers
    if (dist(4, 8) < 0.08 && dist(4, 12) < 0.08) return "E";
    // S: Thumb over fingers
    if (dist(4, 10) < 0.08) return "S";
    // T: Thumb between index and middle (often looks like thumb over index base)
    if (dist(4, 6) < 0.05) return "T";
    // N: Thumb between middle and ring
    if (dist(4, 10) < 0.05) return "N";
    // M: Thumb between ring and pinky
    if (dist(4, 14) < 0.05) return "M";

    return "A"; // Default fist
  }

  // 2. FLAT PALM / OPEN (B, 5)
  if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
    if (dist(8, 12) < 0.1) return "B";
    return "5";
  }

  // 3. INDEX ONLY (D, Z, G, H) - Z is usually moving D
  if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
    // Check for horizontal orientation (G, H)
    if (Math.abs(dY(8, 5)) < 0.1) {
      // If middle is also somewhat extended sideways but not "open" upwards
      if (dist(12, 9) > 0.1 && Math.abs(dY(12, 9)) < 0.1) return "H";
      return "G";
    }
    // L: Index up, Thumb out
    if (thumbOpen && dX(4, 5) < -0.1) return "L";
    return "D";
  }

  // 4. INDEX + MIDDLE (U, V, R, K, P)
  if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
    // P: Downwards K
    if (dY(8, 5) > 0.1) return "P";
    // K: Index up, middle up, index-tip is higher, thumb touching middle
    if (dist(4, 10) < 0.08) return "K";
    // R: Crossed
    if (dX(8, 12) > 0) return "R";
    // U: Touching
    if (dist(8, 12) < 0.06) return "U";
    // V: Spread
    return "V";
  }

  // 5. PINKY ONLY (I, J)
  if (!indexOpen && !middleOpen && !ringOpen && pinkyOpen) {
    return "I";
  }

  // 6. THUMB + PINKY (Y)
  if (thumbOpen && !indexOpen && !middleOpen && !ringOpen && pinkyOpen) {
    return "Y";
  }

  // 7. THREE FINGERS (W, F)
  if (indexOpen && middleOpen && ringOpen && !pinkyOpen) return "W";
  if (!indexOpen && middleOpen && ringOpen && pinkyOpen) {
    if (dist(4, 8) < 0.1) return "F";
  }

  // 8. C, O, X
  if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
    // (Already handled fist, but O/C are curved)
  }

  // Specific check for C and O (based on index curvature)
  const indexCurved = dist(8, 5) < 0.15;
  if (indexCurved && thumbOpen) {
    if (dist(4, 8) < 0.08) return "O";
    return "C";
  }

  return null;
};
