import {Alert, Button, Form, Input, Radio, Switch} from "antd";
import {useTranslation} from "react-i18next";
import {useFormRequest} from "@/hook/use-antd-form-query";
import {SettingProps} from "./SettingPage";
import {useState} from "react";

const isTruthy = (value: any) => value === true || `${value}`.toLowerCase() === 'true';
const savedSecretPlaceholder = '******';
const hasTextValue = (value: any) => typeof value === 'string' ? value.trim() !== '' : !!value;

const AssetRecordingSetting = ({
                                   get,
                                   set
                               }: SettingProps) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const recordingEnabled = Form.useWatch('recording-enabled', form);
    const recordingType = Form.useWatch('recording-type', form);
    const [s3SecretAccessKeyExists, setS3SecretAccessKeyExists] = useState(false);
    const [webDAVPasswordExists, setWebDAVPasswordExists] = useState(false);
    const isRecordingEnabled = isTruthy(recordingEnabled);

    const wrapGet = async () => {
        const values = {...await get()};
        setS3SecretAccessKeyExists(isTruthy(values['recording-s3-secret-access-key-exists']));
        setWebDAVPasswordExists(isTruthy(values['recording-webdav-password-exists']));
        values['recording-enabled'] = values['recording-enabled'] === undefined
            ? true
            : isTruthy(values['recording-enabled']);
        values['recording-type'] = values['recording-type'] || 'local';
        values['recording-s3-use-ssl'] = values['recording-s3-use-ssl'] === undefined || values['recording-s3-use-ssl'] === ''
            ? true
            : isTruthy(values['recording-s3-use-ssl']);
        values['recording-s3-path-style'] = values['recording-s3-path-style'] === undefined || values['recording-s3-path-style'] === ''
            ? false
            : isTruthy(values['recording-s3-path-style']);
        values['recording-s3-secret-access-key'] = '';
        values['recording-webdav-password'] = '';
        return values;
    };

    const wrapSet = (formValues: any) => {
        const values = {...formValues};
        values['recording-enabled'] = values['recording-enabled'] === undefined
            ? false
            : isTruthy(values['recording-enabled']);
        values['recording-type'] = values['recording-type'] || 'local';

        if (values['recording-type'] !== 's3') {
            delete values['recording-s3-endpoint'];
            delete values['recording-s3-access-key-id'];
            delete values['recording-s3-secret-access-key'];
            delete values['recording-s3-bucket'];
            delete values['recording-s3-use-ssl'];
            delete values['recording-s3-path-style'];
        } else if (!hasTextValue(values['recording-s3-secret-access-key'])) {
            delete values['recording-s3-secret-access-key'];
        }

        if (values['recording-type'] !== 'webdav') {
            delete values['recording-webdav-endpoint'];
            delete values['recording-webdav-username'];
            delete values['recording-webdav-password'];
            delete values['recording-webdav-directory'];
        } else if (!hasTextValue(values['recording-webdav-password'])) {
            delete values['recording-webdav-password'];
        }

        delete values['recording-path'];
        delete values['recording-s3-secret-access-key-exists'];
        delete values['recording-webdav-password-exists'];

        return set(values);
    };

    useFormRequest(form, ["form-request", "web/src/pages/sysconf/AssetRecordingSetting.tsx"], wrapGet, true);

    return <Form form={form} onFinish={wrapSet} layout="vertical">
        <Form.Item
            name="recording-enabled"
            label={t('identity.user.recording')}
            required={true}
            valuePropName="checked"
            extra={t('settings.asset_access.recording_tip')}
        >
            <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
        </Form.Item>

        <Alert
            type="info"
            showIcon
            title={t('settings.asset_access.recording_storage_tip')}
            style={{marginBottom: 16}}
        />

        <Form.Item name="recording-type" label={t('settings.asset_access.recording_storage_type')} required={true}>
            <Radio.Group disabled={!isRecordingEnabled} options={[{
                label: t('settings.asset_access.recording_storage_local'),
                value: 'local'
            }, {
                label: 'S3',
                value: 's3'
            }, {
                label: 'WebDAV',
                value: 'webdav'
            }]}/>
        </Form.Item>

        {recordingType === 'local' && <Form.Item
            name="recording-path"
            label={t('settings.asset_access.recording_path')}
            extra={t('settings.asset_access.recording_path_readonly_tip')}
        >
            <Input disabled placeholder="/usr/local/next-terminal/data/recording" style={{maxWidth: 520}}/>
        </Form.Item>}

        {recordingType === 's3' && <>
            <Form.Item
                name="recording-s3-endpoint"
                label={t('settings.asset_access.recording_s3_endpoint')}
                required={isRecordingEnabled}
                rules={[{
                    required: isRecordingEnabled,
                    message: t('settings.asset_access.recording_s3_endpoint_required')
                }]}
            >
                <Input disabled={!isRecordingEnabled} placeholder="s3.amazonaws.com" style={{maxWidth: 520}}/>
            </Form.Item>
            <Form.Item
                name="recording-s3-access-key-id"
                label={t('settings.asset_access.recording_s3_access_key_id')}
                required={isRecordingEnabled}
                rules={[{
                    required: isRecordingEnabled,
                    message: t('settings.asset_access.recording_s3_access_key_id_required')
                }]}
            >
                <Input disabled={!isRecordingEnabled} style={{maxWidth: 520}}/>
            </Form.Item>
            <Form.Item
                name="recording-s3-secret-access-key"
                label={t('settings.asset_access.recording_s3_secret_access_key')}
                required={isRecordingEnabled && !s3SecretAccessKeyExists}
                rules={[{
                    required: isRecordingEnabled && !s3SecretAccessKeyExists,
                    message: t('settings.asset_access.recording_s3_secret_access_key_required')
                }]}
            >
                <Input.Password
                    disabled={!isRecordingEnabled}
                    placeholder={s3SecretAccessKeyExists ? savedSecretPlaceholder : ''}
                    style={{maxWidth: 520}}
                />
            </Form.Item>
            <Form.Item
                name="recording-s3-bucket"
                label={t('settings.asset_access.recording_s3_bucket')}
                required={isRecordingEnabled}
                rules={[{
                    required: isRecordingEnabled,
                    message: t('settings.asset_access.recording_s3_bucket_required')
                }]}
            >
                <Input disabled={!isRecordingEnabled} placeholder="recordings" style={{maxWidth: 520}}/>
            </Form.Item>
            <div className="flex flex-wrap gap-4">
                <Form.Item name="recording-s3-use-ssl" label={t('settings.asset_access.recording_s3_use_ssl')}
                           valuePropName="checked">
                    <Switch disabled={!isRecordingEnabled} checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
                </Form.Item>
                <Form.Item name="recording-s3-path-style" label={t('settings.asset_access.recording_s3_path_style')}
                           valuePropName="checked">
                    <Switch disabled={!isRecordingEnabled} checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
                </Form.Item>
            </div>
        </>}

        {recordingType === 'webdav' && <>
            <Form.Item
                name="recording-webdav-endpoint"
                label={t('settings.asset_access.recording_webdav_endpoint')}
                required={isRecordingEnabled}
                rules={[{
                    required: isRecordingEnabled,
                    message: t('settings.asset_access.recording_webdav_endpoint_required')
                }]}
            >
                <Input disabled={!isRecordingEnabled} placeholder="https://example.com/dav" style={{maxWidth: 520}}/>
            </Form.Item>
            <Form.Item
                name="recording-webdav-username"
                label={t('settings.asset_access.recording_webdav_username')}
                required={isRecordingEnabled}
                rules={[{
                    required: isRecordingEnabled,
                    message: t('settings.asset_access.recording_webdav_username_required')
                }]}
            >
                <Input disabled={!isRecordingEnabled} style={{maxWidth: 520}}/>
            </Form.Item>
            <Form.Item
                name="recording-webdav-password"
                label={t('settings.asset_access.recording_webdav_password')}
            >
                <Input.Password
                    disabled={!isRecordingEnabled}
                    placeholder={webDAVPasswordExists ? savedSecretPlaceholder : ''}
                    style={{maxWidth: 520}}
                />
            </Form.Item>
            <Form.Item
                name="recording-webdav-directory"
                label={t('settings.asset_access.recording_webdav_directory')}
            >
                <Input disabled={!isRecordingEnabled} placeholder="/recordings" style={{maxWidth: 520}}/>
            </Form.Item>
        </>}

        <Form.Item>
            <Button type="primary" htmlType="submit">{t("actions.save")}</Button>
        </Form.Item>
    </Form>;
};

export default AssetRecordingSetting;
