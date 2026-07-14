import {Button, Form, Switch, Typography} from "antd";
import {useTranslation} from "react-i18next";
import {useFormRequest} from "@/hook/use-antd-form-query";
import {SettingProps} from "./SettingPage";
import {useLicense} from "@/hook/LicenseContext";
import Disabled from "@/components/Disabled";

const {Text} = Typography;

const AccessRequestSetting = ({
                                  get,
                                  set
                              }: SettingProps) => {
    const {t} = useTranslation();
    const {license} = useLicense();
    const hasPremiumFeatures = license.hasPremiumFeatures();
    const [form] = Form.useForm();

    useFormRequest(form, ["form-request", "web/src/pages/sysconf/AccessRequestSetting.tsx"], get, true);

    const wrapSet = (values: any) => {
        if (!hasPremiumFeatures) {
            delete values['access-request-enabled'];
        }
        return set(values);
    };

    return <Form form={form} onFinish={wrapSet} layout="vertical">
        <Disabled disabled={!hasPremiumFeatures} className="mb-4">
            <Form.Item
                name="access-request-enabled"
                label={t('settings.access_request.enabled')}
                valuePropName="checked"
                extra={<Text type="secondary">{t('settings.access_request.enabled_tip')}</Text>}
            >
                <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit">{t("actions.save")}</Button>
            </Form.Item>
        </Disabled>
    </Form>;
};

export default AccessRequestSetting;
