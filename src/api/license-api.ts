import requests from "./core/requests";

export interface License {
    type: string;
    name?: string;
    userName?: string;
    machineId: string;
    bindingType?: 'machine' | 'domain';
    domain?: string;
    asset: number;
    user: number;
    expired: number;
}

// 定义 License 类
export class SimpleLicense {
    type: string | '' | 'free' | 'test' | 'premium' | 'enterprise';
    oem?: boolean;

    constructor(type: string, oem?: boolean) {
        this.type = type;
        this.oem = oem;
    }

    hasPremiumFeatures(): boolean {
        return this.type === 'test' || this.type === 'premium' || this.type === 'enterprise';
    }

    isOEM(): boolean {
        return this.oem === true;
    }
}

class LicenseApi {

    group = "/admin/license";

    getMachineId = async () => {
        return await requests.get(`${this.group}/machine-id`);
    }

    getLicense = async () => {
        return await requests.get(`${this.group}`) as License;
    }

    getSimpleLicense = async () => {
        let data = await requests.get(`/license?noerr`);
        return new SimpleLicense(data.type, data.oem);
    }

    setLicense = async (values: any) => {
        await requests.post(`${this.group}`, values);
    }

    requestLicense = async () => {
        await requests.post(`${this.group}/request`);
    }
}

let licenseApi = new LicenseApi();
export default licenseApi;
