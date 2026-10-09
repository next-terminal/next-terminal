import {Api} from "./core/api";
import requests from "./core/requests";

export type AccessPolicyAction = 'allow' | 'reject';
export type AccessPolicyMode = 'whitelist' | 'blacklist';

export interface AccessPolicyGroup {
    id: string;
    name: string;
    description: string;
    mode: AccessPolicyMode;
    enabled: boolean;
    createdAt: number;
}

export interface AccessPolicyRule {
    id: string;
    groupId: string;
    name: string;
    ipGroup: string;
    ipSetIds?: string[];
    priority: number;
    enabled: boolean;
    action: AccessPolicyAction;
    expirationAt?: number;
    timePeriod: TimePeriod[];
    countries: string[];
    provinces: string[];
    cities: string[];
    createdAt: number;
}

export interface AccessPolicySource {
    type: 'user' | 'department';
    id?: string;
    name?: string;
}

export interface EffectiveAccessPolicyGroup extends AccessPolicyGroup {
    sources: AccessPolicySource[];
}

export interface AccessPolicyGroupBindings {
    userIds: string[];
    departmentIds: string[];
}

interface TimePeriod {
    key: number;
    value: string;
}

class AccessPolicyApi extends Api<AccessPolicyGroup> {
    constructor() {
        super("admin/access-policy-groups");
    }

    getRules = async (groupId: string) => {
        return await requests.get(`/${this.group}/${groupId}/rules`) as AccessPolicyRule[];
    }

    getRuleById = async (groupId: string, ruleId: string) => {
        return await requests.get(`/${this.group}/${groupId}/rules/${ruleId}`) as AccessPolicyRule;
    }

    createRule = async (groupId: string, data: AccessPolicyRule) => {
        return await requests.post(`/${this.group}/${groupId}/rules`, data) as AccessPolicyRule;
    }

    updateRuleById = async (groupId: string, ruleId: string, data: AccessPolicyRule) => {
        return await requests.put(`/${this.group}/${groupId}/rules/${ruleId}`, data) as AccessPolicyRule;
    }

    deleteRuleById = async (groupId: string, ruleId: string) => {
        await requests.delete<void>(`/${this.group}/${groupId}/rules/${ruleId}`);
    }

    getGroupIdsByUserId = async (userId: string) => {
        return await requests.get(`/${this.group}/bindings/users/${userId}`) as string[];
    }

    setGroupIdsByUserId = async (userId: string, data: string[]) => {
        await requests.put<void>(`/${this.group}/bindings/users/${userId}`, data);
    }

    getGroupIdsByDepartmentId = async (departmentId: string) => {
        return await requests.get(`/${this.group}/bindings/departments/${departmentId}`) as string[];
    }

    setGroupIdsByDepartmentId = async (departmentId: string, data: string[]) => {
        await requests.put<void>(`/${this.group}/bindings/departments/${departmentId}`, data);
    }

    getEffectiveGroups = async (userId: string) => {
        return await requests.get(`/${this.group}/effective/users/${userId}`) as EffectiveAccessPolicyGroup[];
    }

    getBindings = async (groupId: string) => {
        return await requests.get(`/${this.group}/${groupId}/bindings`) as AccessPolicyGroupBindings;
    }

    setUserIdsByGroupId = async (groupId: string, data: string[]) => {
        await requests.put<void>(`/${this.group}/${groupId}/bindings/users`, data);
    }

    setDepartmentIdsByGroupId = async (groupId: string, data: string[]) => {
        await requests.put<void>(`/${this.group}/${groupId}/bindings/departments`, data);
    }
}

const accessPolicyApi = new AccessPolicyApi();
export default accessPolicyApi;
