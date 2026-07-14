export interface RegionInfo {
    names?: Record<string, string>;
}

export interface WithRegionInfo {
    clientIp?: string;
    regionInfo?: RegionInfo;
}

