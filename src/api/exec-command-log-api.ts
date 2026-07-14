import qs from "qs";
import type {RegionInfo} from "@/api/region-info";
import requests from "@/api/core/requests";

export interface ExecCommandLog {
    id: string;
    userId: string;
    userAccount: string;
    assetId: string;
    assetName: string;
    clientIp: string;
    regionInfo?: RegionInfo;
    protocol: string;
    ip: string;
    port: number;
    username: string;
    command: string;
    result: string;
    exitCode: number;
    riskLevel: number;
    status: 'success' | 'failed' | 'forbidden';
    startedAt: number;
    finishedAt: number;
    durationMs: number;
    createdAt: number;
}

class ExecCommandLogApi {
    group = "admin/exec-command-logs";

    paging = async (params: any) => {
        const paramsStr = qs.stringify(params);
        return await requests.get(`/${this.group}/paging?${paramsStr}`);
    }

    clear = async () => {
        await requests.post(`/${this.group}/clear`);
    }
}

const execCommandLogApi = new ExecCommandLogApi();
export default execCommandLogApi;
