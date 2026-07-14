import requests, {baseUrl} from "@/api/core/requests";

export interface BackupConfig {
    scheduleEnabled: boolean;
    scheduleTime: string;
    retentionDays: number;
    directory: string;
    successActions: BackupSuccessActions;
}

export interface BackupConfigUpdate {
    scheduleEnabled: boolean;
    scheduleTime: string;
    retentionDays: number;
    successActions: BackupSuccessActions;
}

export interface BackupSuccessActions {
    s3: BackupS3Action;
    sftp: BackupSFTPAction;
    webdav: BackupWebDAVAction;
}

export interface BackupS3Action {
    enabled: boolean;
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region: string;
    useSsl: boolean;
    pathStyle: boolean;
    prefix: string;
}

export interface BackupSFTPAction {
    enabled: boolean;
    mode: 'asset' | 'custom';
    assetId: string;
    directory: string;
    host: string;
    port: number;
    username: string;
    authType: 'password' | 'privateKey';
    password: string;
    privateKey: string;
    passphrase: string;
}

export interface BackupWebDAVAction {
    enabled: boolean;
    endpoint: string;
    username: string;
    password: string;
    directory: string;
}

export interface BackupFile {
    name: string;
    size: number;
    createdAt: string;
    source: string;
    appVersion: string;
    dbType: string;
    includes: string[];
    excludes: string[];
}

export interface BackupTask {
    id: string;
    type: string;
    source: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    fileName: string;
    message: string;
    startedAt: number;
    finishedAt: number;
}

class BackupApi {
    group = "admin/backup";

    getConfig = async () => {
        return await requests.get(`/${this.group}/config`) as BackupConfig;
    }

    setConfig = async (values: BackupConfigUpdate) => {
        await requests.put(`/${this.group}/config`, values);
    }

    testS3Action = async (values: BackupS3Action) => {
        await requests.post(`/${this.group}/actions/s3/test`, values);
    }

    testSFTPAction = async (values: BackupSFTPAction) => {
        await requests.post(`/${this.group}/actions/sftp/test`, values);
    }

    testWebDAVAction = async (values: BackupWebDAVAction) => {
        await requests.post(`/${this.group}/actions/webdav/test`, values);
    }

    files = async () => {
        return await requests.get(`/${this.group}/files`) as BackupFile[];
    }

    create = async () => {
        return await requests.post(`/${this.group}/files`) as { taskId: string };
    }

    restore = async (name: string) => {
        return await requests.post(`/${this.group}/files/${encodeURIComponent(name)}/restore`) as { taskId: string };
    }

    uploadRestore = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return await requests.postForm(`/${this.group}/files/upload-restore`, formData) as { taskId: string };
    }

    delete = async (name: string) => {
        await requests.delete(`/${this.group}/files/${encodeURIComponent(name)}`);
    }

    task = async (id: string) => {
        return await requests.get(`/${this.group}/tasks/${encodeURIComponent(id)}`) as BackupTask;
    }

    downloadUrl = (name: string) => {
        return `${baseUrl()}/${this.group}/files/${encodeURIComponent(name)}/download`;
    }
}

let backupApi = new BackupApi();
export default backupApi;
