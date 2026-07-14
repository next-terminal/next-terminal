import {Button, Form, InputNumber, Radio, Space, Switch} from "antd";
import {useTranslation} from "react-i18next";
import {useFormRequest} from "@/hook/use-antd-form-query";
import {SettingProps} from "./SettingPage";

const AssetAccessEntrySetting = ({
                                     get,
                                     set
                                 }: SettingProps) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();

    useFormRequest(form, ["form-request", "web/src/pages/sysconf/AssetAccessEntrySetting.tsx"], get, true);

    return <Form form={form} onFinish={set} layout="vertical">
        <Form.Item name="asset-access-mode" label={t('settings.system.asset_access.mode')} required={true}>
            <Radio.Group options={[{
                label: t('settings.system.asset_access.access_page'),
                value: 'access-page'
            }, {
                label: t('settings.system.asset_access.standalone_page'),
                value: 'standalone-page'
            }]}/>
        </Form.Item>

        <div className={'flex md:items-center md:gap-2 md:flex-row flex-col'}>
            <Form.Item name="access-require-mfa" label={t("settings.security.access_require_mfa")} required={true}
                       valuePropName="checked">
                <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
            </Form.Item>
            <Form.Item label={t('settings.security.access_mfa_expires_at')}>
                <Space.Compact block>
                    <Form.Item name="access-mfa-expires-at" noStyle>
                        <InputNumber precision={0} min={0}/>
                    </Form.Item>
                    <Space.Addon>{t('general.minute')}</Space.Addon>
                </Space.Compact>
            </Form.Item>
        </div>

        <Form.Item>
            <Button type="primary" htmlType="submit">{t("actions.save")}</Button>
        </Form.Item>
    </Form>;
};

export default AssetAccessEntrySetting;
