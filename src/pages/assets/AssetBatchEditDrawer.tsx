import type {AICommandPolicy, BatchUpdateAssetRequest, BatchUpdateAssetResult} from "@/api/asset-api";
import assetApi from "@/api/asset-api";
import type {GatewayHop} from "@/api/gateway-chain";
import {DefaultTerminalConnectTimeout} from "@/pages/assets/components/AssetAdvancedSettings";
import ConnectionModeFields from "@/pages/assets/components/ConnectionModeFields";
import {useMutation} from "@tanstack/react-query";
import {Alert, App, Button, Checkbox, Divider, Drawer, Form, Input, InputNumber, Select, Space, Switch} from "antd";
import {useEffect} from "react";
import {useTranslation} from "react-i18next";

interface Props {
    assetIds: string[];
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface BatchEditFormValues {
    updateRestrictedShell: boolean;
    restrictedShell: boolean;
    updateEnableAliveCheck: boolean;
    enableAliveCheck: boolean;
    updateEnableDetectOS: boolean;
    enableDetectOS: boolean;
    updateSFTPDirectoryFollow: boolean;
    sftpDirectoryFollow: boolean;
    updateConnectTimeout: boolean;
    connectTimeout: number;
    updateBackspaceMode: boolean;
    backspaceMode: 'del' | 'bs';
    updateEnv: boolean;
    env: string;
    updateAICommandPolicy: boolean;
    aiCommandPolicy: AICommandPolicy;
    updateConnection: boolean;
    connectionMode: 'direct' | 'gateway' | 'proxy';
    gatewaySource: 'inherit' | 'custom';
    gatewayChain: GatewayHop[];
    proxyId?: string;
}

const initialValues: BatchEditFormValues = {
    updateRestrictedShell: false,
    restrictedShell: false,
    updateEnableAliveCheck: false,
    enableAliveCheck: true,
    updateEnableDetectOS: false,
    enableDetectOS: true,
    updateSFTPDirectoryFollow: false,
    sftpDirectoryFollow: true,
    updateConnectTimeout: false,
    connectTimeout: DefaultTerminalConnectTimeout,
    updateBackspaceMode: false,
    backspaceMode: 'del',
    updateEnv: false,
    env: '',
    updateAICommandPolicy: false,
    aiCommandPolicy: '',
    updateConnection: false,
    connectionMode: 'direct',
    gatewaySource: 'inherit',
    gatewayChain: [],
    proxyId: undefined,
};

const AssetBatchEditDrawer = ({assetIds, open, onClose, onSuccess}: Props) => {
    const {t} = useTranslation();
    const {message} = App.useApp();
    const [form] = Form.useForm<BatchEditFormValues>();

    const updateRestrictedShell = Form.useWatch('updateRestrictedShell', form);
    const restrictedShell = Form.useWatch('restrictedShell', form);
    const updateEnableAliveCheck = Form.useWatch('updateEnableAliveCheck', form);
    const updateEnableDetectOS = Form.useWatch('updateEnableDetectOS', form);
    const updateSFTPDirectoryFollow = Form.useWatch('updateSFTPDirectoryFollow', form);
    const updateConnectTimeout = Form.useWatch('updateConnectTimeout', form);
    const updateBackspaceMode = Form.useWatch('updateBackspaceMode', form);
    const updateEnv = Form.useWatch('updateEnv', form);
    const updateAICommandPolicy = Form.useWatch('updateAICommandPolicy', form);
    const updateConnection = Form.useWatch('updateConnection', form);
    const hasTerminalChanges = updateRestrictedShell || updateEnableAliveCheck || updateEnableDetectOS ||
        updateSFTPDirectoryFollow || updateConnectTimeout || updateBackspaceMode || updateEnv;
    const hasChanges = hasTerminalChanges || updateAICommandPolicy || updateConnection;

    useEffect(() => {
        if (open) {
            form.setFieldsValue(initialValues);
        }
    }, [form, open]);

    const mutation = useMutation({
        mutationFn: (request: BatchUpdateAssetRequest) => assetApi.batchUpdate(request),
        onSuccess: (result: BatchUpdateAssetResult, request: BatchUpdateAssetRequest) => {
            const hasSSHChanges = request.changes.terminal || request.changes.ai;
            if (hasSSHChanges && request.changes.connection) {
                message.success(t('assets.batch_edit.success_ssh_connection', {
                    sshCount: result.sshUpdatedCount,
                    skippedCount: result.sshSkippedCount,
                    connectionCount: result.connectionUpdatedCount,
                }));
            } else if (result.connectionUpdatedCount > 0) {
                message.success(t('assets.batch_edit.success_connection', {count: result.connectionUpdatedCount}));
            } else if (result.sshUpdatedCount > 0) {
                message.success(t('assets.batch_edit.success_ssh', {
                    count: result.sshUpdatedCount,
                    skippedCount: result.sshSkippedCount,
                }));
            } else {
                message.warning(t('assets.batch_edit.no_ssh_asset'));
            }
            onSuccess();
        },
    });

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const changes: BatchUpdateAssetRequest['changes'] = {};
        if (hasTerminalChanges) {
            const terminalChanges: NonNullable<BatchUpdateAssetRequest['changes']['terminal']> = {};
            if (values.updateRestrictedShell) {
                terminalChanges.restrictedShell = values.restrictedShell;
            }
            if (values.updateEnableAliveCheck) {
                terminalChanges.enableAliveCheck = values.enableAliveCheck;
            }
            if (values.updateEnableDetectOS) {
                terminalChanges.enableDetectOS = values.enableDetectOS;
            }
            if (values.updateSFTPDirectoryFollow) {
                terminalChanges.sftpDirectoryFollow = values.sftpDirectoryFollow;
            }
            if (values.updateConnectTimeout) {
                terminalChanges.connectTimeout = values.connectTimeout;
            }
            if (values.updateBackspaceMode) {
                terminalChanges.backspaceMode = values.backspaceMode;
            }
            if (values.updateEnv) {
                terminalChanges.env = values.env;
            }
            changes.terminal = terminalChanges;
        }
        if (values.updateAICommandPolicy) {
            changes.ai = {commandPolicy: values.aiCommandPolicy};
        }
        if (values.updateConnection) {
            changes.connection = {
                connectionMode: values.connectionMode,
                gatewayChain: values.connectionMode === 'gateway' && values.gatewaySource === 'custom'
                    ? values.gatewayChain || []
                    : [],
                proxyId: values.connectionMode === 'proxy' ? values.proxyId : undefined,
            };
        }
        mutation.mutate({assetIds, changes});
    };

    const drawerExtra = (
        <Space size={8}>
            <Button onClick={onClose}>{t('actions.cancel')}</Button>
            <Button
                type="primary"
                disabled={!hasChanges}
                loading={mutation.isPending}
                onClick={handleSubmit}
            >
                {t('actions.confirm')}
            </Button>
        </Space>
    );

    return (
        <Drawer
            title={t('assets.batch_edit.title')}
            open={open}
            onClose={onClose}
            size={520}
            extra={drawerExtra}
        >
            <div className={'mb-5'}>
                <Alert
                    type="info"
                    showIcon
                    className=""
                    title={t('assets.batch_edit.scope_tip')}
                />
            </div>

            <Form form={form} layout="vertical" initialValues={initialValues}>
                <div className="mb-3 font-medium">{t('assets.terminal_settings')}</div>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <Form.Item name="updateRestrictedShell" valuePropName="checked" noStyle>
                            <Checkbox>{t('assets.restricted_shell')}</Checkbox>
                        </Form.Item>
                        <div className="mt-1 text-xs text-gray-500">{t('assets.restricted_shell_extra')}</div>
                    </div>
                    <Form.Item name="restrictedShell" valuePropName="checked" noStyle>
                        <Switch
                            disabled={!updateRestrictedShell}
                            checkedChildren={t('general.enabled')}
                            unCheckedChildren={t('general.disabled')}
                        />
                    </Form.Item>
                </div>
                <Space orientation="vertical" size="middle" className="mt-5 w-full">
                    <div className="flex items-center justify-between gap-4">
                        <Form.Item name="updateEnableAliveCheck" valuePropName="checked" noStyle>
                            <Checkbox>{t('assets.enable_alive_check')}</Checkbox>
                        </Form.Item>
                        <Form.Item name="enableAliveCheck" valuePropName="checked" noStyle>
                            <Switch
                                disabled={!updateEnableAliveCheck || (updateRestrictedShell && restrictedShell)}
                                checkedChildren={t('general.enabled')}
                                unCheckedChildren={t('general.disabled')}
                            />
                        </Form.Item>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Form.Item name="updateEnableDetectOS" valuePropName="checked" noStyle>
                            <Checkbox>{t('assets.enable_detect_os')}</Checkbox>
                        </Form.Item>
                        <Form.Item name="enableDetectOS" valuePropName="checked" noStyle>
                            <Switch
                                disabled={!updateEnableDetectOS || (updateRestrictedShell && restrictedShell)}
                                checkedChildren={t('general.enabled')}
                                unCheckedChildren={t('general.disabled')}
                            />
                        </Form.Item>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Form.Item name="updateSFTPDirectoryFollow" valuePropName="checked" noStyle>
                            <Checkbox>{t('assets.sftp_directory_follow')}</Checkbox>
                        </Form.Item>
                        <Form.Item name="sftpDirectoryFollow" valuePropName="checked" noStyle>
                            <Switch
                                disabled={!updateSFTPDirectoryFollow}
                                checkedChildren={t('general.enabled')}
                                unCheckedChildren={t('general.disabled')}
                            />
                        </Form.Item>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Form.Item name="updateConnectTimeout" valuePropName="checked" noStyle>
                            <Checkbox>{t('assets.connect_timeout')}</Checkbox>
                        </Form.Item>
                        <Space.Compact>
                            <Form.Item
                                name="connectTimeout"
                                noStyle
                                rules={[{required: updateConnectTimeout, type: 'number', min: 1, max: 300}]}
                            >
                                <InputNumber disabled={!updateConnectTimeout} min={1} max={300} className="w-28"/>
                            </Form.Item>
                            <Space.Addon>{t('general.second')}</Space.Addon>
                        </Space.Compact>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Form.Item name="updateBackspaceMode" valuePropName="checked" noStyle>
                            <Checkbox>{t('assets.backspace_mode')}</Checkbox>
                        </Form.Item>
                        <Form.Item name="backspaceMode" noStyle>
                            <Select
                                className="w-44"
                                disabled={!updateBackspaceMode}
                                options={[
                                    {label: t('assets.backspace_mode_del'), value: 'del'},
                                    {label: t('assets.backspace_mode_bs'), value: 'bs'},
                                ]}
                            />
                        </Form.Item>
                    </div>
                    <div>
                        <Form.Item name="updateEnv" valuePropName="checked">
                            <Checkbox>{t('assets.env')}</Checkbox>
                        </Form.Item>
                        <Form.Item name="env" noStyle>
                            <Input.TextArea
                                rows={4}
                                allowClear
                                disabled={!updateEnv}
                                placeholder={t('assets.env_placeholder')}
                            />
                        </Form.Item>
                    </div>
                </Space>

                <Divider/>
                <div className="mb-3 font-medium">{t('assets.ai.settings')}</div>
                <Space orientation="vertical" size="middle" className="w-full">
                    <div className="flex items-center justify-between gap-4">
                        <Form.Item name="updateAICommandPolicy" valuePropName="checked" noStyle>
                            <Checkbox>{t('assets.ai.command_policy')}</Checkbox>
                        </Form.Item>
                        <Form.Item name="aiCommandPolicy" noStyle>
                            <Select
                                className="w-44"
                                disabled={!updateAICommandPolicy}
                                options={[
                                    {label: t('assets.ai.follow_global'), value: ''},
                                    {label: t('settings.ai.command_policy_auto'), value: 'auto'},
                                    {label: t('settings.ai.command_policy_balanced'), value: 'balanced'},
                                    {label: t('settings.ai.command_policy_always'), value: 'always'},
                                ]}
                            />
                        </Form.Item>
                    </div>
                </Space>

                <Divider/>
                <Form.Item name="updateConnection" valuePropName="checked">
                    <Checkbox>{t('assets.batch_edit.update_connection')}</Checkbox>
                </Form.Item>
                {updateConnection && (
                    <ConnectionModeFields
                        allowInheritedGateway

                        proxyTip={t('assets.proxy_protocol_tip')}
                    />
                )}
            </Form>
        </Drawer>
    );
};

export default AssetBatchEditDrawer;
