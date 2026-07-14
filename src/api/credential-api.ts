import {Api} from "./core/api";
import requests, {baseUrl} from "@/api/core/requests";

export interface Credential {
    id: string;
    name: string;
    type: string;
    username: string;
    password: string;
    privateKey: string;
    passphrase: string;
    createdAt: number;
    assetCount: number;
}

export interface CredentialReferenceError {
    status: number;
    message: string;
    assetNames: string[];
    gatewayNames: string[];
}

class CredentialApi extends Api<Credential> {
    constructor() {
        super("admin/credentials");
    }

    genPrivateKey = async () => {
        return await requests.post(`/${this.group}/gen-private-key`) as string;
    }

    getPublicKey = async (id: string) => {
        return await requests.get(`/${this.group}/${id}/public-key`) as string;
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
            gatewayNames: data?.gatewayNames || [],
        } as CredentialReferenceError);
    }

    decrypt = async (id: string, securityToken: string) => {
        return await requests.get(`/${this.group}/${id}/decrypted?securityToken=${securityToken}`) as Credential;
    }
}

let credentialApi = new CredentialApi();
export default credentialApi;
