import requests, {baseWebSocketUrl} from '@/api/core/requests';

export interface AIContextUsage {
    systemPromptTokens: number;
    toolDefinitionTokens: number;
    messageTokens: number;
    totalTokens: number;
    estimated?: boolean;
}

export interface AICacheUsage {
    inputTokens: number;
    readTokens: number;
    creationTokens?: number;
    requestCount: number;
}

export type AIToolExecutionState = 'reviewing' | 'awaiting_approval' | 'running' | 'succeeded' | 'failed' | 'rejected' | 'cancelled' | 'timed_out' | 'needs_revision';

export interface AIToolExecutionResult {
    output: string;
    exitCode: number;
    durationMs: number;
    rejected?: boolean;
    timedOut?: boolean;
    cancelled?: boolean;
    truncated?: boolean;
    needsRevision?: boolean;
}

export interface AIToolExecution {
    executionId: string;
    name: string;
    arguments?: Record<string, unknown>;
    fileDiff?: {
        originalContent: string;
        modifiedContent?: string;
        fileExisted: boolean;
    };
    approvalReview?: {
        status: 'reviewing' | 'approved' | 'needs_user' | 'denied' | 'failed' | 'revised';
        riskLevel?: string;
        userAuthorization?: string;
        rationale?: string;
    };
    state: AIToolExecutionState;
    result?: AIToolExecutionResult;
}

export interface AIMessage {
    id: string;
    role: 'user' | 'assistant' | 'tool' | 'error' | 'tool_call' | 'tool_result';
    content?: string;
    reasoningContent?: string;
    toolExecution?: AIToolExecution & {providerCallId?: string; updatedAt?: number};
    toolCall?: {
        callId: string;
        name: string;
        arguments?: Record<string, unknown>;
        status?: string;
    };
    toolResult?: AIToolExecutionResult & {callId?: string};
    createdAt: number;
}

export interface AIConversation {
    schemaVersion?: number;
    id: string;
    userId?: string;
    scopeType: 'global';
    scopeTargetId?: string;
    agentModel?: string;
    title?: string;
    messages?: AIMessage[];
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        context?: AIContextUsage;
        cache?: AICacheUsage;
    };
    createdAt: number;
    updatedAt: number;
}

export interface AIModelOptions {
    contextWindow?: number;
    model: string;
    models: string[];
}

export type AIOutboundMessage = {
    type: 'assistant_text' | 'assistant_reasoning' | 'tool_execution' | 'usage' | 'retrying' | 'done' | 'idle' | 'error' | 'user_message' | 'history_loaded' | 'conversation_created' | 'conversation_rewound';
    delta?: string;
    text?: string;
    execution?: AIToolExecution;
    message?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    conversationId?: string;
    conversation?: AIConversation;
    clientMessageId?: string;
    messageId?: string;
    retryAttempt?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    estimated?: boolean;
    contextUsage?: AIContextUsage;
    cacheUsage?: AICacheUsage;
};

export type AIInboundMessage =
    | {type: 'prompt'; text: string; model?: string; conversationId?: string; clientMessageId?: string; hostMentions?: Array<{hostId: string; hostName: string}>}
    | {type: 'send_now'; clientMessageId: string}
    | {type: 'retry_from_message'; text: string; model?: string; conversationId: string; messageId: string; clientMessageId?: string; hostMentions?: Array<{hostId: string; hostName: string}>}
    | {type: 'tool_decision'; executionId: string; decision: 'approve' | 'reject'; reason?: string; remember?: boolean}
    | {type: 'cancel'}
    | {type: 'reset'}
    | {type: 'load_history'; conversationId: string}
    | {type: 'compact'; conversationId?: string; executionId: string};

class AIApi {
    buildWebSocketUrl = () => `${baseWebSocketUrl()}/ai/ws`;

    conversations = async () => await requests.get('/ai/conversations') as AIConversation[];

    modelOptions = async () => await requests.get('/ai/model-options') as AIModelOptions;

    conversation = async (id: string) => await requests.get(`/ai/conversations/${encodeURIComponent(id)}`) as AIConversation;

    deleteConversation = async (id: string) => {
        await requests.delete(`/ai/conversations/${encodeURIComponent(id)}`);
    };

    clearConversations = async () => {
        await requests.delete('/ai/conversations');
    };
}

const aiApi = new AIApi();
export default aiApi;
