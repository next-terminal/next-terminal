import {Api} from "./core/api";
import requests from "./core/requests";

export interface NotificationChannel {
    type: string;
    enabled: boolean;
    config: Record<string, any>;
    secretConfig: Record<string, any>;
    createdAt: number;
    updatedAt: number;
}

export interface NotificationRule {
    id: string;
    name: string;
    enabled: boolean;
    eventTypes: string[];
    severities: string[];
    channelIds: string[];
    conditions: Record<string, any>;
    quietMinutes: number;
    createdAt: number;
    updatedAt: number;
}

export interface NotificationDelivery {
    id: string;
    eventId: string;
    eventType: string;
    severity: string;
    channelId: string;
    request: Record<string, any>;
    result: string;
    error: string;
    retryCount: number;
    createdAt: number;
    sentAt: number;
}

class NotificationChannelApi extends Api<NotificationChannel> {
    constructor() {
        super("admin/notifications/channels");
    }

    test = async (id: string) => {
        return await requests.post(`/${this.group}/${id}/test`) as string;
    }
}

class NotificationRuleApi extends Api<NotificationRule> {
    constructor() {
        super("admin/notifications/rules");
    }
}

class NotificationDeliveryApi extends Api<NotificationDelivery> {
    constructor() {
        super("admin/notifications/deliveries");
    }

    clear = async () => {
        await requests.post(`/${this.group}/clear`);
    }
}

export const notificationChannelApi = new NotificationChannelApi();
export const notificationRuleApi = new NotificationRuleApi();
export const notificationDeliveryApi = new NotificationDeliveryApi();
