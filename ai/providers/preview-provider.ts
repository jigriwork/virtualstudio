import { runGarmentSegmentation } from "@/ai/garment-segmentation";
import { runPoseDetection } from "@/ai/pose-detection";
import type { TryOnProvider, TryOnRequest, TryOnResult } from "@/ai/providers/types";

function buildPreviewComposite(selfie: string, garmentImageUrl: string, label = "Preview Mode") {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1365" viewBox="0 0 1024 1365">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000" stop-opacity="0.35" />
    </linearGradient>
  </defs>
  <image href="${selfie}" x="0" y="0" width="1024" height="1365" preserveAspectRatio="xMidYMid slice"/>
  <g opacity="0.86">
    <image href="${garmentImageUrl}" x="235" y="300" width="550" height="720" preserveAspectRatio="xMidYMid meet"/>
  </g>
  <rect x="0" y="0" width="1024" height="1365" fill="url(#fade)" />
  <rect x="32" y="32" rx="20" width="260" height="52" fill="#111827" opacity="0.72" />
  <text x="54" y="66" fill="#f8d57e" font-size="26" font-family="Arial, sans-serif" font-weight="700">${label}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export class PreviewTryOnProvider implements TryOnProvider {
  name = "preview-compositor";

  async run({ imageBase64, garmentImageUrl }: TryOnRequest): Promise<TryOnResult> {
    const pose = await runPoseDetection(imageBase64);
    const segmentation = await runGarmentSegmentation(garmentImageUrl);
    const renderedImageUrl = buildPreviewComposite(imageBase64, garmentImageUrl);

    return {
      provider: this.name,
      mode: "PREVIEW" as const,
      renderedImageUrl,
      steps: [
        "input accepted",
        "pose landmarks estimated",
        "garment mask prepared",
        "preview composite generated",
      ],
      debug: {
        pose,
        segmentation,
      },
    };
  }
}
