import {DeleteOutlined, PlusOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import {Button, Form, Input, InputNumber, Select, Switch, Tooltip} from 'antd';
import {useTranslation} from "react-i18next";

const methodOptions = [
    {value: 'GET', label: 'GET'},
    {value: 'POST', label: 'POST'},
    {value: 'PUT', label: 'PUT'},
    {value: 'DELETE', label: 'DELETE'},
    {value: 'PATCH', label: 'PATCH'},
    {value: 'HEAD', label: 'HEAD'},
    {value: 'OPTIONS', label: 'OPTIONS'},
];

const WebsiteModifyResponseView = () => {
    const {t} = useTranslation();

    const renderTitle = (label: string, tooltip?: string) => (
        <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
            <span>{label}</span>
            {tooltip && (
                <Tooltip title={tooltip}>
                    <QuestionCircleOutlined className="cursor-pointer text-gray-400"/>
                </Tooltip>
            )}
        </div>
    );

    const renderKeyValueFields = (fieldName: any[], label: string, tooltip: string, addLabel: string) => (
        <Form.List name={fieldName}>
            {(fields, {add, remove}) => (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        {renderTitle(label, tooltip)}
                        <Button
                            type="link"
                            size="small"
                            icon={<PlusOutlined/>}
                            onClick={() => add()}
                            style={{paddingInline: 0}}
                        >
                            {addLabel}
                        </Button>
                    </div>

                    {fields.length > 0 && (
                        <div className="overflow-x-auto">
                            <div className="min-w-[520px] space-y-2">
                                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] gap-2 px-2 text-xs text-gray-500">
                                    <div>{t('assets.header_key')}</div>
                                    <div>{t('assets.header_value')}</div>
                                    <div/>
                                </div>

                                {fields.map(({key, name, ...restField}) => (
                                    <div
                                        key={key}
                                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] items-start gap-2"
                                    >
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'key']}
                                            rules={[{
                                                required: true,
                                                message: t('assets.website_response_modify.header_key_required')
                                            }]}
                                            style={{marginBottom: 0}}
                                        >
                                            <Input placeholder={t('assets.header_key')}/>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'value']}
                                            rules={[{
                                                required: true,
                                                message: t('assets.website_response_modify.header_value_required')
                                            }]}
                                            style={{marginBottom: 0}}
                                        >
                                            <Input placeholder={t('assets.header_value')}/>
                                        </Form.Item>
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined/>}
                                            onClick={() => remove(name)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Form.List>
    );

    const renderRemoveHeaders = (ruleName: number) => (
        <Form.List name={[ruleName, 'actions', 'remove_headers']}>
            {(fields, {add, remove}) => (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        {renderTitle(
                            t('assets.website_response_modify.remove_headers_label'),
                            t('assets.website_response_modify.remove_headers_tip')
                        )}
                        <Button
                            type="link"
                            size="small"
                            icon={<PlusOutlined/>}
                            onClick={() => add()}
                            style={{paddingInline: 0}}
                        >
                            {t('assets.website_response_modify.add_remove_header_button')}
                        </Button>
                    </div>

                    {fields.length > 0 && (
                        <div className="overflow-x-auto">
                            <div className="min-w-[320px] space-y-2">
                                <div className="grid grid-cols-[minmax(0,1fr)_32px] gap-2 px-2 text-xs text-gray-500">
                                    <div>{t('assets.website_response_modify.remove_headers_label')}</div>
                                    <div/>
                                </div>

                                {fields.map(({key, name: subName, ...restField}) => (
                                    <div
                                        key={key}
                                        className="grid grid-cols-[minmax(0,1fr)_32px] items-start gap-2"
                                    >
                                        <Form.Item
                                            {...restField}
                                            name={[subName]}
                                            rules={[{
                                                required: true,
                                                message: t('assets.website_response_modify.remove_header_name_required')
                                            }]}
                                            style={{marginBottom: 0}}
                                        >
                                            <Input
                                                placeholder={t('assets.website_response_modify.remove_header_name_placeholder')}/>
                                        </Form.Item>
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined/>}
                                            onClick={() => remove(subName)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Form.List>
    );

    const renderBodyReplace = (ruleName: number) => (
        <Form.List name={[ruleName, 'actions', 'body_replace']}>
            {(fields, {add, remove}) => (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        {renderTitle(t('assets.website_response_modify.body_replace_title'))}
                        <Button
                            type="link"
                            size="small"
                            icon={<PlusOutlined/>}
                            onClick={() => add()}
                            style={{paddingInline: 0}}
                        >
                            {t('assets.website_response_modify.add_replace_rule')}
                        </Button>
                    </div>

                    {fields.length > 0 && (
                        <div className="overflow-x-auto">
                            <div className="min-w-[680px] space-y-2">
                                <div className="grid grid-cols-[minmax(0,1fr)_92px_minmax(0,1fr)_32px] gap-2 px-2 text-xs text-gray-500">
                                    <div>{t('assets.website_response_modify.search_text_label')}</div>
                                    <div>
                                        <Tooltip title={t('assets.website_response_modify.use_regex_tip')}>
                                            <span>{t('assets.website_response_modify.use_regex_label')}</span>
                                        </Tooltip>
                                    </div>
                                    <div>{t('assets.website_response_modify.replace_text_label')}</div>
                                    <div/>
                                </div>

                                {fields.map(({key, name: subName, ...restField}) => (
                                    <div
                                        key={key}
                                        className="grid grid-cols-[minmax(0,1fr)_92px_minmax(0,1fr)_32px] items-start gap-2"
                                    >
                                        <Form.Item
                                            {...restField}
                                            name={[subName, 'search']}
                                            rules={[{
                                                required: true,
                                                message: t('assets.website_response_modify.search_text_required')
                                            }]}
                                            style={{marginBottom: 0}}
                                        >
                                            <Input placeholder={t('assets.website_response_modify.search_text_placeholder')}/>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[subName, 'is_regex']}
                                            valuePropName="checked"
                                            style={{marginBottom: 0}}
                                        >
                                            <Switch/>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[subName, 'replace']}
                                            rules={[{
                                                required: true,
                                                message: t('assets.website_response_modify.replace_text_required')
                                            }]}
                                            style={{marginBottom: 0}}
                                        >
                                            <Input placeholder={t('assets.website_response_modify.replace_text_placeholder')}/>
                                        </Form.Item>
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined/>}
                                            onClick={() => remove(subName)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Form.List>
    );

    return (
        <Form.List name="modifyRules">
            {(fields, {add, remove}) => (
                <div className="space-y-4">
                    {fields.map(({key, name, ...restField}) => (
                        <div key={key} className="space-y-4 border-b border-gray-200 pb-4 last:border-b-0">
                            <div className="grid grid-cols-[minmax(0,1fr)_32px] items-start gap-2">
                                <Form.Item
                                    {...restField}
                                    name={[name, 'name']}
                                    rules={[{
                                        required: true,
                                        message: t('assets.website_response_modify.rule_name_required')
                                    }]}
                                    style={{marginBottom: 0}}
                                >
                                    <Input placeholder={t('assets.website_response_modify.rule_name_placeholder')}/>
                                </Form.Item>
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined/>}
                                    onClick={() => remove(name)}
                                />
                            </div>

                            <div className="space-y-2">
                                {renderTitle(t('assets.website_response_modify.match_conditions'))}
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'match', 'path']}
                                        label={t('assets.website_response_modify.match_path')}
                                        tooltip={t('assets.website_response_modify.match_path_tip')}
                                        style={{marginBottom: 0}}
                                    >
                                        <Input placeholder="/hello"/>
                                    </Form.Item>

                                    <Form.Item
                                        {...restField}
                                        name={[name, 'match', 'method']}
                                        label={t('assets.website_response_modify.match_method')}
                                        tooltip={t('assets.website_response_modify.match_method_tip')}
                                        style={{marginBottom: 0}}
                                    >
                                        <Select
                                            placeholder={t('assets.website_response_modify.match_method_placeholder')}
                                            allowClear
                                            options={methodOptions}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        {...restField}
                                        name={[name, 'match', 'status']}
                                        label={t('assets.website_response_modify.match_status')}
                                        tooltip={t('assets.website_response_modify.match_status_tip')}
                                        style={{marginBottom: 0}}
                                    >
                                        <InputNumber
                                            min={0}
                                            max={599}
                                            placeholder="200"
                                            style={{width: '100%'}}
                                        />
                                    </Form.Item>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {renderTitle(t('assets.website_response_modify.header_operations'))}
                                {renderKeyValueFields(
                                    [name, 'actions', 'set_headers'],
                                    t('assets.website_response_modify.set_headers_label'),
                                    t('assets.website_response_modify.set_headers_tip'),
                                    t('assets.website_response_modify.add_set_headers')
                                )}
                                {renderKeyValueFields(
                                    [name, 'actions', 'add_headers'],
                                    t('assets.website_response_modify.add_headers_label'),
                                    t('assets.website_response_modify.add_headers_tip'),
                                    t('assets.website_response_modify.add_add_headers')
                                )}
                                {renderRemoveHeaders(name)}
                                {renderBodyReplace(name)}
                            </div>
                        </div>
                    ))}

                    <Form.Item style={{marginBottom: 0}}>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined/>}
                            onClick={() => add()}
                            block
                        >
                            {t('assets.website_response_modify.add_modify_rule')}
                        </Button>
                    </Form.Item>
                </div>
            )}
        </Form.List>
    );
};

export default WebsiteModifyResponseView;
