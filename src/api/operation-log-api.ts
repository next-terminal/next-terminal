import {Api} from "./core/api";
import requests from "@/api/core/requests";
import type {RegionInfo} from "@/api/region-info";
import {UserAgent} from "@/api/user-api";

export interface OperationLogOption {
    label: string;
    value: string;
}

export interface OperationLogOptions {
    modules: OperationLogOption[];
    resources: OperationLogOption[];
    actions: OperationLogOption[];
}

export interface OperationLog {
    id: string;
    accountId: string;
    accountName: string;
    module: string;
    resource: string;
    action: string;
    clientIp: string;
    regionInfo?: RegionInfo;
    userAgent: UserAgent;
    requestMethod: string;
    requestPath: string;
    requestId: string;
    status: string;
    errorMessage: string;
    remark: string;
    metadata: Record<string, unknown>;
    createdAt: number;
}


class OperationLogApi extends Api<OperationLog> {
    constructor() {
        super("admin/operation-logs");
    }

    clear = async () => {
        await requests.post(`/${this.group}/clear`);
    }

    options = async () => {
        let result = await requests.get(`/${this.group}/options`);
        return result as OperationLogOptions;
    }
}

let operationLogApi = new OperationLogApi();
export default operationLogApi;
