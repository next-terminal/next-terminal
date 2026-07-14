import qs from 'qs';
import requests, {baseWebSocketUrl} from '@/api/core/requests';

export interface AIAsset {
    id: string;
    name: string;
    alias?: string;
    ip: string;
    port: number;
    protocol: string;
    attrs?: Record<string, any>;
}

export interface AIConversation {
    id: string;
    userId: string;
    scopeType: 'global' | 'terminal';
    scopeTargetId?: string;
    terminalSessionId?: string;
    agentProvider?: string;
    agentModel?: string;
    title: string;
    usage?: Record<string, any>;
    createdAt: number;
    updatedAt: number;
}

export interface AIMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'tool' | 'tool_call' | 'tool_result' | 'error';
    content: string;
    toolCall?: {
        callId: string;
        name: string;
        arguments?: Record<string, unknown>;
        status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'auto';
    };
    toolResult?: {
        callId: string;
        output: string;
        exitCode: number;
        durationMs: number;
        rejected?: boolean;
        timedOut?: boolean;
        cancelled?: boolean;
    };
    createdAt: number;
}

class AIApi {
    buildWebSocketUrl = (sessionId?: string) => {
        if (sessionId) {
            return `${baseWebSocketUrl()}/ai/sessions/${sessionId}/ws`;
        }
        return `${baseWebSocketUrl()}/ai/ws`;
    };

    assets = async () => {
        return await requests.get('/ai/assets') as AIAsset[];
    };

    conversations = async (params: { scopeType?: string; scopeTargetId?: string }) => {
        const paramsStr = qs.stringify(params);
        return await requests.get(`/ai/conversations?${paramsStr}`) as AIConversation[];
    };

    conversation = async (id: string) => {
        return await requests.get(`/ai/conversations/${id}`) as {
            conversation: AIConversation;
            messages: AIMessage[];
        };
    };

    deleteConversation = async (id: string) => {
        await requests.delete(`/ai/conversations/${id}`);
    };

    clearConversations = async () => {
        await requests.delete('/ai/conversations');
    };
}

const aiApi = new AIApi();
export default aiApi;
