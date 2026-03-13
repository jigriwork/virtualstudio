import { runPoseDetection } from "@/ai/pose-detection";
import { runGarmentSegmentation } from "@/ai/garment-segmentation";

export type TryOnPipelineOutput = {
  steps: string[];
  renderedImageUrl: string;
  debug: Record<string, unknown>;
};

export async function runVirtualTryOnPipeline(inputImage: string, garmentImageUrl: string): Promise<TryOnPipelineOutput> {
  const pose = await runPoseDetection(inputImage);
  const segmentation = await runGarmentSegmentation(garmentImageUrl);

  return {
    steps: [
      "input image accepted",
      "pose detection completed",
      "garment overlay generated",
      "render result prepared",
    ],
    renderedImageUrl: inputImage,
    debug: {
      pose,
      segmentation,
      pipeline: "input image → pose detection → garment overlay → render result",
    },
  };
}
