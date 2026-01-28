// math stuff
// finds the angle
function calc(p1, p2, p3) {
  // make vectors
  const a = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const b = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };

  // do math
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  const len1 = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  const len2 = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);

  // get degrees
  const rad = Math.acos(dot / (len1 * len2));
  return (rad * 180) / Math.PI; // degrees
}

// checks if finger is down
const checkFinger = (list, idx, hand) => {
  const tip = list[idx * 4 + 4];
  const pip = list[idx * 4 + 2];
  const mcp = list[idx * 4 + 1];

  // thumb check
  if (idx === 0) {
    let r = false;
    if (hand === "Right") r = true;

    // check x distance
    const d = tip.x - mcp.x;
    if (r) {
      return d < -0.02; // thumb in
    } else {
      return d > 0.02;
    }
  }

  // check y height
  return tip.y > pip.y;
};

export const recognizeGesture = (l, h = "Right") => {
  if (!l) return null;

  // fix left hand
  let m = 1;
  if (h !== "Right") {
    m = -1; // flip it
  }

  // math helper
  const dX = (a, b) => (a.x - b.x) * m;

  // getting points
  const t = l[4]; // thumb tip
  const i = l[8]; // index tip
  const mid = l[12]; // middle
  const ring = l[16];
  const p = l[20]; // pinky

  // joints
  const t_mcp = l[2];
  const i_mcp = l[5];
  const m_mcp = l[9];
  const r_mcp = l[13];
  const p_mcp = l[17];

  const i_pip = l[6];

  // check which fingers are down
  const f1 = checkFinger(l, 1); // index
  const f2 = checkFinger(l, 2); // middle
  const f3 = checkFinger(l, 3); // ring
  const f4 = checkFinger(l, 4); // pinky

  // START GUESSING

  // IF ALL FINGERS DOWN (Fist stuff)
  if (f1 && f2 && f3 && f4) {
    // checking for E
    // if thumb is close to index
    const dist = Math.sqrt(Math.pow(t.x - l[6].x, 2) + Math.pow(t.y - l[6].y, 2));
    if (calc(l[2], l[3], l[4]) < 150 && dist < 0.05) {
      return "E";
    }

    // S: thumb over fingers
    if (dX(t, l[6]) > 0.01 && dX(t, l[9]) < 0.05) {
      return "S";
    }

    // A: thumb on side
    if (dX(t, l[5]) < -0.01) {
      return "A";
    }

    // M, N, T (super annoying to tell apart)
    // trying to check where the thumb is

    if (dX(t, l[5]) > -0.02 && dX(t, l[9]) < 0.02) {
      return "T"; // thumb in middle
    }

    if (dX(t, l[9]) > -0.02 && dX(t, l[13]) < 0.02) {
      return "N";
    }

    if (dX(t, l[13]) > -0.02) {
      return "M"; // thumb far right
    }

    return "S"; // default i guess
  }

  // ONE FINGER UP
  if (!f1 && f2 && f3 && f4) {
    // D or L or X??

    // checking for L
    if (dX(t, l[5]) < -0.1) {
      return "L";
    }

    // Hook X
    if (calc(l[5], l[6], i) < 150) {
      return "X";
    }

    return "D";
  }

  // PINKY UP
  if (f1 && f2 && f3 && !f4) {
    if (dX(t, l[5]) < -0.1) return "Y"; // hang loose
    return "I";
  }

  // TWO FINGERS (U, V, R, K)
  if (!f1 && !f2 && f3 && f4) {
    // check if crossed (R)
    if (dX(i, mid) > 0) return "R";

    // check distance for U
    const dt = Math.sqrt(Math.pow(i.x - mid.x, 2) + Math.pow(i.y - mid.y, 2));
    if (dt < 0.04) return "U";

    // K has thumb up
    if (t.y < l[5].y) return "K";

    return "V";
  }

  // THREE FINGERS (W, F)
  if (!f1 && !f2 && !f3 && f4) {
    return "W";
  }

  // F (ok sign)
  if (f1 && !f2 && !f3 && !f4) {
    // check circle
    const d = Math.sqrt(Math.pow(i.x - t.x, 2) + Math.pow(i.y - t.y, 2));
    if (d < 0.05) return "F";
  }

  // OPEN HAND (B / Space)
  if (!f1 && !f2 && !f3 && !f4) {
    // B usually has thumb in
    if (dX(t, l[5]) < -0.05) return "B"; // space
    return "B";
  }

  // G and H (Sideways)
  // checking if index is flat??
  if (Math.abs(i.y - i_mcp.y) < 0.05 && Math.abs(i.x - i_mcp.x) > 0.1) {
    if (!f2) return "H";
    return "G";
  }

  return null; // found nothing
};
