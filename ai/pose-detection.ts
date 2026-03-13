export type PoseDetectionResult = {
  keypoints: Array<{ name: string; x: number; y: number; confidence: number }>;
  compatibleWith: "MediaPipe";
};

export async function runPoseDetection(_inputImage: string): Promise<PoseDetectionResult> {
  return {
    compatibleWith: "MediaPipe",
    keypoints: [
      { name: "left_shoulder", x: 0.4, y: 0.2, confidence: 0.98 },
      { name: "right_shoulder", x: 0.6, y: 0.2, confidence: 0.97 },
      { name: "left_hip", x: 0.45, y: 0.55, confidence: 0.95 },
      { name: "right_hip", x: 0.55, y: 0.55, confidence: 0.95 },
    ],
  };
}
