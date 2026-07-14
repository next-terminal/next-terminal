import {useState} from 'react';
import {Tabs} from "antd";
import UserInfo from "./UserInfo";
import UserLoginPolicy from "./UserLoginPolicy";
import UserClientCert from "./UserClientCert";
import UserExternalIdentity from "./UserExternalIdentity";
import UserAuthentication from "./UserAuthentication";
import UserAccessToken from "./UserAccessToken";
import UserOidcServerAuthorization from "./UserOidcServerAuthorization";
import {useParams, useSearchParams} from "react-router-dom";
import {maybe} from "../../utils/maybe";
import {useTranslation} from "react-i18next";

const UserDetailPage = () => {

    let {t} = useTranslation();
    let params = useParams();
    const id = params['userId'] as string;
    const [searchParams, setSearchParams] = useSearchParams();
    let key = maybe(searchParams.get('activeKey'), 'info');

    let [activeKey, setActiveKey] = useState(key);

    const handleTagChange = (key: string) => {
        setActiveKey(key);
        setSearchParams({'activeKey': key});
    }

    const items = [
        {
            label: t('actions.detail'),
            key: 'info',
            children: <UserInfo active={activeKey === 'info'} id={id}/>
        },
        {
            label: t('identity.user.admin_auth.title'),
            key: 'authentication',
            children: <UserAuthentication active={activeKey === 'authentication'} userId={id}/>
        },
        {
            label: t('identity.user.external_identity.title'),
            key: 'external-identities',
            children: <UserExternalIdentity active={activeKey === 'external-identities'} userId={id}/>
        },
        {
            label: t('account.access_token'),
            key: 'access-token',
            children: <UserAccessToken active={activeKey === 'access-token'} userId={id}/>
        },
        {
            label: t('account.oidc_server_authorizations'),
            key: 'oidc-server-authorizations',
            children: <UserOidcServerAuthorization active={activeKey === 'oidc-server-authorizations'} userId={id}/>
        },
        {
            label: t('identity.options.login_policy'),
            key: 'login-policy',
            children: <UserLoginPolicy active={activeKey === 'login-policy'} userId={id}/>
        },
        {
            label: t('account.client_cert'),
            key: 'client-cert',
            children: <UserClientCert active={activeKey === 'client-cert'} userId={id}/>
        },
    ];

    return (
        <div className={'px-4'}>
            <Tabs activeKey={activeKey} onChange={handleTagChange} items={items}>
            </Tabs>
        </div>
    );
}

export default UserDetailPage;
