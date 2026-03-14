import type { StyleAnalysisResult } from "@/ai/providers/types";

const styles = ["Classic", "Royal", "Modern", "Minimal"];

export async function runStyleAnalysis(_imageBase64?: string): Promise<StyleAnalysisResult> {
  const recommendation = styles[Math.floor(Math.random() * styles.length)];
  return {
    provider: "style-analysis-placeholder",
    style: recommendation,
    confidence: Number((0.72 + Math.random() * 0.25).toFixed(2)),
    notes: "Preview style scan only. Replace with real style analysis model later.",
  };
}
