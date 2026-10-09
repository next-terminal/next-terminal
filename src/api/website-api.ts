import {Api} from "@/api/core/api";
import requests from "@/api/core/requests";
import type { TreeDataNode } from 'antd';
import type {
    ConnectionMode,
    WebsiteOriginHostMode,
    WebsiteResponseModifyRule
} from "@/pages/assets/website-drawer/types";
import type {GatewayHop} from "@/api/gateway-chain";

export interface WebsiteGroupNode extends TreeDataNode {
    gatewayChain?: GatewayHop[];
    children?: WebsiteGroupNode[];
}

export interface Website {
    id: string;
    logo: string;
    name: string;
    enabled: boolean;
    targetUrl: string;
    targetHost: string;
    targetPort: number;
    domain: string;
    asciiDomain: string;
    entrance: string;
    description: string;
    tags?: string[];
    connectionMode: ConnectionMode;
    gatewayChain: GatewayHop[];
    proxyId?: string;
    originHostMode?: WebsiteOriginHostMode;
    originHostCustom?: string;
    originTimeout?: number;
    insecureSkipVerify?: boolean;
    basicAuth: BasicAuth;
    headers?: any;
    cert: Cert;
    public: Public;
    tempAllow?: TempAllow;
    modifyRules?: WebsiteResponseModifyRule[];
    createdAt: number;
    groupId?: string;
    sort: string;  // LexoRank 排序字段
    groupFullName: string;

    scheme: string;
    host: string;
    port: number;
}

interface Public {
    enabled: boolean;
    ip: string;
	 ipSetIds?: string[];
    expiredAt: number;
    password: string;
    timeLimit?: boolean;
    countries?: string[];
    provinces?: string[];
    cities?: string[];
    headerWhitelist?: string[];
    pathWhitelist?: string[];
}

interface TempAllow {
    enabled: boolean;
    durationMinutes?: number;
    autoRenew?: boolean;
}

interface Cert {
    enabled: boolean;
    cert: string;
    key: string;
}

interface BasicAuth {
    enabled: boolean;
    username: string;
    password: string;
}

export interface SortPositionRequest {
    id: string;        // 被拖拽的项 ID
    beforeId: string;  // 目标位置的前一项 ID (空字符串表示移到最前)
    afterId: string;   // 目标位置的后一项 ID (空字符串表示移到最后)
}

export interface WebsiteBasicUpdateRequest {
    logo?: string;
    name: string;
    tags?: string[];
    domain: string;
    entrance?: string;
    targetUrl: string;
    groupId?: string;
    gatewayChain?: GatewayHop[];
    connectionMode: ConnectionMode;
    proxyId?: string;
    originHostMode?: WebsiteOriginHostMode;
    originHostCustom?: string;
    originTimeout?: number;
    insecureSkipVerify?: boolean;
    headers?: Array<{ name: string; value: string }>;
}

export interface BatchUpdateWebsiteRequest {
    websiteIds: string[];
    changes: {
        basic?: {
            enabled?: boolean;
            originHostMode?: WebsiteOriginHostMode;
            originHostCustom?: string;
            originTimeout?: number;
            insecureSkipVerify?: boolean;
        };
        connection?: {
            connectionMode: ConnectionMode;
            gatewayChain: GatewayHop[];
            proxyId?: string;
        };
    };
}

export interface BatchUpdateWebsiteResult {
    selectedCount: number;
    updatedCount: number;
}

class WebsiteApi extends Api<Website> {
    constructor() {
        super("admin/websites");
    }

    getGroups = async () => {
        return await requests.get(`/${this.group}/groups`) as WebsiteGroupNode[]
    }

    setGroups = async (data: any) => {
        return await requests.put<void>(`/${this.group}/groups`, data);
    }

    deleteGroup = async (groupId: string) => {
        return await requests.delete<void>(`/${this.group}/groups/${groupId}`);
    }

    changeGroup = async (data: any) => {
        return await requests.post<void>(`/${this.group}/change-group`, data);
    }

    batchUpdate = async (data: BatchUpdateWebsiteRequest) => {
        return await requests.post(`/${this.group}/batch-update`, data) as BatchUpdateWebsiteResult;
    }

    updateSortPosition = async (req: SortPositionRequest) => {
        return await requests.post<void>(`/${this.group}/sort`, req);
    }

    getTags = async () => {
        return await requests.get(`/${this.group}/tags`) as string[];
    }

    getFavicon = async (url: string): Promise<string> => {
        return await requests.get(`/${this.group}/favicon?url=${encodeURIComponent(url)}`);
    }

    updateEnabled = async (id: string, enabled: boolean) => {
        return await requests.patch<void>(`/${this.group}/${id}/enabled`, {enabled});
    }

    updateBasic = async (id: string, data: WebsiteBasicUpdateRequest) => {
        return await requests.patch<void>(`/${this.group}/${id}/basic`, data);
    }
}

const websiteApi = new WebsiteApi();
export default websiteApi;
