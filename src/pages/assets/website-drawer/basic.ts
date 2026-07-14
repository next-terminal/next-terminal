import {WebsiteFormData, WebsiteOriginHostMode} from "@/pages/assets/website-drawer/types";

export const DEFAULT_ORIGIN_TIMEOUT = 30;

export interface WebsiteBasicFormData extends WebsiteFormData {
    originHostMode?: WebsiteOriginHostMode;
    originHostCustom?: string;
}

export const getDefaultWebsiteData = (): Partial<WebsiteBasicFormData> => ({
    enabled: true,
    scheme: 'http',
    port: 80,
    gatewayChain: [],
    cert: {
        enabled: false
    },
    public: {
        enabled: false,
        expiredAt: undefined,
        countries: [],
        provinces: [],
        cities: [],
        headerWhitelist: [],
        pathWhitelist: []
    },
    tempAllow: {
        enabled: false,
        durationMinutes: 5,
        autoRenew: false
    },
    originHostMode: 'origin',
    originHostCustom: '',
    originTimeout: DEFAULT_ORIGIN_TIMEOUT
});

export const normalizeOriginHostMode = (originHostMode?: string): WebsiteOriginHostMode => {
    if (originHostMode === 'service' || originHostMode === 'custom') {
        return originHostMode;
    }
    return 'origin';
};

export const normalizeOriginTimeout = (originTimeout?: number): number => {
    if (originTimeout && originTimeout > 0) {
        return originTimeout;
    }
    return DEFAULT_ORIGIN_TIMEOUT;
};

export const getWebsiteHeaders = (
    websiteData: Partial<WebsiteFormData> | undefined,
    values: WebsiteBasicFormData
) => {
    const sourceHeaders = websiteData?.headers || values.headers || [];
    return sourceHeaders.filter(item => item.name?.toLowerCase() !== 'host');
};
