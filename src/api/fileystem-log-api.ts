import {Api} from "@/api/core/api";
import type {RegionInfo} from "@/api/region-info";
import requests from "@/api/core/requests";

export interface FileSystemLog {
    id: string;
    assetId: string;
    sessionId: string;
    userId: string;
    clientIp: string;
    regionInfo?: RegionInfo;
    action: string;
    fileName: string;
    createdAt: number;
    assetName: string;
    userName: string;
}

class FileSystemLogApi extends Api<FileSystemLog> {
    constructor() {
        super("admin/filesystem-logs");
    }

    clear = async () => {
        await requests.post(`/${this.group}/clear`);
    }
}

const fileSystemLogApi = new FileSystemLogApi();
export default fileSystemLogApi;
