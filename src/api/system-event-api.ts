import {Api} from "./core/api";

export interface SystemEvent {
    id: string;
    type: string;
    category: string;
    severity: string;
    title: string;
    summary: string;
    titleKey: string;
    summaryKey: string;
    actor: string;
    actorType: 'user' | 'system' | '';
    target: string;
    ip: string;
    source: string;
    args: Record<string, any>;
    metadata: Record<string, any>;
    createdAt: number;
}

class SystemEventApi extends Api<SystemEvent> {
    constructor() {
        super("admin/system-events");
    }
}

const systemEventApi = new SystemEventApi();
export default systemEventApi;
