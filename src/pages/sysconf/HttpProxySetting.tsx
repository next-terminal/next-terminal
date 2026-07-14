import {Alert, Button, Descriptions, Form, Input, Space, Spin, Tabs, Tag, Typography} from "antd";
import {useQuery} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {useFormRequest} from "@/hook/use-antd-form-query";
import httpProxyApi, {HTTPProxyPages} from "@/api/http-proxy-api";
import {SettingProps} from "./SettingPage";

const ERROR_PAGE_KEY = 'reverse-proxy-server-error-page';
const ERROR_502_PAGE_KEY = 'reverse-proxy-server-error-502-page';
const PASSWORD_PAGE_KEY = 'reverse-proxy-server-password-page';

type PagePropertyKey = typeof ERROR_PAGE_KEY | typeof ERROR_502_PAGE_KEY | typeof PASSWORD_PAGE_KEY;

const defaultPageByPropertyKey = (pages: HTTPProxyPages, key: PagePropertyKey) => {
    switch (key) {
        case ERROR_PAGE_KEY:
            return pages.errorPage;
        case ERROR_502_PAGE_KEY:
            return pages.error502Page;
        case PASSWORD_PAGE_KEY:
            return pages.passwordPage;
    }
};

const HttpProxySetting = ({get, set}: SettingProps) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();

    const configQuery = useQuery({
        queryKey: ['http-proxy', 'config'],
        queryFn: httpProxyApi.getConfig,
    });
    const defaultPagesQuery = useQuery({
        queryKey: ['http-proxy', 'default-pages'],
        queryFn: httpProxyApi.getDefaultPages,
    });

    const wrapGet = async () => {
        const [values, defaults] = await Promise.all([get(), httpProxyApi.getDefaultPages()]);
        return {
            ...values,
            [ERROR_PAGE_KEY]: values[ERROR_PAGE_KEY] || defaults.errorPage,
            [ERROR_502_PAGE_KEY]: values[ERROR_502_PAGE_KEY] || defaults.error502Page,
            [PASSWORD_PAGE_KEY]: values[PASSWORD_PAGE_KEY] || defaults.passwordPage,
        };
    };

    useFormRequest(form, ['settings', 'http-proxy', 'pages'], wrapGet);

    const wrapSet = async (values: Record<PagePropertyKey, string>) => {
        const defaults = defaultPagesQuery.data || await httpProxyApi.getDefaultPages();
        const payload = {
            [ERROR_PAGE_KEY]: values[ERROR_PAGE_KEY] === defaults.errorPage ? '' : values[ERROR_PAGE_KEY],
            [ERROR_502_PAGE_KEY]: values[ERROR_502_PAGE_KEY] === defaults.error502Page ? '' : values[ERROR_502_PAGE_KEY],
            [PASSWORD_PAGE_KEY]: values[PASSWORD_PAGE_KEY] === defaults.passwordPage ? '' : values[PASSWORD_PAGE_KEY],
        };
        const saved = await set(payload);
        if (saved !== false) {
            form.setFieldsValue({
                [ERROR_PAGE_KEY]: payload[ERROR_PAGE_KEY] || defaults.errorPage,
                [ERROR_502_PAGE_KEY]: payload[ERROR_502_PAGE_KEY] || defaults.error502Page,
                [PASSWORD_PAGE_KEY]: payload[PASSWORD_PAGE_KEY] || defaults.passwordPage,
            });
        }
    };

    const resetPage = async (key: PagePropertyKey) => {
        const result = await defaultPagesQuery.refetch();
        if (result.data) {
            form.setFieldValue(key, defaultPageByPropertyKey(result.data, key));
        }
    };

    const status = (enabled?: boolean) => enabled
        ? <Tag color="success">{t('general.enabled')}</Tag>
        : <Tag>{t('general.disabled')}</Tag>;
    const config = configQuery.data;

    const editor = (key: PagePropertyKey, title: string, help: string) => <div>
        <div className="flex items-center justify-between gap-3 mb-3">
            <div>
                <Typography.Title level={5} style={{margin: 0}}>{title}</Typography.Title>
                <Typography.Text type="secondary">{help}</Typography.Text>
            </div>
            <Button onClick={() => resetPage(key)} loading={defaultPagesQuery.isFetching}>
                {t('settings.http_proxy.reset_default')}
            </Button>
        </div>
        <Form.Item name={key} noStyle>
            <Input.TextArea rows={20} spellCheck={false} style={{fontFamily: 'monospace'}}/>
        </Form.Item>
    </div>;

    return <Space direction="vertical" size="large" style={{width: '100%'}}>
        <div>
            <Alert type="info" title={t('settings.http_proxy.readonly_tip')} style={{marginBottom: 12}}/>
            <Spin spinning={configQuery.isLoading}>
                <Descriptions bordered size="small" column={{xs: 1, sm: 2, xl: 3}}>
                    <Descriptions.Item label={t('settings.http_proxy.enabled')}>{status(config?.enabled)}</Descriptions.Item>
                    <Descriptions.Item label={t('settings.http_proxy.http_enabled')}>{status(config?.httpEnabled)}</Descriptions.Item>
                    <Descriptions.Item label={t('settings.http_proxy.http_addr')}>{config?.httpAddr || '-'}</Descriptions.Item>
                    <Descriptions.Item label={t('settings.http_proxy.http_redirect_https')}>{status(config?.httpRedirectToHttps)}</Descriptions.Item>
                    <Descriptions.Item label={t('settings.http_proxy.https_enabled')}>{status(config?.httpsEnabled)}</Descriptions.Item>
                    <Descriptions.Item label={t('settings.http_proxy.https_addr')}>{config?.httpsAddr || '-'}</Descriptions.Item>
                    <Descriptions.Item label={t('settings.http_proxy.self_proxy_enabled')}>{status(config?.selfProxyEnabled)}</Descriptions.Item>
                    <Descriptions.Item label={t('settings.http_proxy.self_domain')}>{config?.selfDomain || '-'}</Descriptions.Item>
                    <Descriptions.Item label={t('settings.http_proxy.ip_extractor')}>{config?.ipExtractor || '-'}</Descriptions.Item>
                    <Descriptions.Item label={t('settings.http_proxy.ip_trust_list')} span={2}>
                        {config?.ipTrustList?.length ? config.ipTrustList.join(', ') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('settings.http_proxy.mtls_mode')}>{config?.mtlsClientCertAuthMode || '-'}</Descriptions.Item>
                </Descriptions>
            </Spin>
        </div>

        <div>
            <Typography.Title level={4}>{t('settings.http_proxy.custom_pages')}</Typography.Title>
            <Alert type="warning" title={t('settings.http_proxy.template_tip')} style={{marginBottom: 12}}/>
            <Form form={form} layout="vertical" onFinish={wrapSet}>
                <Tabs items={[
                    {
                        key: ERROR_PAGE_KEY,
                        forceRender: true,
                        label: t('settings.http_proxy.error_page'),
                        children: editor(ERROR_PAGE_KEY, t('settings.http_proxy.error_page'), t('settings.http_proxy.error_page_help')),
                    },
                    {
                        key: ERROR_502_PAGE_KEY,
                        forceRender: true,
                        label: t('settings.http_proxy.error_502_page'),
                        children: editor(ERROR_502_PAGE_KEY, t('settings.http_proxy.error_502_page'), t('settings.http_proxy.error_502_page_help')),
                    },
                    {
                        key: PASSWORD_PAGE_KEY,
                        forceRender: true,
                        label: t('settings.http_proxy.password_page'),
                        children: editor(PASSWORD_PAGE_KEY, t('settings.http_proxy.password_page'), t('settings.http_proxy.password_page_help')),
                    },
                ]}/>
                <Form.Item style={{marginTop: 16, marginBottom: 0}}>
                    <Button type="primary" htmlType="submit">{t('actions.save')}</Button>
                </Form.Item>
            </Form>
        </div>
    </Space>;
};

export default HttpProxySetting;
