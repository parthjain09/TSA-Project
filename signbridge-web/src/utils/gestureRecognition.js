/**
 * Gesture Recognition for ASL Alphabet
 * Uses MediaPipe hand landmarks to detect static ASL signs
 * Optimized for SignBridge AI Translation
 */

// This helper function helps us calculate the angle between three points.
// We use this to see if a finger is bent or straight.
function calc(p1, p2, p3) {
  const a = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const b = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  const len1 = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  const len2 = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);
  const rad = Math.acos(Math.max(-1, Math.min(1, dot / (len1 * len2))));
  return (rad * 180) / Math.PI; // Convert to degrees because it's easier to understand
}

const checkFinger = (list, idx, hand) => {
  const wrist = list[0];
  const tip = list[idx * 4 + 4];
  const mcp = list[idx * 4 + 1];

  if (idx === 0) { // Thumb
    const d = tip.x - mcp.x;
    return (hand === "Right") ? d < -0.02 : d > 0.02;
  }

  // A finger is "down" if the tip is closer to the wrist than the MCP joint
  const distTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
  const distMcp = Math.sqrt(Math.pow(mcp.x - wrist.x, 2) + Math.pow(mcp.y - wrist.y, 2));
  return distTip < distMcp;
};

export const recognizeGesture = (l, h = "Right") => {
  if (!l) return null;

  const m = (h !== "Right") ? -1 : 1;
  const dX = (a, b) => (a.x - b.x) * m;

  const t = l[4], i = l[8], mid = l[12], ring = l[16], p = l[20];
  const i_mcp = l[5], m_mcp = l[9], r_index = l[6], r_mcp = l[13];

  const f1 = checkFinger(l, 1, h); // index
  const f2 = checkFinger(l, 2, h); // middle
  const f3 = checkFinger(l, 3, h); // ring
  const f4 = checkFinger(l, 4, h); // pinky

  // 1. ALL FINGERS DOWN (Fist: A, S, E, T, M, N)
  const fingersDownCount = [f1, f2, f3, f4].filter(f => f).length;
  if (fingersDownCount >= 3) {
    const distTIPS = Math.sqrt(Math.pow(t.x - l[8].x, 2) + Math.pow(t.y - l[8].y, 2));

    // Check for "A" - Thumb is on the side
    if (dX(t, l[5]) < 0.04) return "A";

    if (distTIPS < 0.06) return "E";
    if (dX(t, l[6]) > 0.02 && dX(t, l[10]) < 0.06) return "S";
    if (dX(t, l[5]) > -0.02 && dX(t, l[9]) < 0.01) return "T";
    if (dX(t, l[9]) > 0 && dX(t, l[13]) < 0.01) return "N";
    if (dX(t, l[13]) > 0) return "M";
    return "A";
  }

  // 2. CURVED FINGERS (C, O, B)
  if (!f1 && !f2 && !f3 && !f4) {
    const dOT = Math.sqrt(Math.pow(i.x - t.x, 2) + Math.pow(i.y - t.y, 2));
    if (dOT < 0.06) return "O";
    if (dOT < 0.15 && i.x > t.x) return "C";
    return "B"; // Flat palm
  }

  // 3. ONE FINGER UP (D, L, X)
  if (!f1 && f2 && f3 && f4) {
    if (dX(t, l[5]) < -0.1) return "L";
    if (calc(l[5], l[6], i) < 150) return "X";
    return "D";
  }

  // 4. PINKY UP (I, Y)
  if (f1 && f2 && f3 && !f4) {
    if (dX(t, l[5]) < -0.1) return "Y";
    return "I";
  }

  // 5. TWO FINGERS UP (U, V, R, K, P)
  if (!f1 && !f2 && f3 && f4) {
    if (i.y > i_mcp.y) return "P";
    if (dX(i, mid) > 0) return "R";
    const dt = Math.sqrt(Math.pow(i.x - mid.x, 2) + Math.pow(i.y - mid.y, 2));
    if (dt < 0.06) return "U";
    if (t.y < l[5].y) return "K";
    return "V";
  }

  // 6. THREE FINGERS UP (W, F)
  if (!f1 && !f2 && !f3 && f4) return "W";
  if (f1 && !f2 && !f3 && !f4) {
    const d = Math.sqrt(Math.pow(i.x - t.x, 2) + Math.pow(i.y - t.y, 2));
    if (d < 0.07) return "F";
  }

  // 7. G, H, Q (Horizontal)
  if (Math.abs(i.y - i_mcp.y) < 0.08) {
    if (i.y > i_mcp.y + 0.05) return "Q";
    if (!f2) return "H";
    return "G";
  }

  return null;
};
