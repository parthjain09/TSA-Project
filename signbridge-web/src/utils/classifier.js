// ai brain
let classifier = null;

// gets the classifier
export const getClassifier = () => {
    if (!classifier) {
        classifier = knnClassifier.create();
    }
    return classifier;
};

// saves a hand shape
export const addExample = (landmarks, label) => {
    const instance = getClassifier();

    // checks for errors
    if (!landmarks || landmarks.length !== 21) return;

    // makes it flat
    const features = landmarks.flatMap(p => [p.x, p.y, p.z]);
    const tensor = tf.tensor(features);

    instance.addExample(tensor, label);
    tensor.dispose(); // clean up
};

export const addExampleWithAugmentation = (landmarks, label) => {
    if (!landmarks || landmarks.length !== 21) return;

    // Original
    addExample(landmarks, label);

    // Augmentation 1: Slight rotation
    const rotated = landmarks.map(p => ({
        x: p.x + (Math.random() - 0.5) * 0.05,
        y: p.y + (Math.random() - 0.5) * 0.05,
        z: p.z
    }));
    addExample(rotated, label);
};

export const predict = async (landmarks) => {
    const instance = getClassifier();
    if (instance.getNumClasses() === 0) return null;

    if (!landmarks || landmarks.length !== 21) return null;

    const features = landmarks.flatMap(p => [p.x, p.y, p.z]);
    const tensor = tf.tensor(features);

    try {
        const result = await instance.predictClass(tensor, 15); // K=15 neighbors (was 10)
        tensor.dispose();
        // result = { label: string, confidences: { [label]: number } }
        return result;
    } catch (err) {
        tensor.dispose();
        console.error("Prediction error:", err);
        return null;
    }
};

export const clearAll = () => {
    const instance = getClassifier();
    instance.clearAllClasses();
};

export const getClassInfo = () => {
    const instance = getClassifier();
    return instance.getClassExampleCount();
};
