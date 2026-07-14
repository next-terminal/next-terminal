import {Tabs} from "antd";
import {useState} from "react";
import {useSearchParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {maybe} from "@/utils/maybe.ts";
import SystemBasicSetting from "@/pages/sysconf/SystemBasicSetting";
import NetworkSetting from "@/pages/sysconf/NetworkSetting";
import {SettingProps} from "./SettingPage";

const SystemSetting = ({
                           get,
                           set
                       }: SettingProps) => {
    const {t} = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeKey, setActiveKey] = useState(maybe(searchParams.get('systemActiveKey'), 'basic'));

    const handleTabChange = (key: string) => {
        setActiveKey(key);
        setSearchParams({'activeKey': 'system', 'systemActiveKey': key});
    };

    return <Tabs
        className="setting-tabs"
        activeKey={activeKey}
        onChange={handleTabChange}
        items={[
            {
                label: t('settings.system.basic'),
                key: 'basic',
                children: <SystemBasicSetting get={get} set={set}/>
            },
            {
                label: t('settings.system.network'),
                key: 'network',
                children: <NetworkSetting get={get} set={set}/>
            },
        ]}
    />;
};

export default SystemSetting;
