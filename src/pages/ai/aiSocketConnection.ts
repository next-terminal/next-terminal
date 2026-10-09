interface Options {
    createSocket: () => WebSocket;
    onConnecting: () => void;
    onOpen: (socket: WebSocket, reconnected: boolean) => void;
    onClose: () => void;
    onMessage: (event: MessageEvent) => void;
}

// 重连只恢复连接，由调用方加载历史，不自动重发消息。
export function createAISocketConnection(options: Options) {
    let socket: WebSocket | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let attempts = 0;
    let connectedBefore = false;

    const connect = () => {
        if (stopped) return;
        options.onConnecting();
        const current = options.createSocket();
        socket = current;
        current.onopen = () => {
            if (stopped || socket !== current) return;
            attempts = 0;
            options.onOpen(current, connectedBefore);
            connectedBefore = true;
        };
        current.onmessage = event => {
            if (!stopped && socket === current) options.onMessage(event);
        };
        current.onerror = () => {
            // 浏览器随后触发 close，统一在 close 中安排重连。
            current.close();
        };
        current.onclose = () => {
            if (stopped || socket !== current) return;
            options.onClose();
            const delay = Math.min(1000 * 2 ** attempts++, 10_000);
            retryTimer = setTimeout(connect, delay);
        };
    };

    connect();
    return () => {
        stopped = true;
        if (retryTimer !== undefined) clearTimeout(retryTimer);
        socket?.close(1000, 'close ai assistant');
    };
}
