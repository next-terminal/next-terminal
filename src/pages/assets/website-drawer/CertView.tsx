import QuerySelect from "@/components/QuerySelect";
import React from 'react';
import {Form, Switch} from "antd";
import {useTranslation} from "react-i18next";
import certificateApi from "@/api/certificate-api";

const CertView: React.FC = () => {
    const {t} = useTranslation();
    const form = Form.useFormInstance();
    const certEnabled = Form.useWatch(['cert', 'enabled'], form);

    const certificateRequest = async () => {
        const certificates = await certificateApi.getAll();
        return certificates.map(item => ({
            label: item.commonName,
            value: item.id
        }));
    };
    return <div className="flex flex-col gap-3">
        <Form.Item label={t('general.enabled')} name={['cert', 'enabled']} valuePropName="checked" style={{marginBottom: 0}}>
            <Switch
                checkedChildren={t('general.yes')}
                unCheckedChildren={t('general.no')}/>
        </Form.Item>

        {certEnabled && (
            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <Form.Item label={t('assets.cert')} name={['cert', 'certId']} rules={[{
                    required: true
                }]} style={{marginBottom: 0}}>
                    <QuerySelect placeholder={t('assets.cert')} showSearch request={certificateRequest}/>
                </Form.Item>
            </div>
        )}
    </div>;
};
export default CertView;
