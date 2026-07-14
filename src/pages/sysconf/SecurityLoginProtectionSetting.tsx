import {Button, Form, Switch} from "antd";
import {useTranslation} from "react-i18next";
import {useFormRequest} from "@/hook/use-antd-form-query";
import {SettingProps} from "./SettingPage";

const SecurityLoginProtectionSetting = ({
                                            get,
                                            set
                                        }: SettingProps) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();

    useFormRequest(form, ["form-request", "web/src/pages/sysconf/SecurityLoginProtectionSetting.tsx"], get, true);

    return <Form form={form} onFinish={set} layout="vertical">
        <div className={'flex md:items-center md:gap-2 md:flex-row flex-col'}>
            <Form.Item name="login-captcha-enabled" label={t("settings.security.captcha")} required={true}
                       valuePropName="checked">
                <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
            </Form.Item>

            <Form.Item name="login-force-totp-enabled" label={t("settings.security.force_otp")} required={true}
                       valuePropName="checked">
                <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
            </Form.Item>

            <Form.Item name="disable-password-login" label={t("settings.security.disable_password_login")}
                       required={true} valuePropName="checked">
                <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
            </Form.Item>
        </div>

        <Form.Item>
            <Button type="primary" htmlType="submit">{t("actions.save")}</Button>
        </Form.Item>
    </Form>;
};

export default SecurityLoginProtectionSetting;
