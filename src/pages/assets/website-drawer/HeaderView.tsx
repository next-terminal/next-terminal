import React from 'react';
import {DeleteOutlined, PlusOutlined} from "@ant-design/icons";
import {Button, Form, Input} from "antd";
import {useTranslation} from "react-i18next";

const HeaderView: React.FC = () => {
    const {t} = useTranslation();

    return (
        <Form.Item label={t('assets.custom_header')} tooltip={t('assets.custom_header_tip')}>
            <Form.List name="headers" initialValue={[]}>
                {(fields, {add, remove}) => (
                    <div className="space-y-2">
                        {fields.length > 0 && (
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] gap-2 px-2 text-xs text-gray-500">
                                <div>{t('assets.header_key')}</div>
                                <div>{t('assets.header_value')}</div>
                                <div/>
                            </div>
                        )}

                        {fields.map(field => (
                            <div
                                key={field.key}
                                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] items-start gap-2"
                            >
                                <Form.Item name={[field.name, 'name']} style={{marginBottom: 0}}>
                                    <Input placeholder="Content-Type"/>
                                </Form.Item>
                                <Form.Item name={[field.name, 'value']} style={{marginBottom: 0}}>
                                    <Input placeholder="application/json"/>
                                </Form.Item>
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined/>}
                                    onClick={() => remove(field.name)}
                                />
                            </div>
                        ))}

                        <Button
                            type="dashed"
                            icon={<PlusOutlined/>}
                            aria-label={t('assets.custom_header')}
                            onClick={() => add()}
                            block
                        />
                    </div>
                )}
            </Form.List>
        </Form.Item>
    );
};
export default HeaderView;
