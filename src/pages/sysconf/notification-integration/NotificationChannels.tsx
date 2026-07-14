import {useEffect} from "react";
import {App, Button, Card, Form, Input, InputNumber, Select, Space, Spin, Switch, Typography} from "antd";
import {Send} from "lucide-react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {notificationChannelApi, NotificationChannel} from "@/api/notification-api";
import {
    channelDocumentLinks,
    channelTypeLabel,
    channelTypes,
    notificationLanguages,
    robotWebhookPlaceholders
} from "./constants";
import {useTranslation} from "react-i18next";

const hiddenSecret = "******";

const NotificationChannels = () => {
    const {t} = useTranslation();
    const {message, modal} = App.useApp();
    const queryClient = useQueryClient();

    const channelsQuery = useQuery({
        queryKey: ['notification-channels'],
        queryFn: notificationChannelApi.getAll,
    });

    const saveMutation = useMutation({
        mutationFn: async (values: NotificationChannel) => {
            await notificationChannelApi.updateById(values.type, values);
        },
        onSuccess: async () => {
            message.success(t('general.success'));
            await queryClient.invalidateQueries({queryKey: ['notification-channels']});
        },
    });

    const testMutation = useMutation({
        mutationFn: notificationChannelApi.test,
        onSuccess: async (result) => {
            message.success(t('settings.notification.test_success'));
            modal.info({
                title: t('settings.notification.result'),
                content: (
                    <Typography.Paragraph copyable={!!result} style={{whiteSpace: 'pre-wrap', marginBottom: 0}}>
                        {result || '-'}
                    </Typography.Paragraph>
                ),
            });
            await queryClient.invalidateQueries({queryKey: ['notification-channels']});
        },
    });

    if (channelsQuery.isLoading) {
        return <div className="flex justify-center py-10"><Spin/></div>;
    }

    const channels = channelsQuery.data || [];
    const sortedChannels = channelTypes.map(type => channels.find(channel => channel.type === type) || {
        type,
        enabled: false,
        config: {language: 'zh-CN'},
        secretConfig: {},
        createdAt: 0,
        updatedAt: 0,
    });

    return <Space direction="vertical" size="middle" style={{width: '100%'}}>
        {sortedChannels.map(channel => <NotificationChannelPanel
            key={channel.type}
            channel={channel}
            saveLoading={saveMutation.isPending}
            testLoading={testMutation.isPending}
            onSave={saveMutation.mutate}
            onTest={testMutation.mutate}
        />)}
    </Space>;
};

const NotificationChannelPanel = ({
                                      channel,
                                      saveLoading,
                                      testLoading,
                                      onSave,
                                      onTest,
                                  }: {
    channel: NotificationChannel;
    saveLoading: boolean;
    testLoading: boolean;
    onSave: (channel: NotificationChannel) => void;
    onTest: (type: string) => void;
}) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const enabled = Form.useWatch('enabled', form);
    const isMail = channel.type === 'mail';
    const isWebhook = channel.type === 'webhook';
    const isWeComApp = channel.type === 'wecomApp';
    const showSecret = channel.type === 'feishu' || channel.type === 'dingtalk' || channel.type === 'webhook';

    const validateWebhookUrl = (_: unknown, value?: string) => {
        if (!value || value === hiddenSecret) {
            return Promise.resolve();
        }
        try {
            const url = new URL(value);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                return Promise.reject(new Error(t('settings.notification.webhook_url_invalid')));
            }
            return Promise.resolve();
        } catch {
            return Promise.reject(new Error(t('settings.notification.webhook_url_invalid')));
        }
    };

    useEffect(() => {
        form.setFieldsValue({
            enabled: channel.enabled,
            config: channel.config || {},
            secretConfig: channel.secretConfig || {},
        });
    }, [channel, form]);

    const handleSave = async () => {
        const values = await form.validateFields();
        onSave({
            ...channel,
            enabled: values.enabled,
            config: values.config || {},
            secretConfig: values.secretConfig || {},
        });
    };

    return <Form form={form} layout="vertical">
        <Card
            title={channelTypeLabel(channel.type, t)}
            extra={<Space>
                <Form.Item name="enabled" valuePropName="checked" noStyle>
                    <Switch checkedChildren={t('general.enabled')} unCheckedChildren={t('general.disabled')}/>
                </Form.Item>
                <Button size="small" icon={<Send size={14}/>} loading={testLoading} onClick={() => onTest(channel.type)}>
                    {t('settings.notification.test')}
                </Button>
                <Button size="small" type="primary" loading={saveLoading} onClick={handleSave}>
                    {t('actions.save')}
                </Button>
            </Space>}
        >
            {enabled && <>
                {channelDocumentLinks[channel.type] && <Typography.Paragraph>
                    <Typography.Link href={channelDocumentLinks[channel.type]} target="_blank">
                        {channelDocumentLinks[channel.type]}
                    </Typography.Link>
                </Typography.Paragraph>}
                <Form.Item name={['config', 'language']} label={t('settings.notification.language')}>
                    <Select options={notificationLanguages.map(item => ({
                        label: t(`settings.notification.languages.${item}`, item),
                        value: item,
                    }))}/>
                </Form.Item>
                {isMail && <Form.Item
                    name={['config', 'recipient']}
                    label={t('settings.notification.recipients')}
                    rules={[{required: enabled, message: t('settings.notification.recipients_required')}]}
                >
                    <Input.TextArea rows={3} placeholder={t('settings.notification.recipients_placeholder')}/>
                </Form.Item>}
                {isWeComApp && <>
                    <Form.Item
                        name={['config', 'origin']}
                        label={t('settings.notification.wecom_app_origin')}
                        initialValue="https://qyapi.weixin.qq.com"
                        rules={[{required: enabled, message: t('settings.notification.wecom_app_origin_required')}]}
                    >
                        <Input autoComplete="off" placeholder="https://qyapi.weixin.qq.com"/>
                    </Form.Item>
                    <Form.Item
                        name={['config', 'corpId']}
                        label={t('settings.notification.wecom_app_corp_id')}
                        rules={[{required: enabled, message: t('settings.notification.wecom_app_corp_id_required')}]}
                    >
                        <Input autoComplete="off" placeholder={t('settings.notification.wecom_app_corp_id_placeholder')}/>
                    </Form.Item>
                    <Form.Item
                        name={['secretConfig', 'corpSecret']}
                        label={t('settings.notification.wecom_app_corp_secret')}
                        rules={[{required: enabled, message: t('settings.notification.wecom_app_corp_secret_required')}]}
                    >
                        <Input.Password autoComplete="new-password" placeholder={t('settings.notification.wecom_app_corp_secret_placeholder')}/>
                    </Form.Item>
                    <Form.Item
                        name={['config', 'agentId']}
                        label={t('settings.notification.wecom_app_agent_id')}
                        rules={[{required: enabled, message: t('settings.notification.wecom_app_agent_id_required')}]}
                    >
                        <InputNumber style={{width: '100%'}} placeholder={t('settings.notification.wecom_app_agent_id_placeholder')}/>
                    </Form.Item>
                    <Form.Item
                        name={['config', 'toUser']}
                        label={t('settings.notification.wecom_app_to_user')}
                        initialValue="@all"
                        rules={[{required: enabled, message: t('settings.notification.wecom_app_to_user_required')}]}
                    >
                        <Input autoComplete="off" placeholder={t('settings.notification.wecom_app_to_user_placeholder')}/>
                    </Form.Item>
                </>}
                {!isMail && !isWeComApp && <Form.Item
                    name={['secretConfig', 'webhookUrl']}
                    label={isWebhook ? t('settings.notification.webhook_url') : t('settings.notification.robot_webhook_url')}
                    rules={[
                        {required: enabled, message: t('settings.notification.webhook_url_required')},
                        {validator: validateWebhookUrl},
                    ]}
                >
                    <Input autoComplete="off" placeholder={robotWebhookPlaceholders[channel.type]}/>
                </Form.Item>}
                {showSecret && <Form.Item name={['secretConfig', 'secret']} label={t('settings.notification.sign_secret')}>
                    <Input.Password autoComplete="new-password" placeholder="SEC..."/>
                </Form.Item>}
            </>}
        </Card>
    </Form>;
};

export default NotificationChannels;
