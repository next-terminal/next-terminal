import qs from "qs";
import type {RegionInfo} from "@/api/region-info";
import requests from "./core/requests";

export interface DatabaseSQLLog {
    id: string;
    workOrderId?: string;
    requesterId?: string;
    requesterName?: string;
    approverId?: string;
    approverName?: string;
    databaseUsername?: string;
    assetId: string;
    assetName: string;
    database: string;
    dbType: string;
    userId: string;
    userName: string;
    clientIp: string;
    regionInfo?: RegionInfo;
    sql: string;
    operationKind?: string;
    sessionId?: string;
    executionId?: string;
    sqlState?: string;
    outcomeDetail?: string;
    durationMs: number;
    rowsAffected: number;
    status: string;
    errorMessage: string;
    blocked: boolean;
    source: string;
    createdAt: number;
}

class DatabaseSQLLogApi {
    group = "admin/database-sql-logs";

    paging = async (params: any) => {
        const paramsStr = qs.stringify(params);
        return await requests.get(`/${this.group}/paging?${paramsStr}`);
    }

    clear = async () => {
        await requests.post<void>(`/${this.group}/clear`);
    }
}

const databaseSQLLogApi = new DatabaseSQLLogApi();
export default databaseSQLLogApi;
