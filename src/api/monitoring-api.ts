import requests from "@/api/core/requests";

export interface ServiceMonitor {
    status: string;
    name: string;
    version: string;
    goVersion: string;
    os: string;
    arch: string;
    cpuCount: number;
    goroutines: number;
    uptimeSeconds: number;
    allocBytes: number;
    sysBytes: number;
    heapInUse: number;
    numGc: number;
}

export interface CPUMonitor {
    percent: number;
    modelName: string;
    logicalCores: number;
    physicalCores: number;
    load1: number;
    load5: number;
    load15: number;
}

export interface MemoryMonitor {
    totalBytes: number;
    usedBytes: number;
    availableBytes: number;
    percent: number;
    swapTotalBytes: number;
    swapUsedBytes: number;
    swapFreeBytes: number;
    swapUsedPercent: number;
}

export interface StorageVolume {
    key: string;
    name: string;
    path: string;
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    percent: number;
    status: string;
    message: string;
}

export interface HostMonitor {
    cpu: CPUMonitor;
    memory: MemoryMonitor;
    storage: StorageVolume[];
}

export interface ResourceMonitor {
    userTotal: number;
    userOnline: number;
    assetTotal: number;
    assetActive: number;
    websiteTotal: number;
    websiteActive: number;
    gatewayTotal: number;
    gatewayActive: number;
    loginFailed: number;
}

export interface SessionMonitor {
    online: number;
    offline: number;
    total: number;
    recording: number;
    disconnected: number;
}

export interface StorageMonitor {
    recordingType: string;
    recordingPath: string;
    drivePath: string;
    s3Enabled: boolean;
    storageTotal: number;
    limitBytes: number;
    usedBytes: number;
}

export interface DatabaseMonitor {
    dialect: string;
    openConnections: number;
    inUse: number;
    idle: number;
    waitCount: number;
    waitDurationMs: number;
    maxIdleClosed: number;
    maxLifetimeClosed: number;
}

export interface HealthCheckItem {
    key: string;
    status: string;
    message: string;
}

export interface MonitoringAlert {
    key: string;
    level: string;
    count: number;
    message: string;
}

export interface MonitorAlertState {
    key: string;
    metric: string;
    target: string;
    level: string;
    status: string;
    currentValue: number;
    warningThreshold: number;
    criticalThreshold: number;
    recoverThreshold: number;
    firstTriggeredAt: number;
    lastTriggeredAt: number;
    acknowledgedAt: number;
    acknowledgedBy: string;
    resolvedAt: number;
    metadata: Record<string, any>;
    createdAt: number;
    updatedAt: number;
}

export interface GlobalMonitorStatus {
    level: string;
    items: MonitorAlertState[];
    generatedAt: number;
}

export interface ProtocolCounter {
    protocol: string;
    count: number;
}

export interface MonitoringOverview {
    generatedAt: number;
    service: ServiceMonitor;
    host: HostMonitor;
    resources: ResourceMonitor;
    sessions: SessionMonitor;
    storage: StorageMonitor;
    database: DatabaseMonitor;
    health: HealthCheckItem[];
    alerts: MonitoringAlert[];
    alertStates: MonitorAlertState[];
    protocols: ProtocolCounter[];
}

class MonitoringApi {
    getOverview = async () => {
        return await requests.get('/admin/monitoring/overview') as MonitoringOverview;
    }

    getGlobalStatus = async () => {
        return await requests.get('/admin/monitoring/global-status') as GlobalMonitorStatus;
    }

    acknowledgeAlert = async (key: string) => {
        await requests.post('/admin/monitoring/alerts/acknowledge', {key});
    }
}

let monitoringApi = new MonitoringApi();
export default monitoringApi;
