import {useFormRequest} from "@/hook/use-antd-form-query";
import {useState} from 'react';
import {Alert, Button, Form, Input, Switch, Typography} from 'antd';
import {SettingProps} from "./SettingPage";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";

const {
    Paragraph,
    Text
} = Typography;
const DbProxySetting = ({
                            get,
                            set
                        }: SettingProps) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const [enabled, setEnabled] = useState(false);
    const wrapSet = async (values: any) => {
        await form.validateFields();
        await set(values);
    };
    const wrapGet = async () => {
        const values = await get();
        setEnabled(values['db-proxy-enabled']);
        return values;
    };
    useFormRequest(form, ["form-request", "web/src/pages/sysconf/DbProxySetting.tsx"], wrapGet, true);
    return <div>
        <div className={'grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start'}>
            <div>
                <Alert title={t('db.proxy.tip')} type="info" style={{
                    marginBottom: 10
                }}/>

                <Form onFinish={wrapSet} form={form} layout="vertical">
                    <Form.Item name="db-proxy-enabled" label={t('db.proxy.enabled')} required={true}
                               valuePropName="checked">
                        <Switch checked={enabled} onChange={setEnabled} checkedChildren={t('general.enabled')}
                                unCheckedChildren={t('general.disabled')}/>
                    </Form.Item>
                    <Form.Item name="db-proxy-addr" label={t('settings.sshd.addr')} rules={[{
                        required: enabled
                    }]}>
                        <Input disabled={!enabled} placeholder="0.0.0.0:3307"/>
                    </Form.Item>
                    <Form.Item name="db-proxy-public-addr" label={t('db.proxy.public_addr')}
                               extra={t('db.proxy.public_addr_extra')}>
                        <Input disabled={!enabled} placeholder="db.example.com:3307"/>
                    </Form.Item>
                    <Form.Item name="db-proxy-block-dml" label={t('db.proxy.block_dml')}
                               tooltip={t('db.proxy.block_dml_tip')}
                               valuePropName="checked">
                        <Switch checkedChildren={t('general.yes')} unCheckedChildren={t('general.no')}/>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">{t("actions.save")}</Button>
                    </Form.Item>
                </Form>
            </div>

            <div className={'space-y-3 border rounded-lg p-4'}>
                <div>
                    <div className={'font-medium'}>{t('db.proxy.usage_title')}</div>
                    <Text type="secondary">{t('db.proxy.usage_tip')}</Text>
                </div>
                <div>
                    <div className={'font-medium'}>{t('db.proxy.usage_client')}</div>
                    <Paragraph style={{
                        marginBottom: 0
                    }} copyable={true}>mysql -h host -P port -u username@asset_name -p</Paragraph>
                </div>
                <div>
                    <div className={'font-medium'}>{t('account.access_token_type_values.db_password')}</div>
                    <Paragraph style={{
                        marginBottom: 0
                    }}>
                        {t('db.proxy.password_tip_prefix')}
                        <Link to={'/info?activeKey=access-token'}>{t('db.proxy.password_tip_link')}</Link>
                        {t('db.proxy.password_tip_suffix')}
                    </Paragraph>
                </div>
            </div>
        </div>
    </div>;
};
export default DbProxySetting;
