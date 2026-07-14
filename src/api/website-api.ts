import {Api} from "@/api/core/api";
import requests from "@/api/core/requests";
import type { TreeDataNode } from 'antd';
import type {WebsiteFormData, WebsiteOriginHostMode} from "@/pages/assets/website-drawer/types";
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
    gatewayChain: GatewayHop[];
    originHostMode?: WebsiteOriginHostMode;
    originHostCustom?: string;
    originTimeout?: number;
    basicAuth: BasicAuth;
    headers?: any;
    cert: Cert;
    public: Public;
    tempAllow?: TempAllow;
    modifyRules?: any[];
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
    domain: string;
    entrance?: string;
    targetUrl: string;
    groupId?: string;
    gatewayChain?: GatewayHop[];
    originHostMode?: WebsiteOriginHostMode;
    originHostCustom?: string;
    originTimeout?: number;
    headers?: Array<{ name: string; value: string }>;
}

export interface WebsiteGeoOptions {
    countries: WebsiteGeoOption[];
    provinces: WebsiteGeoOption[];
    cities: WebsiteGeoOption[];
}

export interface WebsiteGeoOption {
    label: string;
    value: string;
}

class WebsiteApi extends Api<Website> {
    constructor() {
        super("admin/websites");
    }

    getGroups = async () => {
        return await requests.get(`/${this.group}/groups`) as WebsiteGroupNode[]
    }

    setGroups = async (data: any) => {
        return await requests.put(`/${this.group}/groups`, data);
    }

    deleteGroup = async (groupId: string) => {
        return await requests.delete(`/${this.group}/groups/${groupId}`);
    }

    changeGroup = async (data: any) => {
        return await requests.post(`/${this.group}/change-group`, data);
    }

    // 统一的修改网关接口，支持 ssh/agent/group 三种类型
    changeGateway = async (data: { websiteIds: string[], gatewayChain: GatewayHop[] }) => {
        return await requests.post(`/${this.group}/change-gateway`, data);
    }

    updateSortPosition = async (req: SortPositionRequest) => {
        return await requests.post(`/${this.group}/sort`, req);
    }

    getFavicon = async (url: string): Promise<string> => {
        return await requests.get(`/${this.group}/favicon?url=${encodeURIComponent(url)}`);
    }

    getGeoOptions = async (language: string, countries: string[], provinces: string[]): Promise<WebsiteGeoOptions> => {
        const params = new URLSearchParams({language, noerr: '1'});
        countries.forEach(country => params.append('country', country));
        provinces.forEach(province => params.append('province', province));
        return await requests.get(`/${this.group}/geo-options?${params.toString()}`) as WebsiteGeoOptions;
    }

    updateEnabled = async (id: string, enabled: boolean) => {
        return await requests.patch(`/${this.group}/${id}/enabled`, {enabled});
    }

    updateBasic = async (id: string, data: WebsiteBasicUpdateRequest) => {
        return await requests.patch(`/${this.group}/${id}/basic`, data);
    }

    updatePublic = async (id: string, data: { public?: WebsiteFormData['public'] }) => {
        return await requests.patch(`/${this.group}/${id}/public`, data);
    }

    updateTempAllow = async (id: string, data: { tempAllow?: WebsiteFormData['tempAllow'] }) => {
        return await requests.patch(`/${this.group}/${id}/temp-allow`, data);
    }

    updateHeaders = async (id: string, data: { headers?: Website['headers'] }) => {
        return await requests.patch(`/${this.group}/${id}/headers`, data);
    }

    updateCert = async (id: string, data: { cert?: WebsiteFormData['cert'] }) => {
        return await requests.patch(`/${this.group}/${id}/cert`, data);
    }

    updateModifyResponse = async (id: string, data: { modifyRules?: any[] }) => {
        return await requests.patch(`/${this.group}/${id}/modify-response`, data);
    }
}

const websiteApi = new WebsiteApi();
export default websiteApi;
