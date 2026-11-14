import { pipeline, env } from '@huggingface/transformers';

// Disable local models since we are running in the browser
env.allowLocalModels = false;

type Candidate = { model: string; dtype: any; device?: any; label: string };

const CANDIDATES: Candidate[] = [
    { model: 'Xenova/whisper-base', dtype: 'fp32', device: 'webgpu', label: 'base/fp32/webgpu' },
    { model: 'Xenova/whisper-base', dtype: 'fp32', device: 'wasm', label: 'base/fp32/wasm' },
];

class PipelineFactory {
    static task = 'automatic-speech-recognition' as const;
    static instance: any = null;
    static activeLabel = '';

    static async getInstance(progress_callback?: any) {
        if (this.instance) return this.instance;

        const failures: string[] = [];
        for (const cand of CANDIDATES) {
            try {
                this.instance = await pipeline(this.task, cand.model, {
                    progress_callback,
                    dtype: cand.dtype,
                    ...(cand.device ? { device: cand.device } : {}),
                });
                this.activeLabel = cand.label;
                return this.instance;
            } catch (error: any) {
                failures.push(`${cand.label}: ${error?.message || error}`);
                this.instance = null;
            }
        }
        throw new Error(`No Whisper configuration could load.\n${failures.join('\n')}`);
    }
}

self.addEventListener('message', async (event) => {
    const { id, type, audio, language } = event.data;

    if (type === 'load') {
        try {
            await PipelineFactory.getInstance((x: any) => {
                self.postMessage({ id, type: 'progress', data: x });
            });
            self.postMessage({ id, type: 'ready', backend: PipelineFactory.activeLabel });
        } catch (error: any) {
            self.postMessage({ id, type: 'error', error: error.message });
        }
    } else if (type === 'transcribe') {
        try {
            const transcriber = await PipelineFactory.getInstance();

            // Exact parameters from original ReVoice:
            const result = await transcriber(audio, {
                language: language || 'hindi',
                task: 'transcribe',
                chunk_length_s: 30,
                max_new_tokens: 128,
                no_repeat_ngram_size: 3,
                repetition_penalty: 1.15,
            } as any);

            self.postMessage({ id, type: 'result', text: result.text });
        } catch (error: any) {
            self.postMessage({ id, type: 'error', error: error.message });
        }
    }
});
