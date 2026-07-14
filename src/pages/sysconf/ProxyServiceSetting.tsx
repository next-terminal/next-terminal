import {Tabs} from "antd";
import {useState} from "react";
import {useSearchParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import SshdSetting from "@/pages/sysconf/SshdSetting";
import DbProxySetting from "@/pages/sysconf/DbProxySetting";
import RdpProxySetting from "@/pages/sysconf/RdpProxySetting";
import {SettingProps} from "./SettingPage";
import {maybe} from "@/utils/maybe.ts";
import HttpProxySetting from "@/pages/sysconf/HttpProxySetting";

const ProxyServiceSetting = ({
                                 get,
                                 set
                             }: SettingProps) => {
    const {t} = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeKey, setActiveKey] = useState(maybe(searchParams.get('proxyServiceActiveKey'), 'sshd'));

    const handleTabChange = (key: string) => {
        setActiveKey(key);
        setSearchParams({'activeKey': 'proxy-service', 'proxyServiceActiveKey': key});
    };

    return <Tabs
        className="setting-tabs"
        activeKey={activeKey}
        onChange={handleTabChange}
        items={[
            {
                label: t('settings.sshd.setting'),
                key: 'sshd',
                children: <SshdSetting get={get} set={set}/>
            },
            {
                label: t('settings.http_proxy.setting'),
                key: 'http-proxy',
                children: <HttpProxySetting get={get} set={set}/>
            },
            {
                label: t('settings.rdp_proxy.setting'),
                key: 'rdp-proxy',
                children: <RdpProxySetting get={get} set={set}/>
            },
            {
                label: t('db.proxy.setting'),
                key: 'db-proxy',
                children: <DbProxySetting get={get} set={set}/>
            },
        ]}
    />;
};

export default ProxyServiceSetting;
