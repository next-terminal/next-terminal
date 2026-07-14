import {useFormRequest} from "@/hook/use-antd-form-query";
import {useState} from 'react';
import {App, Form, Input, Modal, Radio} from 'antd';
import {useTranslation} from "react-i18next";
import dnsProviderApi from "@/api/dns-provider-api";

export interface Props {
    open: boolean;
    handleOk: (values: any) => void;
    handleCancel: () => void;
}

const CertificateDNSProviderModal = ({
    open,
    handleOk,
    handleCancel
}: Props) => {
    const [form] = Form.useForm();
    let {t} = useTranslation();
    let [ok, setOk] = useState(false);
    let {modal, message} = App.useApp();

    const get = async () => {
        const data = await dnsProviderApi.get();
        if (data.ok === true) {
            setOk(true);
            return data;
        }
        return {
            type: 'tencentcloud'
        };
    };
    useFormRequest(form, ["form-request", "web/src/pages/assets/CertificateDNSProviderModal.tsx", open], get, {enabled: open});
    return <Modal
        title={t('assets.dns_provider_config')}
        open={open}
        mask={{closable: false}}
        destroyOnHidden={true}
        onOk={() => {
            form.validateFields().then(async values => {
                handleOk(values);
            });
        }}
        onCancel={handleCancel}
        confirmLoading={false}
        okText={t('assets.dns_providers.set')}
        okButtonProps={{
            disabled: ok
        }}
        cancelButtonProps={{
            color: 'red',
            variant: 'filled',
            disabled: !ok,
            onClick: async () => {
                modal.confirm({
                    title: t('assets.dns_providers.remove_confirm_title'),
                    content: t('assets.dns_providers.remove_confirm_content'),
                    onOk: () => {
                        dnsProviderApi.remove().then(() => {
                            form.setFieldsValue({
                                type: 'tencentcloud',
                                tencentcloud: {
                                    secretId: '',
                                    secretKey: ''
                                },
                                alidns: {
                                    accessKeyId: '',
                                    accessKeySecret: ''
                                },
                                cloudflare: {
                                    apiToken: '',
                                    zoneToken: ''
                                },
                                huaweicloud: {
                                    accessKeyId: '',
                                    secretAccessKey: ''
                                }
                            });
                            setOk(false);
                            message.open({
                                type: 'success',
                                content: t('general.success')
                            });
                        });
                    }
                });
            }
        }}
        cancelText={t('assets.dns_providers.remove')}
    >
        <Form disabled={ok} form={form} clearOnDestroy={true} layout="vertical">
            <Form.Item hidden={true} name={'id'}>
                <Input />
            </Form.Item>
            <Form.Item label={t('assets.dns_providers.type')} name='type' required={true}>
                <Radio.Group options={[{
                    label: t('assets.dns_providers.tencentcloud'),
                    value: 'tencentcloud'
                }, {
                    label: t('assets.dns_providers.alidns'),
                    value: 'alidns'
                }, {
                    label: t('assets.dns_providers.huaweicloud'),
                    value: 'huaweicloud'
                }, {
                    label: t('assets.dns_providers.cloudflare'),
                    value: 'cloudflare'
                }]} />
            </Form.Item>
            <Form.Item noStyle={true} shouldUpdate={true}>
                {form => {
                    const type = form.getFieldValue('type');
                    switch (type) {
                        case 'tencentcloud':
                            return <>
                                <Form.Item label={'SecretId'} name={['tencentcloud', 'secretId']}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label={'SecretKey'} name={['tencentcloud', 'secretKey']}>
                                    <Input />
                                </Form.Item>
                            </>;
                        case 'alidns':
                            return <>
                                <Form.Item label={'AccessKeyId'} name={['alidns', 'accessKeyId']}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label={'AccessKeySecret'} name={['alidns', 'accessKeySecret']}>
                                    <Input />
                                </Form.Item>
                            </>;
                        case 'huaweicloud':
                            return <>
                                <Form.Item label={'AccessKeyId'} name={['huaweicloud', 'accessKeyId']}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label={'SecretAccessKey'} name={['huaweicloud', 'secretAccessKey']}>
                                    <Input />
                                </Form.Item>
                            </>;
                        case 'cloudflare':
                            return <>
                                <Form.Item label={'ApiToken'} name={['cloudflare', 'apiToken']}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label={'ZoneToken'} name={['cloudflare', 'zoneToken']}>
                                    <Input />
                                </Form.Item>
                            </>;
                    }
                    return null;
                }}
            </Form.Item>
        </Form>
    </Modal>;
};
export default CertificateDNSProviderModal;
