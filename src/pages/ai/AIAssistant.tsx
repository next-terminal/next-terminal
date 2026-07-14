import {type CSSProperties, useEffect, useRef, useState} from 'react';
import {
    App,
    Button,
    Drawer,
    Empty,
    Input,
    List,
    Modal,
    Popconfirm,
    Progress,
    Select,
    Spin,
    Tooltip,
    Typography,
} from 'antd';
import type {DrawerProps} from 'antd';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import copy from 'copy-to-clipboard';
import {
    AlertTriangleIcon,
    ArrowUpIcon,
    BrainIcon,
    CheckCircle2Icon,
    ChevronDownIcon,
    ChevronRightIcon,
    CopyIcon,
    HistoryIcon,
    LoaderCircleIcon,
    RotateCcwIcon,
    SparklesIcon,
    SquareIcon,
    TerminalIcon,
    Trash2Icon,
    XCircleIcon,
} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import aiApi, {type AIConversation, type AIMessage} from '@/api/ai-api';
import {MarkdownRenderer} from '@/components/MarkdownRenderer';
import {MOBILE_TOOL_DRAWER_STYLES} from '@/pages/access/terminal-tool-drawer';

type ConnectionState = 'connecting' | 'open' | 'closed' | 'error';
type ToolStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'auto';

type ChatItem =
    | {id: string; kind: 'user'; text: string; queued?: boolean}
    | {id: string; kind: 'assistant'; text: string; reasoning: string; streaming: boolean}
    | {id: string; kind: 'tool_call'; callId: string; name: string; arguments?: Record<string, unknown>; status: ToolStatus}
    | {id: string; kind: 'tool_result'; callId: string; output: string; exitCode: number; durationMs: number; rejected?: boolean; timedOut?: boolean; cancelled?: boolean}
    | {id: string; kind: 'error'; text: string};

interface Usage {
    prompt: number;
    completion: number;
    total: number;
    contextWindow: number;
}

interface Props {
    open?: boolean;
    drawer?: boolean;
    drawerPlacement?: DrawerProps['placement'];
    drawerSize?: DrawerProps['size'];
    embedded?: boolean;
    embeddedHeight?: number;
    sessionId?: string;
    defaultAssetId?: string;
    title?: string;
    getContainer?: false | HTMLElement | (() => HTMLElement);
    onClose?: () => void;
}

let nextId = 1;
const genId = () => `ai-${Date.now()}-${nextId++}`;

const AIAssistant = ({open = true, drawer = false, drawerPlacement = 'right', drawerSize = 'min(560px, 100vw)', embedded = false, embeddedHeight, sessionId, defaultAssetId, title, getContainer, onClose}: Props) => {
    const {t} = useTranslation();
    const {message} = App.useApp();
    const queryClient = useQueryClient();
    const wsRef = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [connection, setConnection] = useState<ConnectionState>('closed');
    const [conversationId, setConversationId] = useState('');
    const [assetId, setAssetId] = useState(defaultAssetId ?? '');
    const [input, setInput] = useState('');
    const [items, setItems] = useState<ChatItem[]>([]);
    const [busy, setBusy] = useState(false);
    const [usage, setUsage] = useState<Usage | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historySearch, setHistorySearch] = useState('');
    const [loadingConversationId, setLoadingConversationId] = useState('');

    const scopeType = sessionId ? 'terminal' : 'global';
    const scopeTargetId = sessionId ?? '';
    const historyQueryKey = ['ai-conversations', scopeType, scopeTargetId];

    const assetsQuery = useQuery({
        queryKey: ['ai-assets'],
        queryFn: aiApi.assets,
        enabled: open && !sessionId,
        staleTime: 30_000,
    });

    const conversationsQuery = useQuery({
        queryKey: historyQueryKey,
        queryFn: () => aiApi.conversations({scopeType, scopeTargetId: scopeTargetId || undefined}),
        enabled: open && historyOpen,
    });

    const loadConversationMutation = useMutation({
        mutationFn: aiApi.conversation,
        onSuccess: (result) => {
            setConversationId(result.conversation.id);
            setItems(itemsFromHistory(result.messages));
            setUsage(usageFromConversation(result.conversation));
            setBusy(false);
            setHistoryOpen(false);
            wsRef.current?.send(JSON.stringify({type: 'load_history', conversationId: result.conversation.id}));
        },
        onError: (error: Error) => message.error(t('ai_assistant.history_load_error', {message: error.message})),
        onSettled: () => setLoadingConversationId(''),
    });

    const deleteConversationMutation = useMutation({
        mutationFn: aiApi.deleteConversation,
        onSuccess: async (_, deletedId) => {
            if (deletedId === conversationId) {
                resetConversation();
            }
            await queryClient.invalidateQueries({queryKey: historyQueryKey});
        },
        onError: (error: Error) => message.error(t('ai_assistant.history_delete_error', {message: error.message})),
    });

    const clearConversationsMutation = useMutation({
        mutationFn: aiApi.clearConversations,
        onSuccess: async () => {
            resetConversation();
            await queryClient.invalidateQueries({queryKey: ['ai-conversations']});
        },
        onError: (error: Error) => message.error(t('ai_assistant.history_clear_error', {message: error.message})),
    });

    useEffect(() => {
        if (defaultAssetId) {
            setAssetId(defaultAssetId);
        }
    }, [defaultAssetId]);

    useEffect(() => {
        if (!open) {
            return;
        }
        setConnection('connecting');
        const ws = new WebSocket(aiApi.buildWebSocketUrl(sessionId));
        wsRef.current = ws;
        ws.onopen = () => setConnection('open');
        ws.onclose = () => {
            setConnection('closed');
            setBusy(false);
            stopStreaming();
        };
        ws.onerror = () => {
            setConnection('error');
            message.error(t('ai_assistant.connection_error'));
        };
        ws.onmessage = (event) => {
            try {
                handleSocketEvent(JSON.parse(event.data));
            } catch {
                message.error(t('ai_assistant.invalid_response'));
            }
        };
        return () => {
            ws.close(1000, 'close ai assistant');
            wsRef.current = null;
        };
    }, [open, sessionId]);

    useEffect(() => {
        const element = scrollRef.current;
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }, [items]);

    const stopStreaming = () => {
        setItems((current) => current.map((item) =>
            item.kind === 'assistant' && item.streaming ? {...item, streaming: false} : item,
        ));
    };

    const handleSocketEvent = (payload: any) => {
        switch (payload.type) {
            case 'conversation_created':
                setConversationId(payload.conversationId || payload.conversation?.id || '');
                queryClient.invalidateQueries({queryKey: ['ai-conversations']});
                break;
            case 'history_loaded':
                if (payload.conversation?.messages) {
                    setItems(itemsFromHistory(payload.conversation.messages));
                }
                break;
            case 'user_message':
                setItems((current) => {
                    const queuedIndex = payload.clientMessageId
                        ? current.findIndex((item) => item.kind === 'user' && item.id === payload.clientMessageId)
                        : -1;
                    if (queuedIndex < 0) {
                        return [...current, {id: payload.clientMessageId || genId(), kind: 'user', text: payload.text || ''}];
                    }
                    return current.map((item, index) => index === queuedIndex && item.kind === 'user' ? {...item, queued: false} : item);
                });
                setBusy(true);
                break;
            case 'assistant_text':
                appendAssistant(payload.delta || payload.text || '', false);
                break;
            case 'assistant_reasoning':
                appendAssistant(payload.delta || payload.text || '', true);
                break;
            case 'tool_call_pending':
                stopStreaming();
                setItems((current) => [...current, {
                    id: genId(),
                    kind: 'tool_call',
                    callId: payload.callId || '',
                    name: payload.name || payload.toolName || 'tool',
                    arguments: payload.arguments,
                    status: payload.requiresConfirmation ? 'pending' : 'auto',
                }]);
                break;
            case 'tool_result':
                stopStreaming();
                setItems((current) => [
                    ...current.map((item) => item.kind === 'tool_call' && item.callId === payload.callId
                        ? {...item, status: payload.cancelled ? 'cancelled' : payload.rejected ? 'rejected' : 'approved'} as ChatItem
                        : item),
                    {
                        id: genId(),
                        kind: 'tool_result',
                        callId: payload.callId || '',
                        output: payload.output || '',
                        exitCode: payload.exitCode ?? 0,
                        durationMs: payload.durationMs ?? 0,
                        rejected: payload.rejected,
                        timedOut: payload.timedOut,
                        cancelled: payload.cancelled,
                    },
                ]);
                break;
            case 'usage':
                setUsage({
                    prompt: payload.promptTokens ?? 0,
                    completion: payload.completionTokens ?? 0,
                    total: payload.totalTokens ?? 0,
                    contextWindow: payload.contextWindow ?? 0,
                });
                break;
            case 'error':
                stopStreaming();
                setItems((current) => [...current, {id: genId(), kind: 'error', text: payload.message || payload.text || t('ai_assistant.unknown_error')}]);
                break;
            case 'done':
                stopStreaming();
                queryClient.invalidateQueries({queryKey: ['ai-conversations']});
                break;
            case 'idle':
                stopStreaming();
                setBusy(false);
                queryClient.invalidateQueries({queryKey: ['ai-conversations']});
                break;
        }
    };

    const appendAssistant = (delta: string, reasoning: boolean) => {
        if (!delta) {
            return;
        }
        setItems((current) => {
            const last = current[current.length - 1];
            if (last?.kind === 'assistant' && last.streaming) {
                const next = [...current];
                next[next.length - 1] = reasoning
                    ? {...last, reasoning: last.reasoning + delta}
                    : {...last, text: last.text + delta};
                return next;
            }
            return [...current, {
                id: genId(),
                kind: 'assistant',
                text: reasoning ? '' : delta,
                reasoning: reasoning ? delta : '',
                streaming: true,
            }];
        });
    };

    const sendPrompt = () => {
        const text = input.trim();
        const ws = wsRef.current;
        if (!text || busy || !ws || ws.readyState !== WebSocket.OPEN) {
            return;
        }
        const clientMessageId = genId();
        ws.send(JSON.stringify({
            type: 'prompt',
            text,
            conversationId: conversationId || undefined,
            clientMessageId,
            hostMentions: assetId ? [{hostId: assetId, hostName: ''}] : [],
        }));
        setItems((current) => [...current, {id: clientMessageId, kind: 'user', text, queued: true}]);
        setInput('');
        setBusy(true);
    };

    const cancelRun = () => {
        wsRef.current?.send(JSON.stringify({type: 'cancel'}));
        setBusy(false);
        stopStreaming();
        setItems((current) => current.map((item) =>
            item.kind === 'tool_call' && (item.status === 'pending' || item.status === 'auto')
                ? {...item, status: 'cancelled'}
                : item,
        ));
    };

    const respondToTool = (callId: string, approved: boolean) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return;
        }
        ws.send(JSON.stringify({type: approved ? 'approve_tool' : 'reject_tool', callId}));
        setItems((current) => current.map((item) =>
            item.kind === 'tool_call' && item.callId === callId
                ? {...item, status: approved ? 'approved' : 'rejected'}
                : item,
        ));
    };

    function resetConversation() {
        wsRef.current?.send(JSON.stringify({type: 'reset'}));
        setConversationId('');
        setItems([]);
        setInput('');
        setBusy(false);
        setUsage(null);
    }

    const pendingTool = [...items].reverse().find((item): item is Extract<ChatItem, {kind: 'tool_call'}> =>
        item.kind === 'tool_call' && item.status === 'pending',
    );
    const filteredConversations = (conversationsQuery.data ?? []).filter((item) =>
        (item.title || t('ai_assistant.new_chat')).toLowerCase().includes(historySearch.trim().toLowerCase()),
    );
    const contextUsagePercent = usage?.contextWindow
        ? Math.min(100, Math.round(usage.total * 100 / usage.contextWindow))
        : 0;

    const handleRootKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c' && busy && !document.getSelection()?.toString()) {
            event.preventDefault();
            cancelRun();
            return;
        }
        if (!pendingTool || event.target !== event.currentTarget) {
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            respondToTool(pendingTool.callId, true);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            respondToTool(pendingTool.callId, false);
        }
    };

    const assistantTitle = (
        <div className="flex min-w-0 items-center gap-2">
            <SparklesIcon className="h-4 w-4 shrink-0"/>
            <Typography.Text strong ellipsis>{title || t('ai_assistant.title')}</Typography.Text>
            {usage && usage.total > 0 && usage.contextWindow > 0 && (
                <Tooltip title={t('ai_assistant.context_usage_detail', {used: usage.total, total: usage.contextWindow})}>
                    <Progress
                        className="m-0 w-28 shrink-0"
                        percent={contextUsagePercent}
                        size="small"
                        status={contextUsagePercent >= 90 ? 'exception' : 'normal'}
                        format={(percent) => t('ai_assistant.context_usage', {percent})}
                    />
                </Tooltip>
            )}
        </div>
    );
    const assistantActions = (
        <div className="flex shrink-0 items-center gap-1">
            <Tooltip title={t('ai_assistant.history')}>
                <Button type="text" size="small" style={{marginBottom: 0}} icon={<HistoryIcon className="h-4 w-4"/>} onClick={() => setHistoryOpen(true)}/>
            </Tooltip>
            <Tooltip title={t('ai_assistant.new_chat')}>
                <Button type="text" size="small" style={{marginBottom: 0}} disabled={!items.length && !busy} icon={<RotateCcwIcon className="h-4 w-4"/>} onClick={resetConversation}/>
            </Tooltip>
            <Tooltip title={connectionLabel(connection, t)}>
                <span className="mx-1 flex h-5 items-center">
                    <span className={`h-2 w-2 rounded-full ${connectionColor(connection)}`}/>
                </span>
            </Tooltip>
        </div>
    );

    const content = (
        <div tabIndex={-1} className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden outline-none" onKeyDown={handleRootKeyDown}>
            {!drawer && (
                <div className="flex min-h-11 shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
                    {assistantTitle}
                    {assistantActions}
                </div>
            )}

            <div ref={scrollRef} className="h-0 min-h-0 flex-1 space-y-2 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-3 text-sm">
                {items.length === 0 ? (
                    <div className="pt-10 text-center text-gray-400">{t('ai_assistant.empty')}</div>
                ) : (
                    <MessageList items={items} onCopy={(text) => {
                        if (copy(text)) {
                            message.success(t('common.copy_success'));
                        }
                    }}/>
                )}
                {busy && <LoadingBubble items={items}/>}
            </div>

            {pendingTool && (
                <div className="flex shrink-0 items-center gap-2 border-t bg-amber-50 px-3 py-2 dark:bg-amber-950/20">
                    <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-600"/>
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5 text-xs">
                            <span className="shrink-0 whitespace-nowrap font-medium text-amber-700 dark:text-amber-300">{t('ai_assistant.command_confirm')}</span>
                            <span className="min-w-0 truncate text-gray-500">{t('ai_assistant.command_shortcut_hint')}</span>
                        </div>
                    </div>
                    <Button size="small" onClick={() => respondToTool(pendingTool.callId, false)}>{t('ai_assistant.reject')}</Button>
                    <Button size="small" type="primary" onClick={() => respondToTool(pendingTool.callId, true)}>{t('ai_assistant.approve')}</Button>
                </div>
            )}

            <div className="relative z-10 mt-auto shrink-0 border-t bg-white p-2 dark:bg-[#1e1f22]">
                <div className="overflow-hidden rounded-md border border-gray-300 bg-black/[0.02] transition-shadow focus-within:border-blue-500 focus-within:shadow-[0_0_0_2px_rgba(22,119,255,0.12)] dark:border-white/15 dark:bg-white/5">
                    <Input.TextArea
                        variant="borderless"
                        autoSize={{minRows: 2, maxRows: 7}}
                        value={input}
                        disabled={connection !== 'open'}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                            const isComposing = event.nativeEvent.isComposing || event.keyCode === 229;
                            if (pendingTool && event.key === 'Enter' && !isComposing) {
                                event.preventDefault();
                                event.stopPropagation();
                                respondToTool(pendingTool.callId, true);
                                return;
                            }
                            if (pendingTool && event.key === 'Escape') {
                                event.preventDefault();
                                event.stopPropagation();
                                respondToTool(pendingTool.callId, false);
                                return;
                            }
                            if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
                                event.preventDefault();
                                sendPrompt();
                            }
                        }}
                        placeholder={pendingTool ? t('ai_assistant.pending_placeholder') : t('ai_assistant.placeholder')}
                    />
                    <div className="flex min-h-10 items-center justify-between gap-2 px-2 py-1.5">
                        <div className="min-w-0 flex-1">
                            {!sessionId && (
                                <Select
                                    allowClear
                                    showSearch
                                    variant="borderless"
                                    size="small"
                                    className="max-w-64"
                                    loading={assetsQuery.isLoading}
                                    placeholder={t('ai_assistant.select_asset')}
                                    value={assetId || undefined}
                                    optionFilterProp="label"
                                    onChange={(value) => setAssetId(value ?? '')}
                                    options={(assetsQuery.data ?? []).map((item) => ({label: item.alias || item.name, value: item.id}))}
                                />
                            )}
                        </div>
                        {busy && !input.trim() ? (
                            <Tooltip title={t('ai_assistant.cancel')}>
                                <Button danger type="primary" shape="circle" size="small" icon={<SquareIcon className="h-3.5 w-3.5 fill-current"/>} onClick={cancelRun}/>
                            </Tooltip>
                        ) : (
                            <Tooltip title={t('ai_assistant.send')}>
                                <Button type="primary" shape="circle" size="small" icon={<ArrowUpIcon className="h-4 w-4"/>} disabled={!input.trim() || busy || connection !== 'open'} onClick={sendPrompt}/>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>

            <HistoryModal
                open={historyOpen}
                search={historySearch}
                conversations={filteredConversations}
                currentId={conversationId}
                loading={conversationsQuery.isLoading || conversationsQuery.isFetching}
                loadingId={loadingConversationId}
                deletingId={deleteConversationMutation.isPending ? deleteConversationMutation.variables ?? '' : ''}
                clearing={clearConversationsMutation.isPending}
                hasConversations={(conversationsQuery.data?.length ?? 0) > 0}
                onClose={() => setHistoryOpen(false)}
                onSearch={setHistorySearch}
                onLoad={(item) => {
                    if (busy) return;
                    setLoadingConversationId(item.id);
                    loadConversationMutation.mutate(item.id);
                }}
                onDelete={(id) => deleteConversationMutation.mutate(id)}
                onClear={() => clearConversationsMutation.mutate()}
            />
        </div>
    );

    const panelStyle = {
        '--ai-assistant-bubble-background': 'color-mix(in srgb, currentColor 6%, transparent)',
        '--ai-assistant-bubble-border': 'color-mix(in srgb, currentColor 14%, transparent)',
    } as CSSProperties;

    if (embedded) {
        return (
            <div
                className="h-full min-h-0 overflow-hidden bg-white dark:bg-[#1e1f22]"
                style={{...panelStyle, height: embeddedHeight}}
            >
                {content}
            </div>
        );
    }

    if (!drawer) {
        return <div className="h-[calc(100dvh-118px)] min-h-0 overflow-hidden border-y bg-white dark:bg-transparent" style={panelStyle}>{content}</div>;
    }

    return (
        <Drawer
            title={assistantTitle}
            extra={assistantActions}
            placement={drawerPlacement}
            open={open}
            size={drawerSize}
            mask={false}
            closable
            destroyOnHidden
            getContainer={getContainer}
            styles={{
                ...MOBILE_TOOL_DRAWER_STYLES,
                body: {padding: 0, overflow: 'hidden'},
            }}
            onClose={onClose}
        >
            <div className="h-full min-h-0 overflow-hidden bg-white dark:bg-[#1e1f22]" style={panelStyle}>{content}</div>
        </Drawer>
    );
};

const MessageList = ({items, onCopy}: {items: ChatItem[]; onCopy: (text: string) => void}) => {
    const {t} = useTranslation();
    const results = new Map(items.filter((item): item is Extract<ChatItem, {kind: 'tool_result'}> => item.kind === 'tool_result').map((item) => [item.callId, item]));
    return <>{items.map((item) => {
        if (item.kind === 'tool_result') return null;
        if (item.kind === 'tool_call') return <ToolCallItem key={item.id} item={item} result={results.get(item.callId)} onCopy={onCopy}/>;
        if (item.kind === 'error') return <div key={item.id} className="rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">{item.text}</div>;
        if (item.kind === 'user') {
            return (
                <div key={item.id} className="flex min-w-0 justify-end">
                    <div className={`group/message relative min-w-0 max-w-[80%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 pr-8 ${item.queued ? 'border border-dashed border-blue-500/40 bg-blue-500/10' : 'bg-blue-500 text-white'}`}>
                        <CopyButton onClick={() => onCopy(item.text)}/>
                        {item.text}
                        {item.queued && <div className="mt-1 text-[10px] font-medium text-gray-500">{t('ai_assistant.queued')}</div>}
                    </div>
                </div>
            );
        }
        return (
            <div key={item.id} className="group/message relative w-full max-w-full min-w-0 overflow-hidden break-words rounded-lg bg-[var(--ai-assistant-bubble-background)] px-3 py-2 pr-8 ring-1 ring-inset ring-[var(--ai-assistant-bubble-border)]">
                <CopyButton onClick={() => onCopy(item.text || item.reasoning)}/>
                {item.reasoning && <ReasoningContent text={item.reasoning} streaming={item.streaming} onCopy={onCopy}/>}
                {item.text && <MarkdownRenderer text={item.text}/>}
                {item.streaming && <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle opacity-60"/>}
            </div>
        );
    })}</>;
};

const CopyButton = ({onClick}: {onClick: () => void}) => {
    const {t} = useTranslation();
    return (
        <Tooltip title={t('actions.copy')}>
            <button
                type="button"
                aria-label={t('actions.copy')}
                className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded text-current opacity-0 transition-opacity hover:bg-black/10 focus-visible:opacity-100 group-hover/message:opacity-70 dark:hover:bg-white/10"
                onClick={onClick}
            >
                <CopyIcon className="h-3.5 w-3.5"/>
            </button>
        </Tooltip>
    );
};

const ToolCallItem = ({item, result, onCopy}: {
    item: Extract<ChatItem, {kind: 'tool_call'}>;
    result?: Extract<ChatItem, {kind: 'tool_result'}>;
    onCopy: (text: string) => void;
}) => {
    const {t} = useTranslation();
    const [expanded, setExpanded] = useState(!result || item.status === 'pending' || result.exitCode !== 0);
    const failed = item.status === 'rejected' || item.status === 'cancelled' || result?.timedOut || (result && result.exitCode !== 0);
    const running = !result && item.status !== 'pending' && !failed;
    const icon = running
        ? <LoaderCircleIcon className="h-4 w-4 animate-spin"/>
        : failed ? <XCircleIcon className="h-4 w-4"/> : result ? <CheckCircle2Icon className="h-4 w-4"/> : <TerminalIcon className="h-4 w-4"/>;
    const label = formatToolCall(item);
    const output = result?.output ?? '';
    const statusText = item.status === 'rejected'
        ? t('ai_assistant.tool_rejected')
        : item.status === 'cancelled' || result?.cancelled
            ? t('ai_assistant.tool_cancelled')
            : item.status === 'pending'
                ? t('ai_assistant.tool_pending')
                : result?.timedOut
                    ? t('ai_assistant.tool_timed_out')
                    : result?.exitCode === 0
                        ? t('ai_assistant.tool_done')
                        : result
                            ? t('ai_assistant.tool_failed')
                            : t('ai_assistant.running_tool');
    const canExpand = label.trim().length > 0 || Boolean(result);
    return (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-black/[0.02] dark:border-white/10 dark:bg-white/5">
            <button
                type="button"
                disabled={!canExpand}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs outline-none transition-colors hover:bg-black/[0.035] focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-default dark:hover:bg-white/[0.06]"
                title={label}
                onClick={() => setExpanded((value) => !value)}
            >
                <span className={`flex shrink-0 items-center gap-1 rounded-sm bg-black/[0.05] px-1.5 py-0.5 text-[10px] leading-none dark:bg-white/10 ${failed ? 'text-red-500' : result ? 'text-emerald-600 dark:text-emerald-400' : item.status === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`}>
                    {icon}
                    <span>{statusText}</span>
                </span>
                <span className="min-w-0 flex-1 truncate font-mono">{label || item.name}</span>
                {result && <span className="shrink-0 tabular-nums text-gray-500">{result.durationMs}ms</span>}
                {canExpand && (expanded ? <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-500"/> : <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-500"/>)}
            </button>
            {canExpand && expanded && (
                <div className="space-y-2 border-t border-gray-200 bg-black/[0.025] px-2 py-2 dark:border-white/10 dark:bg-white/[0.025]">
                    {label.trim() && <ToolTextBlock title={t('ai_assistant.full_command')} text={label} onCopy={() => onCopy(label)}/>}
                    {result && <ToolTextBlock title={t('ai_assistant.tool_output')} text={output || t('ai_assistant.no_output')} muted={!output} onCopy={() => onCopy(output)}/>}
                </div>
            )}
        </div>
    );
};

const LoadingBubble = ({items}: {items: ChatItem[]}) => {
    const {t} = useTranslation();
    const last = items[items.length - 1];
    const label = last?.kind === 'tool_call' ? t('ai_assistant.running_tool') : last?.kind === 'user' ? t('ai_assistant.thinking') : t('ai_assistant.generating');
    if (last?.kind === 'assistant' && last.streaming) return null;
    return (
        <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg bg-[var(--ai-assistant-bubble-background)] px-3 py-2 text-xs text-gray-500 ring-1 ring-inset ring-[var(--ai-assistant-bubble-border)]">
                <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"/>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"/>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"/>
                </span>
                <span>{label}</span>
            </div>
        </div>
    );
};

const ReasoningContent = ({text, streaming, onCopy}: {text: string; streaming: boolean; onCopy: (text: string) => void}) => {
    const {t} = useTranslation();
    const [expanded, setExpanded] = useState(streaming);
    return (
        <div className="mb-2 overflow-hidden rounded-md border border-gray-200 bg-white/45 dark:border-white/10 dark:bg-black/15">
            <div className="flex min-w-0 items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-1.5 text-left outline-none" onClick={() => setExpanded((value) => !value)}>
                    {expanded ? <ChevronDownIcon className="h-3.5 w-3.5 shrink-0"/> : <ChevronRightIcon className="h-3.5 w-3.5 shrink-0"/>}
                    <BrainIcon className="h-3.5 w-3.5 shrink-0"/>
                    <span className="truncate font-medium">{t('ai_assistant.reasoning')}</span>
                    {streaming && <LoaderCircleIcon className="h-3.5 w-3.5 shrink-0 animate-spin"/>}
                </button>
                <Tooltip title={t('actions.copy')}><Button type="text" size="small" icon={<CopyIcon className="h-3.5 w-3.5"/>} onClick={() => onCopy(text)}/></Tooltip>
            </div>
            {expanded && <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words border-t border-gray-200 px-2 py-2 text-xs leading-relaxed text-gray-500 dark:border-white/10">{text}</pre>}
        </div>
    );
};

const ToolTextBlock = ({title, text, muted, onCopy}: {title: string; text: string; muted?: boolean; onCopy: () => void}) => {
    const {t} = useTranslation();
    return (
        <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium text-gray-500">{title}</span>
                <Tooltip title={t('actions.copy')}><Button type="text" size="small" icon={<CopyIcon className="h-3.5 w-3.5"/>} onClick={onCopy}/></Tooltip>
            </div>
            <pre className={`max-h-64 overflow-auto whitespace-pre rounded bg-white/70 px-2 py-1.5 font-mono text-xs leading-relaxed dark:bg-black/20 ${muted ? 'text-gray-500' : ''}`}>{text}</pre>
        </div>
    );
};

const HistoryModal = ({open, search, conversations, currentId, loading, loadingId, deletingId, clearing, hasConversations, onClose, onSearch, onLoad, onDelete, onClear}: {
    open: boolean;
    search: string;
    conversations: AIConversation[];
    currentId: string;
    loading: boolean;
    loadingId: string;
    deletingId: string;
    clearing: boolean;
    hasConversations: boolean;
    onClose: () => void;
    onSearch: (value: string) => void;
    onLoad: (item: AIConversation) => void;
    onDelete: (id: string) => void;
    onClear: () => void;
}) => {
    const {t} = useTranslation();
    return (
        <Modal title={t('ai_assistant.history')} open={open} footer={null} width={620} destroyOnHidden onCancel={onClose}>
            <div className="mb-3 flex items-center gap-2">
                <Input.Search allowClear value={search} placeholder={t('ai_assistant.history_search')} onChange={(event) => onSearch(event.target.value)}/>
                <Popconfirm title={t('ai_assistant.clear_confirm')} onConfirm={onClear}>
                    <Button danger loading={clearing} disabled={!hasConversations} icon={<Trash2Icon className="h-4 w-4"/>}>{t('actions.clear')}</Button>
                </Popconfirm>
            </div>
            <List
                className="max-h-[55vh] overflow-y-auto"
                loading={loading}
                dataSource={conversations}
                locale={{emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('ai_assistant.no_history')}/>}}
                renderItem={(item) => (
                    <List.Item
                        className="cursor-pointer"
                        onClick={() => onLoad(item)}
                        actions={[
                            <Popconfirm key="delete" title={t('ai_assistant.delete_confirm')} onConfirm={() => onDelete(item.id)}>
                                <Button
                                    danger
                                    type="text"
                                    size="small"
                                    loading={deletingId === item.id}
                                    icon={<Trash2Icon className="h-4 w-4"/>}
                                    onClick={(event) => event.stopPropagation()}
                                />
                            </Popconfirm>,
                        ]}
                    >
                        <List.Item.Meta
                            title={<Typography.Text ellipsis className={item.id === currentId ? 'text-blue-500' : undefined}>{item.title || t('ai_assistant.new_chat')}</Typography.Text>}
                            description={new Date(item.updatedAt).toLocaleString()}
                        />
                        {loadingId === item.id && <Spin size="small"/>}
                    </List.Item>
                )}
            />
        </Modal>
    );
};

const itemsFromHistory = (messages: AIMessage[]): ChatItem[] => messages.flatMap((item): ChatItem[] => {
    if (item.role === 'user') return [{id: item.id, kind: 'user', text: item.content}];
    if (item.role === 'assistant') return [{id: item.id, kind: 'assistant', text: item.content, reasoning: '', streaming: false}];
    if (item.role === 'error') return [{id: item.id, kind: 'error', text: item.content}];
    if (item.role === 'tool_call' && item.toolCall) return [{id: item.id, kind: 'tool_call', ...item.toolCall}];
    if (item.role === 'tool_result' && item.toolResult) return [{id: item.id, kind: 'tool_result', ...item.toolResult}];
    return item.content ? [{id: item.id, kind: 'error', text: item.content}] : [];
});

const usageFromConversation = (conversation: AIConversation): Usage | null => {
    const value = conversation.usage;
    const total = Number(value?.totalTokens ?? value?.total ?? 0);
    if (!total) return null;
    return {
        prompt: Number(value?.promptTokens ?? value?.prompt ?? 0),
        completion: Number(value?.completionTokens ?? value?.completion ?? 0),
        total,
        contextWindow: Number(value?.contextWindow ?? 0),
    };
};

const formatToolCall = (item: Extract<ChatItem, {kind: 'tool_call'}>) => {
    const args = item.arguments ?? {};
    if (typeof args.command === 'string' && args.command) return `$ ${args.command}`;
    const detail = args.path || args.query || JSON.stringify(args);
    return [item.name, detail].filter(Boolean).join(' ');
};

const connectionColor = (connection: ConnectionState) => {
    if (connection === 'open') return 'bg-emerald-500';
    if (connection === 'connecting') return 'bg-amber-500';
    if (connection === 'error') return 'bg-red-500';
    return 'bg-gray-400';
};

const connectionLabel = (connection: ConnectionState, t: (key: string) => string) => {
    if (connection === 'open') return t('ai_assistant.connected');
    if (connection === 'connecting') return t('ai_assistant.connecting');
    return t('ai_assistant.disconnected');
};

export default AIAssistant;
