import requests from '@/api/core/requests';

export type AIConfirmMode = 'auto' | 'balanced' | 'always';
export type AIBuiltinAPIType = 'openai' | 'openai_responses';
export type AIBuiltinPresetId = 'openai' | 'deepseek' | 'openrouter' | 'qwen' | 'kimi' | 'glm' | 'xiaomi' | 'ollama' | 'custom';
export type AIReasoningProtocol = '' | 'openai' | 'thinking_object' | 'qwen';
export type AIThinkingMode = '' | 'enabled' | 'disabled';
export type AIReasoningEffort = '' | 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

export const AI_THINKING_BUDGET_MAX = 131072;
export const AI_CONTEXT_WINDOW_MAX = 2000000;
export const AI_REASONING_PROTOCOLS: AIReasoningProtocol[] = ['', 'openai', 'thinking_object', 'qwen'];
export const AI_REASONING_EFFORTS: AIReasoningEffort[] = ['', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh'];

export interface BuiltinAPIProfile {
    id: string;
    name: string;
    presetId: AIBuiltinPresetId;
    apiType: AIBuiltinAPIType;
    baseUrl: string;
    apiKey: string;
    model: string;
    models: string[];
    reasoningProtocol: AIReasoningProtocol;
    thinkingMode: AIThinkingMode;
    reasoningEffort: AIReasoningEffort;
    thinkingBudget: number;
    contextWindow: number;
    maxRetries: number;
    userAgent: string;
    httpProxy: string;
}

export interface AIBuiltinProviderPreset {
    id: AIBuiltinPresetId;
    name: string;
    baseUrl: string;
    model: string;
    models: string[];
    reasoningProtocol: AIReasoningProtocol;
    apiKeyRequired: boolean;
}

export const AI_BUILTIN_PROVIDER_PRESETS: AIBuiltinProviderPreset[] = [
    {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        model: '',
        models: [],
        reasoningProtocol: 'openai',
        apiKeyRequired: true,
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com',
        model: '',
        models: [],
        reasoningProtocol: 'thinking_object',
        apiKeyRequired: true,
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: '',
        models: [],
        reasoningProtocol: '',
        apiKeyRequired: true,
    },
    {
        id: 'qwen',
        name: 'Qwen',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: '',
        models: [],
        reasoningProtocol: 'qwen',
        apiKeyRequired: true,
    },
    {
        id: 'kimi',
        name: 'Kimi',
        baseUrl: 'https://api.moonshot.ai/v1',
        model: '',
        models: [],
        reasoningProtocol: 'thinking_object',
        apiKeyRequired: true,
    },
    {
        id: 'glm',
        name: 'GLM',
        baseUrl: 'https://api.z.ai/api/paas/v4',
        model: '',
        models: [],
        reasoningProtocol: 'thinking_object',
        apiKeyRequired: true,
    },
    {
        id: 'xiaomi',
        name: 'Xiaomi',
        baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
        model: '',
        models: [],
        reasoningProtocol: '',
        apiKeyRequired: true,
    },
    {
        id: 'ollama',
        name: 'Ollama',
        baseUrl: 'http://localhost:11434/v1',
        model: '',
        models: [],
        reasoningProtocol: '',
        apiKeyRequired: false,
    },
    {
        id: 'custom',
        name: 'Custom',
        baseUrl: 'https://api.openai.com/v1',
        model: '',
        models: [],
        reasoningProtocol: '',
        apiKeyRequired: true,
    },
];

export interface BuiltinAgentSettings extends BuiltinAPIProfile {
    activeProfileId: string;
    profiles: BuiltinAPIProfile[];
}

export interface AISettings {
    enabled: boolean;
    disclaimerAccepted: boolean;
    provider: 'builtin';
    builtin: BuiltinAgentSettings;
    confirmMode: AIConfirmMode;
    recentOutputLines: number;
    commandTimeoutSecs: number;
    includeCommandSnippets: boolean;
    customSystemPrompt: string;
}

export const AI_SETTINGS_PROPERTY_KEY = 'ai-settings';

export const DEFAULT_AI_PROFILE: BuiltinAPIProfile = {
    id: 'openai',
    name: 'OpenAI',
    presetId: 'openai',
    apiType: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: '',
    models: [],
    reasoningProtocol: 'openai',
    thinkingMode: '',
    reasoningEffort: '',
    thinkingBudget: 0,
    contextWindow: 128000,
    maxRetries: 3,
    userAgent: '',
    httpProxy: '',
};

export const DEFAULT_AI_SETTINGS: AISettings = {
    enabled: false,
    disclaimerAccepted: false,
    provider: 'builtin',
    builtin: {
        ...DEFAULT_AI_PROFILE,
        id: '',
        name: '',
        baseUrl: '',
        model: '',
        models: [],
        activeProfileId: '',
        profiles: [],
    },
    confirmMode: 'balanced',
    recentOutputLines: 50,
    commandTimeoutSecs: 30,
    includeCommandSnippets: false,
    customSystemPrompt: '',
};

export const getBuiltinPreset = (presetId?: string) => {
    return AI_BUILTIN_PROVIDER_PRESETS.find(item => item.id === presetId) || AI_BUILTIN_PROVIDER_PRESETS[0];
};

const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
        return fallback;
    }
    const intValue = Math.trunc(numeric);
    if (intValue < min || intValue > max) {
        return fallback;
    }
    return intValue;
};

const normalizeProfile = (profile?: Partial<BuiltinAPIProfile>): BuiltinAPIProfile => {
    const next = {
        ...DEFAULT_AI_PROFILE,
        ...(profile || {}),
    };
    next.id = next.id?.trim() || DEFAULT_AI_PROFILE.id;
    next.name = next.name?.trim() || DEFAULT_AI_PROFILE.name;
    const preset = getBuiltinPreset(next.presetId);
    next.presetId = preset.id;
    next.apiType = next.apiType === 'openai_responses' ? 'openai_responses' : DEFAULT_AI_PROFILE.apiType;
    next.baseUrl = next.baseUrl?.trim().replace(/\/+$/, '') || preset.baseUrl || DEFAULT_AI_PROFILE.baseUrl;
    next.apiKey = next.apiKey?.trim() || '';
    next.model = next.model?.trim() || preset.model || '';
    next.models = Array.from(new Set([
        next.model,
        ...((Array.isArray(next.models) ? next.models : []).map(item => `${item}`.trim())),
        ...preset.models,
    ].filter(Boolean)));
    next.reasoningProtocol = AI_REASONING_PROTOCOLS.includes(next.reasoningProtocol as AIReasoningProtocol)
        ? next.reasoningProtocol
        : preset.reasoningProtocol;
    next.thinkingMode = next.reasoningProtocol === 'thinking_object' || next.reasoningProtocol === 'qwen'
        ? (next.thinkingMode === 'enabled' || next.thinkingMode === 'disabled' ? next.thinkingMode : '')
        : '';
    next.reasoningEffort = next.reasoningProtocol === 'openai' || next.reasoningProtocol === 'thinking_object'
        ? (AI_REASONING_EFFORTS.includes(next.reasoningEffort as AIReasoningEffort) ? next.reasoningEffort : '')
        : '';
    next.thinkingBudget = next.reasoningProtocol === 'qwen'
        ? clampInt(next.thinkingBudget, 0, AI_THINKING_BUDGET_MAX, DEFAULT_AI_PROFILE.thinkingBudget)
        : 0;
    next.contextWindow = clampInt(next.contextWindow, 0, 2000000, DEFAULT_AI_PROFILE.contextWindow);
    next.maxRetries = clampInt(next.maxRetries, 0, 10, DEFAULT_AI_PROFILE.maxRetries);
    next.userAgent = next.userAgent?.trim() || '';
    next.httpProxy = next.httpProxy?.trim() || '';
    return next;
};

export const normalizeAISettings = (settings?: Partial<AISettings>): AISettings => {
    const source = settings || {};
    const profiles = Array.isArray(source.builtin?.profiles)
        ? source.builtin.profiles.map(profile => normalizeProfile(profile))
        : [];
    const activeProfileId = source.builtin?.activeProfileId || profiles[0]?.id || '';
    const activeProfile = profiles.find(profile => profile.id === activeProfileId) || profiles[0] || {
        ...DEFAULT_AI_SETTINGS.builtin,
        activeProfileId,
    };
    const disclaimerAccepted = source.disclaimerAccepted === true;
    return {
        enabled: disclaimerAccepted && source.enabled === true,
        disclaimerAccepted,
        provider: 'builtin',
        builtin: {
            ...activeProfile,
            activeProfileId: activeProfile.id || activeProfileId,
            profiles,
        },
        confirmMode: source.confirmMode === 'auto' || source.confirmMode === 'always' ? source.confirmMode : 'balanced',
        recentOutputLines: clampInt(source.recentOutputLines, 0, 500, DEFAULT_AI_SETTINGS.recentOutputLines),
        commandTimeoutSecs: clampInt(source.commandTimeoutSecs, 5, 300, DEFAULT_AI_SETTINGS.commandTimeoutSecs),
        includeCommandSnippets: source.includeCommandSnippets === true,
        customSystemPrompt: `${source.customSystemPrompt || ''}`.trim().slice(0, 8000),
    };
};

export const parseAISettingsProperty = (value: unknown): AISettings => {
    if (typeof value === 'string' && value.trim()) {
        try {
            return normalizeAISettings(JSON.parse(value));
        } catch {
            return normalizeAISettings();
        }
    }
    if (typeof value === 'object' && value !== null) {
        return normalizeAISettings(value as Partial<AISettings>);
    }
    return normalizeAISettings();
};

export const stringifyAISettingsProperty = (settings: AISettings): string => {
    const normalized = normalizeAISettings(settings);
    return JSON.stringify({
        ...normalized,
        builtin: {
            ...DEFAULT_AI_SETTINGS.builtin,
            activeProfileId: normalized.builtin.activeProfileId,
            profiles: [],
        },
    });
};

class AISettingsApi {
    profiles = async () => {
        return await requests.get('/admin/ai/profiles') as BuiltinAPIProfile[];
    };

    createProfile = async (profile: BuiltinAPIProfile) => {
        return await requests.post('/admin/ai/profiles', profile) as BuiltinAPIProfile;
    };

    updateProfile = async (id: string, profile: BuiltinAPIProfile) => {
        return await requests.put(`/admin/ai/profiles/${encodeURIComponent(id)}`, profile) as BuiltinAPIProfile;
    };

    deleteProfile = async (id: string) => {
        return await requests.delete(`/admin/ai/profiles/${encodeURIComponent(id)}`);
    };

    models = async (profile: BuiltinAPIProfile) => {
        return await requests.post('/admin/ai/models', {profile}) as string[];
    };
}

const aiSettingsApi = new AISettingsApi();
export default aiSettingsApi;
