import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

// Create a singleton instance
let classifier = null;

export const getClassifier = () => {
    if (!classifier) {
        classifier = knnClassifier.create();
    }
    return classifier;
};

export const addExample = (landmarks, label) => {
    if (!landmarks || landmarks.length !== 21) return;

    const features = landmarks.flatMap(p => [p.x, p.y, p.z]);
    const tensor = tf.tensor(features);

    const instance = getClassifier();
    instance.addExample(tensor, label);

    // Dispose tensor to free memory
    tensor.dispose();
};

export const predict = async (landmarks) => {
    const instance = getClassifier();
    if (instance.getNumClasses() === 0) return null;

    if (!landmarks || landmarks.length !== 21) return null;

    const features = landmarks.flatMap(p => [p.x, p.y, p.z]);
    const tensor = tf.tensor(features);

    try {
        const result = await instance.predictClass(tensor, 10); // K=10 neighbors
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
