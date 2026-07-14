import {Tabs} from "antd";
import {useState} from "react";
import {useSearchParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {maybe} from "@/utils/maybe.ts";
import BackupSetting from "@/pages/sysconf/BackupSetting";
import LicenseSetting from "@/pages/sysconf/LicenseSetting";
import LogoSetting from "@/pages/sysconf/LogoSetting";
import About from "@/pages/sysconf/About";
import {useLicense} from "@/hook/LicenseContext";
import GeoDataSetting from "@/pages/sysconf/GeoDataSetting";

const SystemMaintenanceSetting = () => {
    const {t} = useTranslation();
    const {license} = useLicense();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeKey, setActiveKey] = useState(maybe(searchParams.get('maintenanceActiveKey'), 'backup'));

    const handleTabChange = (key: string) => {
        setActiveKey(key);
        setSearchParams({'activeKey': 'maintenance', 'maintenanceActiveKey': key});
    };

    const items = [
        {
            label: t('settings.backup.setting'),
            key: 'backup',
            children: <BackupSetting/>
        },
        {
            label: t('settings.license.setting'),
            key: 'license',
            children: <LicenseSetting/>
        },
        {
            label: t('settings.logo.setting'),
            key: 'logo',
            children: <LogoSetting/>
        },
        {
            label: t('settings.geodata.setting'),
            key: 'geodata',
            children: <GeoDataSetting/>
        },
    ];

    if (!license.isOEM()) {
        items.push({
            label: t('settings.about.setting'),
            key: 'about',
            children: <About/>
        });
    }

    return <Tabs className="setting-tabs" activeKey={activeKey} onChange={handleTabChange} items={items}/>;
};

export default SystemMaintenanceSetting;
