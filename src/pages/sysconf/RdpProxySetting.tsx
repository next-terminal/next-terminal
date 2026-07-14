import {Alert, Button, Form, Input, InputNumber, Switch, Typography} from "antd";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {useFormRequest} from "@/hook/use-antd-form-query";
import {SettingProps} from "./SettingPage";

const {
    Paragraph,
    Text
} = Typography;

const RdpProxySetting = ({
                             get,
                             set
                         }: SettingProps) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const [enabled, setEnabled] = useState(false);

    const wrapGet = async () => {
        const values = await get();
        setEnabled(values['rdp-proxy-enabled']);
        return {
            ...values,
            'rdp-proxy-ticket-ttl-seconds': Number(values['rdp-proxy-ticket-ttl-seconds'] || 300)
        };
    };

    const wrapSet = async (values: any) => {
        await form.validateFields();
        await set(values);
    };

    useFormRequest(form, ['settings', 'rdp-proxy'], wrapGet);

    return <div>
        <div className={'grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start'}>
            <div>
                <Alert title={t('settings.rdp_proxy.tip')} type="info" style={{
                    marginBottom: 10
                }}/>

                <Form form={form} layout="vertical" onFinish={wrapSet}>
                    <Form.Item name="rdp-proxy-enabled" label={t('settings.rdp_proxy.enabled')} required
                               valuePropName="checked">
                        <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}
                                onChange={setEnabled}/>
                    </Form.Item>
                    <Form.Item name="rdp-proxy-addr" label={t('settings.rdp_proxy.addr')} rules={[{
                        required: enabled
                    }]}>
                        <Input disabled={!enabled} placeholder="0.0.0.0:3390"/>
                    </Form.Item>
                    <Form.Item name="rdp-proxy-public-addr" label={t('settings.rdp_proxy.public_addr')}
                               extra={t('settings.rdp_proxy.public_addr_extra')}>
                        <Input disabled={!enabled} placeholder="rdp.example.com:3390"/>
                    </Form.Item>
                    <Form.Item name="rdp-proxy-ticket-ttl-seconds" label={t('settings.rdp_proxy.ticket_ttl')}
                               extra={t('settings.rdp_proxy.ticket_ttl_extra')} rules={[{
                        required: enabled
                    }]}>
                        <InputNumber disabled={!enabled} precision={0} min={60} max={3600} style={{
                            width: '100%'
                        }} placeholder="300"/>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">{t('actions.save')}</Button>
                    </Form.Item>
                </Form>
            </div>

            <div className={'space-y-3 border rounded-lg p-4'}>
                <div>
                    <div className={'font-medium'}>{t('settings.rdp_proxy.usage')}</div>
                    <Text type="secondary">{t('settings.rdp_proxy.usage_tip')}</Text>
                </div>
                <div>
                    <div className={'font-medium'}>{t('settings.rdp_proxy.ticket_flow')}</div>
                    <Text type="secondary">{t('settings.rdp_proxy.ticket_flow_tip')}</Text>
                </div>
                <div>
                    <div className={'font-medium'}>{t('settings.rdp_proxy.rdp_file')}</div>
                    <Paragraph style={{
                        marginBottom: 0,
                        whiteSpace: 'pre-wrap'
                    }} copyable={{
                        text: 'full address:s:rdp.example.com:3390\nusername:s:NTICKET:<ticketId>:<secret>\nprompt for credentials:i:0\nenablecredsspsupport:i:0'
                    }}>
                        full address:s:rdp.example.com:3390{'\n'}
                        username:s:NTICKET:&lt;ticketId&gt;:&lt;secret&gt;{'\n'}
                        prompt for credentials:i:0{'\n'}
                        enablecredsspsupport:i:0
                    </Paragraph>
                </div>
            </div>
        </div>
    </div>;
};

export default RdpProxySetting;
