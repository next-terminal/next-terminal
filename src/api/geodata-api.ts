import requests from "@/api/core/requests";

export interface GeoDataConfig {
    autoUpdateEnabled: boolean;
    autoUpdateTime: string;
}

export interface GeoDatabaseStatus {
    available: boolean;
    databaseType: string;
    buildTime: string;
    fileSize: number;
    sha256: string;
    modifiedAt: string;
}

export interface GeoDataDetail {
    config: GeoDataConfig;
    database: GeoDatabaseStatus;
}

export interface GeoUpdateCheck {
    updateAvailable: boolean;
    remoteSha256: string;
}

export interface GeoUpdateTask {
    id: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    message: string;
    startedAt: string;
    finishedAt: string;
}

const geodataApi = {
    get: async () => requests.get('/admin/geodata') as Promise<GeoDataDetail>,
    setConfig: async (config: GeoDataConfig) => requests.put('/admin/geodata/config', config),
    upload: async (file: File) => {
        const form = new FormData();
        form.append('file', file);
        return requests.postForm('/admin/geodata/upload', form);
    },
    check: async () => requests.post('/admin/geodata/check') as Promise<GeoUpdateCheck>,
    update: async () => requests.post('/admin/geodata/update') as Promise<{taskId: string}>,
    task: async (taskId: string) => requests.get(`/admin/geodata/tasks/${taskId}`) as Promise<GeoUpdateTask>,
};

export default geodataApi;
