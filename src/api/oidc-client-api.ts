import {Api} from "./core/api";
import requests from "./core/requests";

export interface OidcClient {
    id: string;
    name: string;
    clientId: string;
    clientSecret?: string;
    redirectUris: string[];
    grantTypes: string[];
    scopes: string[];
    description?: string;
    accessControl?: string; // all/department/user
    boundUserIds?: string[];
    boundDepartmentIds?: string[];
    skipConsent?: boolean;
    status: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}

export interface OidcClientCreateRequest {
    name: string;
    clientId: string;
    redirectUris: string[];
    grantTypes?: string[];
    scopes?: string[];
    description?: string;
    accessControl?: string;
    boundUserIds?: string[];
    boundDepartmentIds?: string[];
    skipConsent?: boolean;
}

export interface OidcClientUpdateRequest {
    name: string;
    clientId: string;
    redirectUris: string[];
    grantTypes?: string[];
    scopes?: string[];
    description?: string;
    status?: string;
    accessControl?: string;
    boundUserIds?: string[];
    boundDepartmentIds?: string[];
    skipConsent?: boolean;
}

export interface OidcClientCreateResponse {
    client: OidcClient;
    secret: string;
}

class OidcClientApi extends Api<OidcClient> {
    constructor() {
        super("admin/oidc-clients");
    }

    regenerateSecret = async (id: string): Promise<{ clientSecret: string }> => {
        return await requests.post(`/${this.group}/${id}/regenerate-secret`, {});
    }

    updateStatus = async (id: string, status: string): Promise<void> => {
        await requests.patch(`/${this.group}/${id}/status`, {status});
    }

}

const oidcClientApi = new OidcClientApi();
export default oidcClientApi;
