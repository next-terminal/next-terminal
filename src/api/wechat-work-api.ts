import {Api} from './core/api';
import requests from './core/requests';
import type {ExternalLoginResult} from './account-api';

export interface WechatWorkAuthorizeResponse {
    authorizeUrl: string;
    state: string;
}

class WechatWorkApi extends Api<any> {
    constructor() {
        super('account');
    }

    // 获取企业微信授权链接
    getAuthorizeUrl = async (): Promise<WechatWorkAuthorizeResponse> => {
        return await requests.get('/wechat-work/authorize');
    }

    // 企业微信登录
    login = async ({code, state}: {code: string; state: string}): Promise<ExternalLoginResult> => {
        const params = new URLSearchParams({code, state});
        return await requests.post(`/wechat-work/login?${params.toString()}`);
    }
}

const wechatWorkApi = new WechatWorkApi();
export default wechatWorkApi;
