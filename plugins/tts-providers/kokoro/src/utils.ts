/**
 * Detect if WebGPU is available in the current browser
 * @returns Promise that resolves to true if WebGPU is available, false otherwise
 */
export async function detectWebGPU(): Promise<boolean> {
    // @ts-expect-error - WebGPU is not in the standard Navigator type yet
    if (!navigator.gpu) {
        return false;
    }

    try {
        // @ts-expect-error - WebGPU is not in the standard Navigator type yet
        const adapter = await navigator.gpu.requestAdapter();
        return adapter !== null;
    } catch {
        return false;
    }
}
