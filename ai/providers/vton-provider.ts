import type { TryOnProvider, TryOnRequest, TryOnResult } from "@/ai/providers/types";

export class FutureVtonProvider implements TryOnProvider {
    name = "future-vton-provider";

    async run(_request: TryOnRequest): Promise<TryOnResult> {
        throw new Error("Real VTON provider not integrated yet");
    }
}
