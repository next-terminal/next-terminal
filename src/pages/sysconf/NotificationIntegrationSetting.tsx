import {useState} from "react";
import {Tabs} from "antd";
import {useSearchParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {maybe} from "@/utils/maybe.ts";
import MailSetting from "@/pages/sysconf/MailSetting";
import {SettingProps} from "./SettingPage";
import NotificationChannels from "./notification-integration/NotificationChannels";
import NotificationRules from "./notification-integration/NotificationRules";
import NotificationDeliveries from "./notification-integration/NotificationDeliveries";

const NotificationIntegrationSetting = ({
                                             get,
                                             set
                                         }: SettingProps) => {
    const {t} = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeKey, setActiveKey] = useState(maybe(searchParams.get('integrationActiveKey'), 'channels'));

    const handleTabChange = (key: string) => {
        setActiveKey(key);
        setSearchParams({'activeKey': 'notification-integration', 'integrationActiveKey': key});
    };

    return <Tabs
        className="setting-tabs"
        activeKey={activeKey}
        onChange={handleTabChange}
        items={[
            {
                label: t('settings.notification.channels'),
                key: 'channels',
                children: <NotificationChannels/>
            },
            {
                label: t('settings.notification.rules'),
                key: 'rules',
                children: <NotificationRules/>
            },
            {
                label: t('settings.notification.deliveries'),
                key: 'deliveries',
                children: <NotificationDeliveries/>
            },
            {
                label: t('settings.mail.setting'),
                key: 'mail',
                children: <MailSetting get={get} set={set}/>
            }
        ]}
    />;
};

export default NotificationIntegrationSetting;
