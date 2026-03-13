export type GarmentSegmentationResult = {
  maskUrl: string;
  notes: string;
};

export async function runGarmentSegmentation(garmentImageUrl: string): Promise<GarmentSegmentationResult> {
  return {
    maskUrl: garmentImageUrl,
    notes: "Placeholder segmentation completed. Replace with real model inference.",
  };
}
