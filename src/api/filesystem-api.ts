import requests from "@/api/core/requests";

export interface FileInfo {
    name: string
    size: number
    modTime: number;
    path: string
    mode: string
    isDir: boolean
    isLink: boolean
}

export type UploadTaskStatus = 'created' | 'receiving' | 'transmitting' | 'success' | 'error' | 'cancelled';

export interface UploadTask {
    id: string
    filesystemId: string
    directory: string
    filename: string
    targetPath: string
    status: UploadTaskStatus
    total: number
    written: number
    percent: number
    speed: number
    elapsedTime: number
    error: string
    createdAt: number
    updatedAt: number
    finishedAt?: number
}

export interface UploadTaskCreate {
    id: string
    directory: string
    filename: string
    size: number
}

class FileSystemApi {
    group = "access/filesystem";

    ls = async (sessionId: string, dir: string, hiddenFileVisible: boolean) => {
        return await requests.get(`/${this.group}/${sessionId}/ls?dir=${dir}&hiddenFileVisible=${hiddenFileVisible}`) as FileInfo[];
    }

    rm = async (sessionId: string, filename: string) => {
        await requests.post<void>(`/${this.group}/${sessionId}/rm?filename=${filename}`);
    }

    mkdir = async (sessionId: string, dir: string) => {
        await requests.post<void>(`/${this.group}/${sessionId}/mkdir?dir=${dir}`);
    }

    touch = async (sessionId: string, filename: string) => {
        await requests.post<void>(`/${this.group}/${sessionId}/touch?filename=${filename}`);
    }

    rename = async (sessionId: string, oldName: string, newName: string) => {
        await requests.post<void>(`/${this.group}/${sessionId}/rename?oldName=${oldName}&newName=${newName}`);
    }

    edit = async (sessionId: string, filename: string, fileContent: string) => {
        await requests.post<void>(`/${this.group}/${sessionId}/edit`, {
            filename,
            fileContent
        });
    }

    createUploadTask = async (filesystemId: string, input: UploadTaskCreate) => {
        return await requests.post(`/${this.group}/${filesystemId}/upload/tasks`, input) as UploadTask;
    }

    getUploadTask = async (filesystemId: string, taskId: string) => {
        return await requests.get(`/${this.group}/${filesystemId}/upload/tasks/${taskId}`, {
            errorMode: 'silent',
        }) as UploadTask;
    }

    deleteUploadTask = async (filesystemId: string, taskId: string) => {
        await requests.delete<void>(`/${this.group}/${filesystemId}/upload/tasks/${taskId}`, {errorMode: 'silent'});
    }

    cancelUploadTask = async (filesystemId: string, taskId: string) => {
        await requests.post<void>(`/${this.group}/${filesystemId}/upload/tasks/${taskId}/cancel`, undefined, {
            errorMode: 'silent',
        });
    }

    chmod = async (sessionId: string, filename: string, mode: number) => {
        await requests.post<void>(`/${this.group}/${sessionId}/chmod?filename=${filename}&mode=${mode}`);
    }
}

const fileSystemApi = new FileSystemApi();
export default fileSystemApi;
