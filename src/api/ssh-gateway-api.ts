import {Api} from "./core/api";
import requests, {baseUrl} from "@/api/core/requests";

export interface SSHGateway {
    id: string;
    type: string;
    name: string;
    configMode: string; // 配置模式：direct/credential/asset
    ip: string;
    port: number;
    accountType: string;
    username: string;
    password: string;
    privateKey: string;
    passphrase: string;
    credentialId: string; // 引用的凭据ID
    assetId: string; // 引用的资产ID
    createdAt: number;
    status: string;
    statusMessage: string;
}

export interface AssetForGatewayOption {
    id: string;
    name: string;
    ip: string;
    port: number;
    canBeGateway: boolean;
    disableReason?: string;
}

export interface GatewayReferenceError {
    status: number;
    message: string;
    assetNames: string[];
    websiteNames: string[];
    databaseAssetNames: string[];
    assetGroupNames: string[];
    websiteGroupNames: string[];
    gatewayGroupNames: string[];
}

class SshGatewayApi extends Api<SSHGateway> {
    constructor() {
        super("admin/ssh-gateways");
    }

    decrypt = async (id: string, securityToken: string) => {
        return await requests.get(`/${this.group}/${id}/decrypted?securityToken=${securityToken}`) as SSHGateway;
    }

    deleteById = async (id: string) => {
        const response = await fetch(baseUrl() + `/${this.group}/${id}`, {
            method: "DELETE",
        });
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
            assetGroupNames: data?.assetGroupNames || [],
            websiteGroupNames: data?.websiteGroupNames || [],
            gatewayGroupNames: data?.gatewayGroupNames || [],
        } as GatewayReferenceError);
    }

    // 获取可作为网关的 SSH 资产列表
    getAvailableAssets = async () => {
        return await requests.get(`/admin/assets/ssh/available-for-gateway`) as AssetForGatewayOption[];
    }
}

let sshGatewayApi = new SshGatewayApi();
export default sshGatewayApi;
