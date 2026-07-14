import QuerySelect from "@/components/QuerySelect";
import agentGatewayApi from "@/api/agent-gateway-api";
import gatewayGroupApi from "@/api/gateway-group-api";
import sshGatewayApi from "@/api/ssh-gateway-api";
import {Button, Form, Select, Space} from "antd";
import {ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon} from "lucide-react";
import {useTranslation} from "react-i18next";
import type {GatewayHop} from "@/api/gateway-chain";

interface GatewayChainEditorProps {
    name?: string;
    disabled?: boolean;
}

const GatewayChainEditor = ({name = 'gatewayChain', disabled}: GatewayChainEditorProps) => {
    const {t} = useTranslation();
    const form = Form.useFormInstance();
    const gatewayChain = Form.useWatch(name, form) || [];

    if (disabled) {
        return null;
    }

    const sshGatewayRequest = async () => {
        const items = await sshGatewayApi.getAll();
        return items.map(item => ({
            label: item.name,
            value: item.id
        }));
    };

    const agentGatewayRequest = async () => {
        const items = await agentGatewayApi.getAll();
        return items.map(item => ({
            label: item.name,
            value: item.id
        }));
    };

    const gatewayGroupRequest = async () => {
        const items = await gatewayGroupApi.getAll();
        return items.map(item => ({
            label: item.name,
            value: item.id
        }));
    };

    const gatewayRequest = (gatewayType?: string) => {
        switch (gatewayType) {
            case 'ssh':
                return sshGatewayRequest;
            case 'agent':
                return agentGatewayRequest;
            case 'group':
                return gatewayGroupRequest;
            default:
                return undefined;
        }
    };

    const gatewayLabel = (gatewayType?: string) => {
        switch (gatewayType) {
            case 'ssh':
                return t('menus.gateway.submenus.ssh_gateway');
            case 'agent':
                return t('menus.gateway.submenus.agent_gateway');
            case 'group':
                return t('menus.gateway.submenus.gateway_group');
            default:
                return t('assets.gateway');
        }
    };

    const canMoveGateway = (from: number, to: number) => {
        if (to < 0 || to >= gatewayChain.length) {
            return false;
        }
        const next = [...gatewayChain] as GatewayHop[];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next.every((hop, index) => index === 0 || hop?.gatewayType === 'ssh');
    };

    return (
        <Form.Item label={t('assets.gateway')}>
            <Form.List name={name}>
                {(fields, {add, remove, move}) => (
                    <Space direction="vertical" className="w-full" size={8}>
                        {fields.map((field, index) => {
                            const gatewayType = gatewayChain?.[field.name]?.gatewayType;
                            const canMoveUp = index > 0 && canMoveGateway(index, index - 1);
                            const canMoveDown = index < fields.length - 1 && canMoveGateway(index, index + 1);
                            return (
                                <Space.Compact key={field.key} className="w-full">
                                    <Form.Item
                                        name={[field.name, 'gatewayType']}
                                        className="mb-0 flex-1"
                                        rules={[
                                            {required: true},
                                            {
                                                validator: async (_, value) => {
                                                    if (index > 0 && value !== 'ssh') {
                                                        throw new Error(t('assets.ssh_gateway_required_after_first_hop'));
                                                    }
                                                }
                                            }
                                        ]}
                                    >
                                        <Select
                                            options={[
                                                {label: t('menus.gateway.submenus.ssh_gateway'), value: 'ssh'},
                                                {label: t('menus.gateway.submenus.agent_gateway'), value: 'agent', disabled: index > 0},
                                                {label: t('menus.gateway.submenus.gateway_group'), value: 'group', disabled: index > 0},
                                            ]}
                                            onChange={(value) => {
                                                const next = [...gatewayChain];
                                                if (next[field.name]) {
                                                    next[field.name] = {...next[field.name], gatewayType: value, gatewayId: undefined};
                                                    form.setFieldValue(name, next);
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name={[field.name, 'gatewayId']}
                                        className="mb-0 flex-[2]"
                                        rules={[{required: true}]}
                                    >
                                        <QuerySelect
                                            showSearch
                                            disabled={!gatewayType}
                                            placeholder={gatewayLabel(gatewayType)}
                                            params={{gatewayType}}
                                            request={gatewayRequest(gatewayType)}
                                        />
                                    </Form.Item>
                                    <Button
                                        icon={<ArrowUpIcon size={16}/>}
                                        disabled={!canMoveUp}
                                        onClick={() => move(index, index - 1)}
                                    />
                                    <Button
                                        icon={<ArrowDownIcon size={16}/>}
                                        disabled={!canMoveDown}
                                        onClick={() => move(index, index + 1)}
                                    />
                                    <Button
                                        danger
                                        icon={<Trash2Icon size={16}/>}
                                        onClick={() => remove(field.name)}
                                    />
                                </Space.Compact>
                            );
                        })}
                        <Button
                            icon={<PlusIcon size={16}/>}
                            onClick={() => add({gatewayType: 'ssh', gatewayId: undefined})}
                        >
                            {t('actions.add')}
                        </Button>
                    </Space>
                )}
            </Form.List>
        </Form.Item>
    );
};

export default GatewayChainEditor;
