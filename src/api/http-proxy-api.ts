import requests from "./core/requests";

export interface HTTPProxyConfig {
    enabled: boolean;
    httpEnabled: boolean;
    httpAddr: string;
    httpRedirectToHttps: boolean;
    httpsEnabled: boolean;
    httpsAddr: string;
    selfProxyEnabled: boolean;
    selfDomain: string;
    ipExtractor: string;
    ipTrustList: string[];
    mtlsClientCertAuthMode: string;
}

export interface HTTPProxyPages {
    errorPage: string;
    error502Page: string;
    passwordPage: string;
}

class HTTPProxyApi {
    getConfig = async () => {
        return await requests.get('/admin/http-proxy/config') as HTTPProxyConfig;
    };

    getDefaultPages = async () => {
        return await requests.get('/admin/http-proxy/default-pages') as HTTPProxyPages;
    };
}

export default new HTTPProxyApi();
