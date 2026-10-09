import type {AIOutboundMessage} from '@/api/ai-api';

// 与 Termark 的 AI 事件缓冲保持一致：同类文本增量合并后再交给界面。
const STREAM_UPDATE_INTERVAL_MS = 40;

export function createAIEventBuffer(deliver: (event: AIOutboundMessage) => void) {
    let pending: AIOutboundMessage | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
        const event = pending;
        pending = undefined;
        if (event) deliver(event);
    };

    return {
        push(event: AIOutboundMessage) {
            if (event.type !== 'assistant_text' && event.type !== 'assistant_reasoning') {
                flush();
                deliver(event);
                return;
            }
            const delta = event.delta || event.text;
            if (!delta) return;
            if (pending && pending.type !== event.type) flush();
            pending = pending ? {...pending, delta: (pending.delta || pending.text || '') + delta, text: undefined} : {...event, delta, text: undefined};
            timer ??= setTimeout(flush, STREAM_UPDATE_INTERVAL_MS);
        },
        dispose() {
            if (timer !== undefined) clearTimeout(timer);
            timer = undefined;
            pending = undefined;
        },
    };
}
