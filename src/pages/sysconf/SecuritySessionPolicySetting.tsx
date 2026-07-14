import {Button, Form, InputNumber, Space, Switch} from "antd";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {useFormRequest} from "@/hook/use-antd-form-query";
import {SettingProps} from "./SettingPage";

const SecuritySessionPolicySetting = ({
                                          get,
                                          set
                                      }: SettingProps) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const [customSessionCount, setCustomSessionCount] = useState<boolean>();

    const wrapGet = async () => {
        const values = await get();
        setCustomSessionCount(values['login-session-count-custom']);
        return values;
    };

    useFormRequest(form, ["form-request", "web/src/pages/sysconf/SecuritySessionPolicySetting.tsx"], wrapGet, true);

    return <Form form={form} onFinish={set} layout="vertical">
        <div className={'flex md:items-center md:gap-2 md:flex-row flex-col'}>
            <Form.Item name="login-session-count-custom" label={t("settings.security.session.count_custom")}
                       required={true} valuePropName="checked">
                <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}
                        onChange={setCustomSessionCount}/>
            </Form.Item>
            <Form.Item label={t('settings.security.session.count_limit')}
                       required={customSessionCount}>
                <Space.Compact block>
                    <Form.Item name="login-session-count-limit" noStyle>
                        <InputNumber precision={0} disabled={!customSessionCount} min={1}/>
                    </Form.Item>
                    <Space.Addon>{t('settings.security.devices')}</Space.Addon>
                </Space.Compact>
            </Form.Item>
            <Form.Item label={t('settings.security.session.duration')}>
                <Space.Compact block>
                    <Form.Item name="login-session-duration" noStyle>
                        <InputNumber precision={0} min={1} max={365 * 24 * 60}/>
                    </Form.Item>
                    <Space.Addon>{t('general.minute')}</Space.Addon>
                </Space.Compact>
            </Form.Item>
            <Form.Item label={t('settings.security.client_cert_valid_days')}>
                <Space.Compact block>
                    <Form.Item name="user-client-cert-valid-days" noStyle>
                        <InputNumber precision={0} min={1}/>
                    </Form.Item>
                    <Space.Addon>{t('general.days')}</Space.Addon>
                </Space.Compact>
            </Form.Item>
        </div>

        <Form.Item>
            <Button type="primary" htmlType="submit">{t("actions.save")}</Button>
        </Form.Item>
    </Form>;
};

export default SecuritySessionPolicySetting;
