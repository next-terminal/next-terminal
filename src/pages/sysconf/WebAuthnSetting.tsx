import {useFormRequest} from "@/hook/use-antd-form-query";
import {useState} from 'react';
import {useTranslation} from "react-i18next";
import {SettingProps} from "@/pages/sysconf/SettingPage";
import {Button, Form, Input, Select, Space, Switch} from 'antd';
import {AimOutlined} from "@ant-design/icons";

const WebAuthnSetting = ({
                             get,
                             set
                         }: SettingProps) => {
    const [form] = Form.useForm();

    let [passkeyEnabled, setPasskeyEnabled] = useState<boolean>();
    let {t} = useTranslation();
    const handleAutoDetect = () => {
        const {
            hostname,
            origin
        } = window.location;
        form.setFieldsValue({
            'passkey-domain': hostname,
            'passkey-origins': [origin]
        });
    };
    const wrapGet = async () => {
        let values = await get();
        setPasskeyEnabled(values['passkey-enabled']);
        values['passkey-origins'] = values['passkey-origins']?.split(',');
        return values;
    };
    const wrapSet = async (values: any) => {
        values['passkey-origins'] = values['passkey-origins']?.join(',');
        return await set(values);
    };

    function isValidOrigin(input: string) {
        try {
            const url = new URL(input);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch (e) {
            return false; // 无法解析为有效 URL
        }
    }

    useFormRequest(form, ["form-request", "web/src/pages/sysconf/WebAuthnSetting.tsx"], wrapGet, true);
    return <div className="w-full max-w-5xl overflow-hidden">
        <Form
            onFinish={wrapSet}
            form={form}
            layout="vertical"
            className="w-full [&_.ant-form-item-label>label]:whitespace-normal"
        >
            <Form.Item name="passkey-enabled" label={t("settings.security.passkey.enabled")} required={true} valuePropName="checked">
                <Switch checked={passkeyEnabled} onChange={setPasskeyEnabled} checkedChildren={t('general.enabled')}
                        unCheckedChildren={t('general.disabled')}/>
            </Form.Item>

            <div className="grid w-full grid-cols-1 gap-x-4 md:grid-cols-[minmax(220px,320px)_minmax(0,1fr)]">
                <Form.Item label={t('settings.security.passkey.domain')} required={passkeyEnabled} className="min-w-0">
                    <Space.Compact block>
                        <Form.Item name="passkey-domain" rules={[{
                            required: passkeyEnabled
                        }]} noStyle>
                            <Input disabled={!passkeyEnabled} className="w-full"/>
                        </Form.Item>
                        <Button type="dashed" icon={<AimOutlined/>} disabled={!passkeyEnabled} onClick={handleAutoDetect}>
                            {t('settings.security.passkey.auto_detect')}
                        </Button>
                    </Space.Compact>
                </Form.Item>

                <Form.Item name={'passkey-origins'} label={t('settings.security.passkey.origins')}
                           tooltip={t('settings.security.passkey.origins_tip')} rules={[{
                        required: passkeyEnabled
                    }, () => ({
                        validator(_, value) {
                            if (!value) {
                                return Promise.resolve();
                            }
                            for (let i = 0; i < value.length; i++) {
                                let val = value[i];
                                if (!isValidOrigin(val)) {
                                    return Promise.reject(new Error(t('settings.security.passkey.origins_error')));
                                }
                            }
                            return Promise.resolve();
                        }
                    })]}>
                    <Select mode="tags" disabled={!passkeyEnabled} className="w-full min-w-0"/>
                </Form.Item>
            </div>

            <Form.Item className="mb-0">
                <Button type="primary" htmlType="submit" className="w-full sm:w-auto">{t("actions.save")}</Button>
            </Form.Item>
        </Form>
    </div>;
};
export default WebAuthnSetting;
