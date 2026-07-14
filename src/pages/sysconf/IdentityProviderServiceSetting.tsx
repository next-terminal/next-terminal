import {Tabs} from "antd";
import {useState} from "react";
import {useSearchParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {maybe} from "@/utils/maybe.ts";
import OidcServerSetting from "@/pages/sysconf/OidcServerSetting";
import {SettingProps} from "./SettingPage";

const IdentityProviderServiceSetting = ({
                                            get,
                                            set
                                        }: SettingProps) => {
    const {t} = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeKey, setActiveKey] = useState(maybe(searchParams.get('identityProviderActiveKey'), 'oidc-server'));

    const handleTabChange = (key: string) => {
        setActiveKey(key);
        setSearchParams({'activeKey': 'identity-provider-service', 'identityProviderActiveKey': key});
    };

    return <Tabs
        className="setting-tabs"
        activeKey={activeKey}
        onChange={handleTabChange}
        items={[
            {
                label: t('settings.oidc_server.server'),
                key: 'oidc-server',
                children: <OidcServerSetting get={get} set={set}/>
            },
        ]}
    />;
};

export default IdentityProviderServiceSetting;
