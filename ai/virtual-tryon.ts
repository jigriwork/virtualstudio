import { PreviewTryOnProvider } from "@/ai/providers/preview-provider";
import type { TryOnResult } from "@/ai/providers/types";

export type TryOnPipelineOutput = {
  steps: string[];
  renderedImageUrl: string;
  provider: string;
  mode: "PREVIEW" | "VTON";
  debug: Record<string, unknown>;
};

const previewProvider = new PreviewTryOnProvider();

export async function runVirtualTryOnPipeline(inputImage: string, garmentImageUrl: string): Promise<TryOnPipelineOutput> {
  const result: TryOnResult = await previewProvider.run({
    imageBase64: inputImage,
    garmentImageUrl,
  });

  return {
    steps: result.steps,
    renderedImageUrl: result.renderedImageUrl,
    provider: result.provider,
    mode: result.mode,
    debug: result.debug ?? {},
  };
}
