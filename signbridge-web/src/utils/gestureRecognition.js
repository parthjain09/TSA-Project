/**
 * Gesture Recognition for ASL Alphabet
 * Uses MediaPipe hand landmarks to detect static ASL signs
 */

// Helper to calculate distance between two points
const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow((p1.z || 0) - (p2.z || 0), 2));
};

// Check if finger is extended (tip above/below certain joints)
const isFingerExtended = (landmarks, fingerTip, fingerPip, fingerMcp) => {
  // Finger is extended if tip is further from wrist than pip
  const tipToWrist = getDistance(landmarks[fingerTip], landmarks[0]);
  const pipToWrist = getDistance(landmarks[fingerPip], landmarks[0]);
  return tipToWrist > pipToWrist * 0.9; // Some tolerance
};

// Check if finger is curled
const isFingerCurled = (landmarks, fingerTip, fingerPip) => {
  // Simple: Y position check (tip below pip in screen coords = curled)
  return landmarks[fingerTip].y > landmarks[fingerPip].y;
};

export const recognizeGesture = (landmarks) => {
  if (!landmarks || landmarks.length !== 21) return null;

  // Landmark indices
  const WRIST = 0;
  const THUMB_CMC = 1, THUMB_MCP = 2, THUMB_IP = 3, THUMB_TIP = 4;
  const INDEX_MCP = 5, INDEX_PIP = 6, INDEX_DIP = 7, INDEX_TIP = 8;
  const MIDDLE_MCP = 9, MIDDLE_PIP = 10, MIDDLE_DIP = 11, MIDDLE_TIP = 12;
  const RING_MCP = 13, RING_PIP = 14, RING_DIP = 15, RING_TIP = 16;
  const PINKY_MCP = 17, PINKY_PIP = 18, PINKY_DIP = 19, PINKY_TIP = 20;

  // Check finger states
  const indexUp = landmarks[INDEX_TIP].y < landmarks[INDEX_PIP].y;
  const middleUp = landmarks[MIDDLE_TIP].y < landmarks[MIDDLE_PIP].y;
  const ringUp = landmarks[RING_TIP].y < landmarks[RING_PIP].y;
  const pinkyUp = landmarks[PINKY_TIP].y < landmarks[PINKY_PIP].y;

  // Thumb state (horizontal check for right hand)
  const thumbOut = landmarks[THUMB_TIP].x < landmarks[THUMB_IP].x; // Left of IP = out

  // Count extended fingers
  const extendedCount = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

  // Distances
  const thumbToIndex = getDistance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
  const thumbToMiddle = getDistance(landmarks[THUMB_TIP], landmarks[MIDDLE_TIP]);
  const indexToMiddle = getDistance(landmarks[INDEX_TIP], landmarks[MIDDLE_TIP]);
  const middleToRing = getDistance(landmarks[MIDDLE_TIP], landmarks[RING_TIP]);

  // Palm size for normalization
  const palmSize = getDistance(landmarks[WRIST], landmarks[MIDDLE_MCP]);

  // === GESTURE DETECTION ===

  // A: Fist with thumb on side (not crossed)
  // All fingers curled, thumb beside index
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
    if (thumbOut || landmarks[THUMB_TIP].x < landmarks[INDEX_MCP].x) {
      return { gesture: "A", confidence: 85 };
    }
    // S: Thumb crosses over curled fingers
    if (landmarks[THUMB_TIP].x > landmarks[INDEX_PIP].x) {
      return { gesture: "S", confidence: 80 };
    }
    // E: Fingertips touch thumb
    if (thumbToIndex < palmSize * 0.3 && thumbToMiddle < palmSize * 0.4) {
      return { gesture: "E", confidence: 75 };
    }
    return { gesture: "A", confidence: 70 }; // Default fist = A
  }

  // B: All 4 fingers extended, thumb tucked
  if (indexUp && middleUp && ringUp && pinkyUp) {
    // Check if fingers are together
    if (indexToMiddle < palmSize * 0.15 && middleToRing < palmSize * 0.15) {
      return { gesture: "B", confidence: 90 };
    }
    // 5/Open hand if spread
    return { gesture: "Hello", confidence: 85 };
  }

  // C: Curved hand (thumb and index form C shape)
  // Check if thumb and index tips are moderately apart, forming arc
  if (thumbToIndex > palmSize * 0.3 && thumbToIndex < palmSize * 0.8) {
    if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
      // All fingers curved together
      return { gesture: "C", confidence: 70 };
    }
  }

  // D: Index up, others curled, thumb touches middle finger
  if (indexUp && !middleUp && !ringUp && !pinkyUp) {
    if (thumbToMiddle < palmSize * 0.25) {
      return { gesture: "D", confidence: 85 };
    }
    // L: Index up, thumb out (L shape)
    if (thumbOut) {
      return { gesture: "L", confidence: 85 };
    }
    return { gesture: "D", confidence: 75 };
  }

  // F: Index and thumb touch (circle), other 3 fingers up
  if (thumbToIndex < palmSize * 0.15 && middleUp && ringUp && pinkyUp) {
    return { gesture: "F", confidence: 90 };
  }

  // G: Index points sideways, thumb parallel
  // H: Index + Middle sideways, thumb tucked

  // I: Only pinky up
  if (!indexUp && !middleUp && !ringUp && pinkyUp) {
    return { gesture: "I", confidence: 90 };
  }

  // K: Index up, middle up angled, thumb between
  if (indexUp && middleUp && !ringUp && !pinkyUp) {
    // Check if thumb is between index and middle
    const thumbBetween = landmarks[THUMB_TIP].y < landmarks[INDEX_PIP].y &&
      landmarks[THUMB_TIP].y > landmarks[INDEX_TIP].y;
    if (thumbBetween && indexToMiddle > palmSize * 0.1) {
      return { gesture: "K", confidence: 75 };
    }

    // V: Index + Middle spread
    if (indexToMiddle > palmSize * 0.15) {
      return { gesture: "V", confidence: 90 };
    }

    // U: Index + Middle together
    if (indexToMiddle < palmSize * 0.1) {
      return { gesture: "U", confidence: 85 };
    }

    return { gesture: "V", confidence: 80 };
  }

  // O: All fingertips touch thumb (circle shape)
  if (thumbToIndex < palmSize * 0.2 && thumbToMiddle < palmSize * 0.25) {
    if (!indexUp && !middleUp) {
      return { gesture: "O", confidence: 75 };
    }
  }

  // R: Index and middle crossed
  if (indexUp && middleUp && !ringUp && !pinkyUp) {
    // Check if crossed (index x > middle x)
    if (landmarks[INDEX_TIP].x > landmarks[MIDDLE_TIP].x) {
      return { gesture: "R", confidence: 80 };
    }
  }

  // W: Index, Middle, Ring up. Pinky down.
  if (indexUp && middleUp && ringUp && !pinkyUp) {
    return { gesture: "W", confidence: 90 };
  }

  // X: Index hooked/bent (tip below dip)
  if (landmarks[INDEX_TIP].y > landmarks[INDEX_DIP].y && !middleUp && !ringUp && !pinkyUp) {
    return { gesture: "X", confidence: 75 };
  }

  // Y: Thumb and Pinky out, others curled
  if (!indexUp && !middleUp && !ringUp && pinkyUp && thumbOut) {
    return { gesture: "Y", confidence: 90 };
  }

  // Thumbs Up: Thumb up, all fingers curled
  if (!indexUp && !middleUp && !ringUp && !pinkyUp &&
    landmarks[THUMB_TIP].y < landmarks[THUMB_IP].y) {
    return { gesture: "👍 Thumbs Up", confidence: 85 };
  }

  // Rock/ILY: Thumb, Index, Pinky up
  if (indexUp && !middleUp && !ringUp && pinkyUp && thumbOut) {
    return { gesture: "🤟 I Love You", confidence: 85 };
  }

  // Three: Index, Middle, Ring up with thumb and pinky curled  
  if (indexUp && middleUp && ringUp && !pinkyUp && !thumbOut) {
    return { gesture: "3", confidence: 80 };
  }

  // Default: No match
  return null;
};
