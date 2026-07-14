import {Api} from "@/api/core/api";
import requests from "@/api/core/requests";
import type {RegionInfo} from "@/api/region-info";

export interface Session {
    id: string;
    clientIp: string;
    regionInfo?: RegionInfo;
    protocol: string;
    accessMode: SessionAccessMode;
    ip: string;
    port: number;
    username: string;
    assetId: string;
    assetName: string;
    userId: string;
    userAccount: string;
    status: string;
    connectedAt: number;
    disconnectedAt: number;
    connectionDuration: string;
    recording: string;
    recordingType?: '' | 'not' | 'local' | 's3' | 'webdav';
    recordingPath?: string;
    recordingSize: number;
    videoType?: '' | 'not' | 'local' | 's3' | 'webdav';
    videoPath?: string;
    videoSize?: number;
    recordingConvertStatus?: '' | 'pending' | 'processing' | 'completed' | 'failed';
    recordingConvertProgress?: number;
    message?: string;
    commandCount: number;
}

export type SessionAccessMode = '' | 'terminal' | 'guacd' | 'rdp_proxy';

export const getSessionAccessMode = (session: Pick<Session, 'accessMode' | 'protocol'>): SessionAccessMode => {
    if (session.accessMode) {
        return session.accessMode;
    }
    if (session.protocol === 'ssh' || session.protocol === 'telnet') {
        return 'terminal';
    }
    if (session.protocol === 'rdp' || session.protocol === 'vnc') {
        return 'guacd';
    }
    return '';
}

export interface SessionWatermark {
    enabled: boolean
    content?: string[];
    color?: string;
    size: number;
}

export interface SessionCommand {
    id: string;
    sessionId: string;
    riskLevel: number;
    command: string;
    result: string;
    createdAt: number;
}

export interface SessionSharer {
    ok: boolean
    url: string
}

class SessionApi extends Api<Session> {
    constructor() {
        super("admin/sessions");
    }

    disconnect = async (sessionId: string) => {
        await requests.post(`/${this.group}/${sessionId}/disconnect`);
    }

    clear = async () => {
        await requests.post(`/${this.group}/clear`);
    }

    triggerRecordingConvert = async (sessionId: string) => {
        await requests.post(`/${this.group}/${sessionId}/recording-convert`);
    }
}

const sessionApi = new SessionApi();
export default sessionApi;
