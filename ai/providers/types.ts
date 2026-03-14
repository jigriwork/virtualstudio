export type TryOnRequest = {
    imageBase64: string;
    garmentImageUrl: string;
    productName?: string;
};

export type TryOnResult = {
    provider: string;
    mode: "PREVIEW" | "VTON";
    renderedImageUrl: string;
    steps: string[];
    debug?: Record<string, unknown>;
};

export interface TryOnProvider {
    name: string;
    run(request: TryOnRequest): Promise<TryOnResult>;
}

export type StyleAnalysisResult = {
    provider: string;
    style: string;
    confidence: number;
    notes: string;
};

export interface StyleAnalysisProvider {
    name: string;
    run(imageBase64?: string): Promise<StyleAnalysisResult>;
}
