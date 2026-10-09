import {Api} from "./core/api";
import requests from "@/api/core/requests";
import qs from "qs";

export interface RotationPolicy {
    id: string;
    name: string;
    enabled: boolean;
    cron: string;
    scopeType: 'asset' | 'credential';
    scopeIds: string[];
    rotateType: 'password' | 'private-key' | '';
    pwdLength: number;
    pwdSymbol: boolean;
    keepOldKey: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface RotationLog {
    id: string;
    policyId: string;
    assetId: string;
    assetName: string;
    credentialId: string;
    rotateType: string;
    status: 'success' | 'failed';
    message: string;
    triggerType: 'manual' | 'scheduled';
    operator: string;
    createdAt: number;
}

export interface RotationResult {
    assetId: string;
    assetName: string;
    success: boolean;
    message: string;
}

class CredentialRotationApi extends Api<RotationPolicy> {
    constructor() {
        super("admin/credential-rotation-policies");
    }

    changeStatus = async (id: string, enabled: boolean) => {
        await requests.post<void>(`/${this.group}/${id}/change-status`, {enabled});
    }

    rotateAssets = async (assetIds: string[], rotateType?: string) => {
        return await requests.post('/admin/assets/rotate-credential', {
            assetIds,
            rotateType: rotateType || '',
        }) as RotationResult[];
    }

    rotateCredential = async (id: string) => {
        return await requests.post(`/admin/credentials/${id}/rotate`) as RotationResult[];
    }

    getLogPaging = async (params: {}) => {
        return await requests.get(`/admin/credential-rotation-logs/paging?${qs.stringify(params)}`) as any;
    }
}

let credentialRotationApi = new CredentialRotationApi();
export default credentialRotationApi;
