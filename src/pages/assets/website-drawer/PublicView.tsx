import React from 'react';
import {Alert, Checkbox, DatePicker, Form, Input, Select, Switch} from "antd";
import {useTranslation} from "react-i18next";
import dayjs, {Dayjs} from "dayjs";
import {useQuery} from "@tanstack/react-query";
import websiteApi from "@/api/website-api";
import Disabled from "@/components/Disabled";

interface PublicViewProps {
    hasPremiumFeatures: boolean;
}

const PublicView: React.FC<PublicViewProps> = ({hasPremiumFeatures}) => {
    const {t, i18n} = useTranslation();
    const form = Form.useFormInstance();
    const publicEnabled = Form.useWatch(['public', 'enabled'], form);
    const timeLimit = Form.useWatch(['public', 'timeLimit'], form);
    const countries = Form.useWatch(['public', 'countries'], form) || [];
    const provinces = Form.useWatch(['public', 'provinces'], form) || [];
    const geoOptionsQuery = useQuery({
        queryKey: ['website-geo-options', i18n.language, countries, provinces],
        queryFn: () => websiteApi.getGeoOptions(i18n.language, countries, provinces),
        enabled: hasPremiumFeatures && !!publicEnabled,
    });

    const disabledDate = (current: Dayjs) => {
        return current && current < dayjs();
    };

    const handleTimeLimitChange = (e: any) => {
        if (!e.target.checked) {
            form.setFieldValue(['public', 'expiredAt'], undefined);
        }
    };

    const handleCountriesChange = (values: string[]) => {
        form.setFieldValue(['public', 'countries'], values);
        form.setFieldValue(['public', 'provinces'], []);
        form.setFieldValue(['public', 'cities'], []);
    };

    const handleProvincesChange = (values: string[]) => {
        form.setFieldValue(['public', 'provinces'], values);
        form.setFieldValue(['public', 'cities'], []);
    };

    return <div className="flex flex-col gap-3">
        <Alert type="warning" title={t('assets.public_tip')} showIcon
               className="bg-amber-50/60 dark:bg-amber-900/20"/>

        <Form.Item
            label={t('general.enabled')}
            name={['public', 'enabled']}
            valuePropName="checked"
            style={{marginBottom: 0}}
        >
            <Switch
                checkedChildren={t('general.yes')}
                unCheckedChildren={t('general.no')}/>
        </Form.Item>

        {publicEnabled && (
            <div className="flex flex-col gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex flex-col gap-3">
                    <Form.Item label={t('assets.limit_ip')} name={['public', 'ip']} extra={t('assets.limit_ip_tip')}>
                        <Input.TextArea
                            autoSize={{minRows: 3, maxRows: 8}}
                            placeholder={"192.168.1.0/24\n10.0.0.1\n172.16.0.1-172.16.0.255"}/>
                    </Form.Item>
                    <Disabled disabled={!hasPremiumFeatures}>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <Form.Item label={t('assets.limit_country')} name={['public', 'countries']}
                                       extra={t('assets.limit_country_tip')} tooltip={t('assets.limit_geo_input_tip')}>
                                <Select
                                    mode='tags'
                                    loading={geoOptionsQuery.isLoading}
                                    options={geoOptionsQuery.data?.countries}
                                    onChange={handleCountriesChange}
                                    placeholder={t('assets.limit_country_placeholder')}/>
                            </Form.Item>
                            <Form.Item label={t('assets.limit_province')} name={['public', 'provinces']}
                                       extra={t('assets.limit_province_tip')} tooltip={t('assets.limit_geo_input_tip')}>
                                <Select
                                    mode='tags'
                                    loading={geoOptionsQuery.isLoading}
                                    options={geoOptionsQuery.data?.provinces}
                                    onChange={handleProvincesChange}
                                    placeholder={t('assets.limit_province_placeholder')}/>
                            </Form.Item>
                            <Form.Item label={t('assets.limit_city')} name={['public', 'cities']}
                                       extra={t('assets.limit_city_tip')} tooltip={t('assets.limit_geo_input_tip')}>
                                <Select
                                    mode='tags'
                                    loading={geoOptionsQuery.isLoading}
                                    options={geoOptionsQuery.data?.cities}
                                    placeholder={t('assets.limit_city_placeholder')}/>
                            </Form.Item>
                        </div>
                    </Disabled>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Form.Item label={t('assets.public_header_whitelist')} name={['public', 'headerWhitelist']}
                                   extra={t('assets.public_header_whitelist_tip')}>
                            <Select
                                mode='tags'
                                tokenSeparators={[',']}
                                placeholder={t('assets.public_header_whitelist_placeholder')}/>
                        </Form.Item>
                        <Form.Item label={t('assets.public_path_whitelist')} name={['public', 'pathWhitelist']}
                                   extra={t('assets.public_path_whitelist_tip')}>
                            <Select
                                mode='tags'
                                tokenSeparators={[',']}
                                placeholder={t('assets.public_path_whitelist_placeholder')}/>
                        </Form.Item>
                    </div>
                    <Form.Item name={['public', 'timeLimit']} valuePropName="checked">
                        <Checkbox
                            onChange={handleTimeLimitChange}>{t('assets.limit_time_enabled')}</Checkbox>
                    </Form.Item>

                    {timeLimit && <Form.Item label={t('assets.limit_time')} name={['public', 'expiredAt']}>
                        <DatePicker
                            allowClear={true}
                            disabledDate={disabledDate}
                            showTime={true}
                            className="w-full"/>
                    </Form.Item>}
                </div>

                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                    <Form.Item label={t('assets.limit_password')} name={['public', 'password']}
                               extra={t('assets.limit_password_tip')} style={{marginBottom: 0}}>
                        <Input.Password
                            autoComplete='new-password'
                            name='public-access-password'
                            spellCheck={false}
                            placeholder="password123"/>
                    </Form.Item>
                </div>

            </div>
        )}

    </div>;
};
export default PublicView;
