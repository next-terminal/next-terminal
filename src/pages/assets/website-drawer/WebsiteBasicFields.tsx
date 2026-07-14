import React from 'react';
import {Button, Form, Input, InputNumber, message, Radio, Select} from "antd";
import {useMutation} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {RefreshCwIcon} from "lucide-react";
import ProFormTreeSelect from "@/components/ProFormTreeSelect";
import websiteApi from "@/api/website-api";
import GatewayView from "@/pages/assets/website-drawer/GatewayView";
import LogoSelector from "@/pages/assets/components/LogoSelector";

interface WebsiteBasicFieldsProps {
    showLogo?: boolean;
    showEntrance?: boolean;
}

const WebsiteBasicFields: React.FC<WebsiteBasicFieldsProps> = ({
    showLogo = false,
    showEntrance = true
}) => {
    const {t} = useTranslation();
    const form = Form.useFormInstance();
    const logo = Form.useWatch('logo', form);
    const scheme = Form.useWatch('scheme', form);
    const host = Form.useWatch('host', form);
    const port = Form.useWatch('port', form);
    const originHostMode = Form.useWatch('originHostMode', form);

    const transformGroupData = (data: any[]): any[] => {
        return data.map(item => ({
            title: item.title,
            value: item.key as string,
            children: item.children ? transformGroupData(item.children) : []
        }));
    };

    const groupsRequest = async () => {
        const groups = await websiteApi.getGroups();
        return transformGroupData(groups);
    };

    const schemeOptions = [
        {
            value: 'http',
            label: 'HTTP'
        },
        {
            value: 'https',
            label: 'HTTPS'
        }
    ];

    const handleLogoChange = (nextLogo: string) => {
        form.setFieldValue('logo', nextLogo);
    };

    const faviconMutation = useMutation({
        mutationFn: websiteApi.getFavicon,
        onSuccess: (dataUrl) => {
            handleLogoChange(dataUrl);
            message.success(t('general.success'));
        },
        onError: () => {
            message.error(t('assets.auto_fetch_favicon_failed'));
        }
    });

    const handleFetchFavicon = () => {
        if (!host) {
            message.warning(`${t('assets.forward_host_or_ip')} ${t('general.required')}`);
            return;
        }
        const targetUrl = `${scheme || 'http'}://${host}${port ? ':' + port : ''}`;
        faviconMutation.mutate(targetUrl);
    };

    return (
        <>
            <div className={showLogo ? "grid grid-cols-1 gap-4 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]" : "grid grid-cols-1 gap-4 md:grid-cols-2"}>
                {showLogo && (
                    <LogoSelector
                        logo={logo}
                        onLogoChange={handleLogoChange}
                        extra={
                            <Button
                                block
                                color="default"
                                variant="filled"
                                icon={<RefreshCwIcon className="h-4 w-4"/>}
                                loading={faviconMutation.isPending}
                                onClick={handleFetchFavicon}
                            >
                                {t('assets.auto_fetch_favicon')}
                            </Button>
                        }
                    />
                )}

                <Form.Item label={t('general.name')} name="name" rules={[{required: true}]}>
                    <Input placeholder={t('general.name')}/>
                </Form.Item>

                <ProFormTreeSelect
                    label={t('assets.group')}
                    name="groupId"
                    request={groupsRequest}
                    placeholder={t('gateway_group.name_placeholder')}
                    fieldProps={{
                        treeDefaultExpandAll: true,
                        allowClear: true,
                        showSearch: true,
                        treeNodeFilterProp: 'title'
                    }}
                />
            </div>

            {showEntrance && (
                <Form.Item label={t('assets.entrance')} name="entrance" extra={t('assets.entrance_tip')}>
                    <Input placeholder="/admin"/>
                </Form.Item>
            )}

            <Form.Item label={t('assets.domain')} name="domain" rules={[{required: true}]} extra={t('assets.domain_tip')}>
                <Input placeholder="example.com"/>
            </Form.Item>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-3">
                    <Form.Item label={t('assets.scheme')} name="scheme" rules={[{required: true}]}>
                        <Select options={schemeOptions}/>
                    </Form.Item>
                </div>
                <div className="md:col-span-6">
                    <Form.Item label={t('assets.forward_host_or_ip')} name="host" rules={[{required: true}]}>
                        <Input placeholder="192.168.1.100"/>
                    </Form.Item>
                </div>
                <div className="md:col-span-3">
                    <Form.Item name="port" label={t('assets.forward_port')} rules={[{required: true}]}>
                        <InputNumber precision={0} placeholder="80" min={1} max={65535} style={{width: "100%"}}/>
                    </Form.Item>
                </div>
            </div>

            <Form.Item label={t('assets.origin_host')} name="originHostMode" rules={[{required: true}]}>
                <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    options={[
                        {
                            label: t('assets.origin_host_follow_service'),
                            value: 'service'
                        },
                        {
                            label: t('assets.origin_host_follow_origin'),
                            value: 'origin'
                        },
                        {
                            label: t('assets.origin_host_custom'),
                            value: 'custom'
                        }
                    ]}
                />
            </Form.Item>

            {originHostMode === 'custom' && (
                <Form.Item label={t('assets.origin_host_custom_name')} name="originHostCustom" rules={[{required: true}]}>
                    <Input placeholder="origin.example.com"/>
                </Form.Item>
            )}

            <Form.Item
                label={t('assets.origin_timeout')}
                name="originTimeout"
                extra={t('assets.origin_timeout_tip')}
                rules={[{required: true}]}
            >
                <InputNumber precision={0} min={1} max={3600} addonAfter={t('general.second')} style={{width: "100%"}}/>
            </Form.Item>

            <GatewayView/>
        </>
    );
};

export default WebsiteBasicFields;
