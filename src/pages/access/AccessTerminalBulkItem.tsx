import eventEmitter from "@/api/core/event-emitter";
import { baseWebSocketUrl } from "@/api/core/requests";
import portalApi,{ ExportSession } from "@/api/portal-api";
import { useAccessContentSize } from "@/pages/access/hooks/use-access-size";
import { CleanTheme,useTerminalTheme } from "@/pages/access/hooks/use-terminal-theme";
import { Message,MessageTypeData,MessageTypePing,MessageTypeResize } from "@/pages/access/Terminal";
import { normalizeTerminalBackspace } from "@/pages/access/terminal-backspace";
import { debounce } from "@/utils/debounce";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { Popconfirm } from "antd";
import { clsx } from "clsx";
import { XIcon } from "lucide-react";
import qs from "qs";
import React,{ useEffect,useRef,useState } from 'react';
import { useTranslation } from "react-i18next";
import { useInterval,useWindowSize } from "react-use";

interface Props {
    assetId: string;
    securityToken?: string;
    tabId: string;
    onClose?: () => void;
}

const AccessTerminalBulkItem = React.memo(({assetId, securityToken, tabId, onClose}: Props) => {
    let {t} = useTranslation();

    const terminalRef = React.useRef<HTMLDivElement>(null);
    const terminal = useRef<Terminal>(null);
    const fit = useRef<FitAddon>(null);

    let [websocket, setWebsocket] = useState<WebSocket | null>(null);
    let {width, height} = useWindowSize();
    let [contentSize] = useAccessContentSize();

    let [accessTheme] = useTerminalTheme();

    let [loading, setLoading] = useState(false);
    let [reconnected, setReconnected] = useState('');
    let [isFocus, setIsFocus] = useState(false);
    let [session, setSession] = useState<ExportSession>();

    useInterval(() => {
        if (websocket?.readyState === WebSocket.OPEN) {
            websocket.send(new Message(MessageTypePing, Date.now().toString()).toString());
        }
    }, 5000);

    useEffect(() => {
        if (!fit.current) {
            return;
        }
        fitFit();
    }, [width, height, contentSize]);

    const fitFit = debounce(() => {
        fit.current?.fit();
    }, 500)

    useEffect(() => {
        // 2. 根据 tabId 构建唯一的事件名
        const eventName = `WS:MESSAGE:${tabId}`;

        const handleMessage = (message: string) => {
            // 检查 websocket 是否存在且已连接
            if (websocket?.readyState === WebSocket.OPEN) {
                if (message !== '\r') {
                    message += '\r';
                }
                websocket?.send(new Message(MessageTypeData, message).toString());
                terminal.current?.scrollToBottom();
            }
        }
        eventEmitter.on(eventName, handleMessage);
        return () => {
            eventEmitter.off(eventName, handleMessage);
        }
    }, [websocket]);

    useEffect(() => {
        if (accessTheme && terminal.current) {
            let options = terminal.current?.options;
            if (options) {
                let cleanTheme = CleanTheme(accessTheme);
                options.theme = cleanTheme?.theme?.value;
                options.fontFamily = cleanTheme.fontFamily;
                options.fontSize = cleanTheme.fontSize;
                options.lineHeight = cleanTheme.lineHeight;
            }
        }
    }, [accessTheme]);

    useEffect(() => {
        let cleanTheme = CleanTheme(accessTheme);
        let term = new Terminal({
            theme: cleanTheme?.theme?.value,
            fontFamily: cleanTheme.fontFamily,
            fontSize: cleanTheme.fontSize,
            lineHeight: cleanTheme.lineHeight,
        });
        terminal.current = term;
        term.attachCustomKeyEventHandler((domEvent) => {
            if (domEvent.ctrlKey && domEvent.key === 'c' && term.hasSelection()) {
                return false;
            }
            return !(domEvent.ctrlKey && domEvent.key === 'v');
        })

        if (!terminalRef.current) {
            return;
        }
        term.open(terminalRef.current);
        const textarea = term.textarea;
        textarea?.addEventListener('focus', () => {
            setIsFocus(true);
        });
        textarea?.addEventListener('blur', () => {
            setIsFocus(false);
        })

        let fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        fitAddon.fit();
        term.focus();

        fit.current = fitAddon;

        return () => {
            term.dispose();
        }
    }, [])

    const connect = async (securityToken: string) => {
        if (loading === true) {
            return;
        }

        setLoading(true);

        let session: ExportSession;
        try {
            session = await portalApi.createSessionByAssetsId(assetId, securityToken);
            setSession(session);
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            terminal.current?.writeln(`\x1b[41m ERROR \x1b[0m : ${message}`);
            setLoading(false);
            return;
        }

        let cols = terminal.current?.cols;
        let rows = terminal.current?.rows;
        let params = {
            'cols': cols,
            'rows': rows,
            'sessionId': session.id,
        };

        let paramStr = qs.stringify(params);
        let websocket = new WebSocket(`${baseWebSocketUrl()}/access/terminal?${paramStr}`);
        websocket.onopen = (_e => {
            setLoading(false);
        });

        websocket.onerror = (_e) => {
            terminal.current?.writeln(`websocket error`);
            setLoading(false);
        }

        websocket.onclose = (e) => {
            if (e.code === 3886) {
                terminal.current?.writeln('');
                terminal.current?.writeln('');
                terminal.current?.writeln(`\x1b[41m ${session.protocol.toUpperCase()} \x1b[0m ${session.assetName}: session timeout.`);
            } else {
                terminal.current?.writeln('');
                terminal.current?.writeln('');
                terminal.current?.writeln(`\x1b[41m ${session.protocol.toUpperCase()} \x1b[0m ${session.assetName}: session closed.`);
            }
            setLoading(false);
            terminal.current?.writeln('Press any key to reconnect');

            setWebsocket(null);
        }

        websocket.onmessage = (e) => {
            let msg = Message.parse(e.data);
            switch (msg.type) {
                case MessageTypeData:
                    terminal.current?.write(msg.content);
                    break;
            }
        }
        setWebsocket(websocket);
    }

    useEffect(() => {
        if (!terminal.current) {
            return;
        }
        connect(securityToken ?? '')
    }, [reconnected]);

    useEffect(() => {
        let sizeListener = terminal.current?.onResize(function (evt) {
            // console.log(`term resize`, evt.cols, evt.rows);
            websocket?.send(new Message(MessageTypeResize, `${evt.cols},${evt.rows}`).toString());
        });
        let dataListener = terminal.current?.onData(data => {
            if (!websocket) {
                setReconnected(new Date().toString());
            } else {
                websocket?.send(new Message(MessageTypeData, normalizeTerminalBackspace(data, session)).toString());
            }
        });
        if (websocket) {
            terminal.current?.writeln('trying to connect to the server ...');
        }

        return () => {
            sizeListener?.dispose();
            dataListener?.dispose();
            websocket?.close();
        }
    }, [websocket, session?.attrs?.backspaceMode]);

    return (
        <div className={clsx(
            'rounded-lg border shadow-sm transition-all duration-200',
            isFocus ? 'border-blue-500 shadow-md shadow-blue-500/20' : 'border-gray-700',
        )}>
            <div
                className={'flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50 rounded-t-lg'}>
                <div className={'font-medium text-sm truncate flex-1 text-gray-200'}>
                    {session?.assetName || t('access.terminal.connecting')}
                </div>
                <Popconfirm
                    title={t('access.terminal.close_title')}
                    description={t('access.terminal.close_confirm')}
                    onConfirm={() => {
                        websocket?.close();
                        onClose?.();
                    }}
                    okText={t('actions.confirm')}
                    cancelText={t('actions.cancel')}
                >
                    <XIcon
                        className={'h-4 w-4 cursor-pointer text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2'}/>
                </Popconfirm>
            </div>
            <div ref={terminalRef}
                 className={'p-2 rounded-b-lg'}
                 style={{
                     background: accessTheme?.theme?.value.background,
                 }}
            >

            </div>
        </div>
    );
});

export default AccessTerminalBulkItem;
