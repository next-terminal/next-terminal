export const channelTypes = ['mail', 'wecom', 'wecomApp', 'feishu', 'dingtalk', 'webhook'];

export const channelDocumentLinks: Record<string, string> = {
    dingtalk: 'https://open.dingtalk.com/document/robots/custom-robot-access',
    wecom: 'https://developer.work.weixin.qq.com/document/path/91770',
    wecomApp: 'https://developer.work.weixin.qq.com/document/path/90236',
    feishu: 'https://www.feishu.cn/hc/zh-CN/articles/360024984973-%E5%9C%A8%E7%BE%A4%E7%BB%84%E4%B8%AD%E4%BD%BF%E7%94%A8%E6%9C%BA%E5%99%A8%E4%BA%BA',
};

export const robotWebhookPlaceholders: Record<string, string> = {
    dingtalk: 'https://oapi.dingtalk.com/robot/send?access_token=...',
    wecom: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...',
    feishu: 'https://open.feishu.cn/open-apis/bot/v2/hook/...',
    webhook: 'https://example.com/webhook',
};

export const severities = ['info', 'warning', 'critical'];

export const notificationLanguages = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'];

export const eventGroups = [
    {
        key: 'identity',
        events: [
            'identity.user.created',
            'identity.admin.created',
            'identity.user.disabled',
            'identity.user.deleted',
            'auth.login.failed',
            'auth.admin.login.success',
        ],
    },
    {
        key: 'access',
        events: [
            'access.session.started',
            'access.session.ended',
            'access.command.risk_detected',
            'access.command.blocked',
            'access.recording.failed',
        ],
    },
    {
        key: 'database',
        events: [
            'database.sql.blocked',
            'database.sql.failed',
        ],
    },
    {
        key: 'backup',
        events: [
            'backup.succeeded',
            'backup.failed',
        ],
    },
    {
        key: 'agent',
        events: [
            'agent.online',
            'agent.offline',
        ],
    },
    {
        key: 'system',
        events: [
            'system.cpu.warning',
            'system.cpu.critical',
            'system.cpu.recovered',
            'system.memory.warning',
            'system.memory.critical',
            'system.memory.recovered',
            'system.storage.warning',
            'system.storage.critical',
            'system.storage.recovered',
        ],
    },
];

export const channelTypeLabel = (type: string, t: any) => t(`settings.notification.channel_types.${type}`, type);
export const severityLabel = (severity: string, t: any) => t(`settings.notification.severities.${severity}`, severity);
export const eventTypeLabel = (eventType: string, t: any) => t(`settings.notification.event_types.${eventType}`, eventType);
export const eventGroupLabel = (group: string, t: any) => t(`settings.notification.event_groups.${group}`, group);
