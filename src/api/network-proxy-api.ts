import {Api} from "./core/api";
import requests, {baseUrl} from "@/api/core/requests";

export type ProxyProtocol = 'http' | 'socks5';

export interface NetworkProxy {
    id: string;
    name: string;
    protocol: ProxyProtocol;
    host: string;
    port: number;
    username: string;
    password: string;
    description: string;
    createdAt: number;
    updatedAt: number;
}

export interface NetworkProxyTestRequest extends NetworkProxy {
    targetHost: string;
    targetPort: number;
}

export interface NetworkProxyReferenceError {
    status: number;
    message: string;
    assetNames: string[];
    websiteNames: string[];
    databaseAssetNames: string[];
}

class NetworkProxyApi extends Api<NetworkProxy> {
    constructor() {
        super("admin/network-proxies");
    }

    test = async (data: NetworkProxyTestRequest) => {
        await requests.post<void>(`/${this.group}/test`, data);
    }

    deleteById = async (id: string) => {
        const response = await fetch(baseUrl() + `/${this.group}/${id}`, {method: 'DELETE'});
        if (response.ok) {
            return;
        }
        const data = response.headers.get('Content-Type')?.includes('application/json') ? await response.json() : {};
        return Promise.reject({
            status: response.status,
            message: data?.message,
            assetNames: data?.assetNames || [],
            websiteNames: data?.websiteNames || [],
            databaseAssetNames: data?.databaseAssetNames || [],
        } as NetworkProxyReferenceError);
    }
}

const networkProxyApi = new NetworkProxyApi();
export default networkProxyApi;
