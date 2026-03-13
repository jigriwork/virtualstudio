const styles = ["Classic", "Royal", "Modern", "Minimal"];

export async function runStyleAnalysis(_imageBase64?: string) {
  const recommendation = styles[Math.floor(Math.random() * styles.length)];
  return {
    style: recommendation,
    confidence: Number((0.72 + Math.random() * 0.25).toFixed(2)),
    notes: "Placeholder style scanner. Plug in CV model for production AI inference.",
  };
}
