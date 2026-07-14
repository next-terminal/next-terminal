import type {Dayjs} from "dayjs";
import type {GatewayHop} from "@/api/gateway-chain";

export type WebsiteOriginHostMode = 'origin' | 'service' | 'custom';

export interface ParsedURL {
    scheme: string;
    host: string;
    port: string;
}

export interface WebsiteFormData {
    id?: string;
    name: string;
    domain: string;
    entrance?: string;
    enabled: boolean;
    scheme: string;
    host: string;
    port: number;
    targetUrl: string;
    logo?: string;
    groupId?: string;
    gatewayChain?: GatewayHop[];
    originHostMode?: WebsiteOriginHostMode;
    originHostCustom?: string;
    originTimeout?: number;
    disableAccessLog?: boolean;
    headers?: Array<{ name: string; value: string }>;
    basicAuth?: {
        enabled: boolean;
        username?: string;
        password?: string;
    };
    cert?: {
        enabled: boolean;
        certId?: string;
    };
    public?: {
        enabled: boolean;
        expiredAt?: number | Dayjs;
        ip?: string;
        password?: string;
        timeLimit?: boolean;
        countries?: string[];
        provinces?: string[];
        cities?: string[];
        headerWhitelist?: string[];
        pathWhitelist?: string[];
    };
    tempAllow?: {
        enabled: boolean;
        durationMinutes?: number;
        autoRenew?: boolean;
    };
    modifyRules?: any[];
}

export interface LogoItem {
    name: string;
    data: string;
}
