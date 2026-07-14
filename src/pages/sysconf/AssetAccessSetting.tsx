import {Tabs} from "antd";
import {useState} from "react";
import {useSearchParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {maybe} from "@/utils/maybe.ts";
import AssetAccessEntrySetting from "@/pages/sysconf/AssetAccessEntrySetting";
import WatermarkSetting from "@/pages/sysconf/WatermarkSetting";
import AssetRecordingSetting from "@/pages/sysconf/AssetRecordingSetting";
import AssetRecordingConvertSetting from "@/pages/sysconf/AssetRecordingConvertSetting";
import RdpSetting from "@/pages/sysconf/RdpSetting";
import VncSetting from "@/pages/sysconf/VncSetting";
import {SettingProps} from "./SettingPage";
import AccessRequestSetting from "@/pages/sysconf/AccessRequestSetting";

const AssetAccessSetting = ({
                                get,
                                set
                            }: SettingProps) => {
    const {t} = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeKey, setActiveKey] = useState(maybe(searchParams.get('assetAccessActiveKey'), 'entry'));

    const handleTabChange = (key: string) => {
        setActiveKey(key);
        setSearchParams({'activeKey': 'asset-access', 'assetAccessActiveKey': key});
    };

    return <Tabs
        className="setting-tabs"
        activeKey={activeKey}
        onChange={handleTabChange}
        items={[
            {
                label: t('settings.asset_access.entry'),
                key: 'entry',
                children: <AssetAccessEntrySetting get={get} set={set}/>
            },
            {
                label: t('settings.access_request.setting'),
                key: 'access-request',
                children: <AccessRequestSetting get={get} set={set}/>
            },
            {
                label: t('settings.asset_access.watermark'),
                key: 'watermark',
                children: <WatermarkSetting get={get} set={set}/>
            },
            {
                label: t('settings.asset_access.recording'),
                key: 'recording',
                children: <AssetRecordingSetting get={get} set={set}/>
            },
            {
                label: t('settings.asset_access.recording_convert'),
                key: 'recording-convert',
                children: <AssetRecordingConvertSetting get={get} set={set}/>
            },
            {
                label: t('settings.rdp.setting'),
                key: 'rdp',
                children: <RdpSetting get={get} set={set}/>
            },
            {
                label: t('settings.vnc.setting'),
                key: 'vnc',
                children: <VncSetting get={get} set={set}/>
            },
        ]}
    />;
};

export default AssetAccessSetting;
