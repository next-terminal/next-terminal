import QuerySelect from "@/components/QuerySelect";
import oidcClientApi from "@/api/oidc-client-api";
import departmentApi from "@/api/department-api";
import userApi from "@/api/user-api";
import {useFormRequest} from "@/hook/use-antd-form-query";
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import {useQuery} from "@tanstack/react-query";
import React from "react";
import {Button, Checkbox, Form, FormInstance, Input, Modal, Radio, TreeSelect} from "antd";
import {useTranslation} from "react-i18next";

export interface OidcClientModalProps {
    visible: boolean;
    onOk: (values: any) => void;
    onCancel: () => void;
    confirmLoading: boolean;
    id: string | undefined;
}

interface RedirectUriItem {
    url?: string;
}

interface OidcClientFormValues {
    id?: string;
    name?: string;
    clientId?: string;
    redirectUris?: RedirectUriItem[];
    grantTypes?: string[];
    scopes?: string[];
    accessControl?: "all" | "department" | "user";
    boundUserIds?: string[];
    boundDepartmentIds?: string[];
    skipConsent?: boolean;
    description?: string;
}

const defaultFormValues: OidcClientFormValues = {
    grantTypes: ["authorization_code", "refresh_token"],
    scopes: ["openid", "profile", "email"],
    redirectUris: [],
    accessControl: "all",
    skipConsent: false,
};

const toRedirectUriItems = (redirectUris?: string[]) => {
    return (redirectUris || []).map(url => ({url}));
};

const toRedirectUriValues = (redirectUris?: RedirectUriItem[]) => {
    return (redirectUris || [])
        .map(item => (item?.url || "").trim())
        .filter(Boolean);
};

const OidcClientModal = ({
    visible,
    onOk,
    onCancel,
    confirmLoading,
    id,
}: OidcClientModalProps) => {
    const [form] = Form.useForm();
    const {t} = useTranslation();
    const departmentTreeQuery = useQuery({
        queryKey: ["department-tree"],
        queryFn: () => departmentApi.getTree(),
        enabled: visible,
    });

    const grantTypeOptions = [
        {
            label: "Authorization Code",
            value: "authorization_code",
        },
        {
            label: "Refresh Token",
            value: "refresh_token",
        },
        {
            label: "Client Credentials",
            value: "client_credentials",
        },
    ];

    const scopeOptions = [
        {
            label: "OpenID",
            value: "openid",
        },
        {
            label: "Profile",
            value: "profile",
        },
        {
            label: "Email",
            value: "email",
        },
        {
            label: "Phone",
            value: "phone",
        },
        {
            label: "Offline Access",
            value: "offline_access",
        },
    ];

    const accessControlOptions = [
        {
            label: t("identity.oidc_client.access_all_users"),
            value: "all",
        },
        {
            label: t("identity.oidc_client.access_departments"),
            value: "department",
        },
        {
            label: t("identity.oidc_client.access_users"),
            value: "user",
        },
    ];

    const get = async () => {
        if (!id) {
            return defaultFormValues;
        }

        const client = await oidcClientApi.getById(id);
        return {
            ...client,
            redirectUris: toRedirectUriItems(client.redirectUris),
            accessControl: client.accessControl || "all",
        };
    };

    const handleSubmit = async (values: OidcClientFormValues) => {
        await onOk({
            ...values,
            redirectUris: toRedirectUriValues(values.redirectUris),
        });
    };

    const filterOptionByLabel = (input: string, option?: {label?: React.ReactNode}) => {
        return String(option?.label ?? "").toLowerCase().includes(input.toLowerCase());
    };

    const renderBoundUserField = () => {
        return (
            <Form.Item
                name="boundUserIds"
                label={t("identity.oidc_client.bound_users")}
                rules={[
                    {
                        required: true,
                        message: t("identity.oidc_client.bound_users_required"),
                    },
                ]}
            >
                <QuerySelect
                    mode="multiple"
                    showSearch={{filterOption: filterOptionByLabel}}
                    placeholder={t("identity.oidc_client.bound_users_placeholder")}
                    request={async () => {
                        const users = await userApi.getAll();
                        return users.map((user: any) => ({
                            label: `${user.nickname} (${user.username})`,
                            value: user.id,
                        }));
                    }}
                />
            </Form.Item>
        );
    };

    const renderBoundDepartmentField = () => {
        return (
            <Form.Item
                name="boundDepartmentIds"
                label={t("identity.oidc_client.bound_departments")}
                rules={[
                    {
                        required: true,
                        message: t("identity.oidc_client.bound_departments_required"),
                    },
                ]}
            >
                <TreeSelect
                    allowClear={true}
                    multiple={true}
                    showSearch={true}
                    treeDefaultExpandAll={true}
                    treeData={departmentTreeQuery.data || []}
                    treeNodeFilterProp="title"
                    loading={departmentTreeQuery.isFetching}
                    placeholder={t("identity.oidc_client.bound_departments_placeholder")}
                />
            </Form.Item>
        );
    };

    const renderAccessControlFields = (form: FormInstance) => {
        const accessControl = form.getFieldValue("accessControl");

        if (accessControl === "user") {
            return renderBoundUserField();
        }

        if (accessControl === "department") {
            return renderBoundDepartmentField();
        }

        return null;
    };

    const renderRedirectUriFields = () => {
        return (
            <Form.Item label={t("identity.oidc_client.redirect_uris")} required={true}>
                <Form.List
                    name="redirectUris"
                    rules={[
                        {
                            validator: async (_, value) => {
                                if (!value || value.length === 0) {
                                    return Promise.reject(
                                        new Error(t("identity.oidc_client.redirect_uris_required")),
                                    );
                                }

                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    {(fields, {add, remove}, {errors}) => (
                        <>
                            {fields.map(field => (
                                <div
                                    key={field.key}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 8,
                                        width: "100%",
                                    }}
                                >
                                    <Form.Item
                                        {...field}
                                        name={[field.name, "url"]}
                                        rules={[
                                            {
                                                required: true,
                                                message: t("identity.oidc_client.redirect_uri_required"),
                                            },
                                            {
                                                type: "url",
                                                message: t("general.invalid_url"),
                                            },
                                        ]}
                                        style={{
                                            flex: 1,
                                            marginBottom: 12,
                                        }}
                                    >
                                        <Input
                                            placeholder="https://example.com/callback"
                                            style={{width: "100%"}}
                                        />
                                    </Form.Item>
                                    <Button
                                        danger={true}
                                        type="text"
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => remove(field.name)}
                                        aria-label={t("actions.delete")}
                                        title={t("actions.delete")}
                                    />
                                </div>
                            ))}
                            <Form.ErrorList errors={errors} />
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={() => add({url: ""})}
                                block={true}
                            >
                                {t("identity.oidc_client.redirect_uris_add")}
                            </Button>
                        </>
                    )}
                </Form.List>
            </Form.Item>
        );
    };

    useFormRequest(
        form,
        ["form-request", "web/src/pages/identity/OidcClientModal.tsx", visible, id],
        get,
        {enabled: visible},
    );

    return (
        <Modal
            title={id ? t("actions.edit") : t("actions.new")}
            open={visible}
            mask={{closable: false}}
            destroyOnHidden={true}
            onOk={() => {
                form.validateFields().then(handleSubmit);
            }}
            onCancel={onCancel}
            confirmLoading={confirmLoading}
            centered={true}
        >
            <Form form={form} clearOnDestroy={true} layout="vertical">
                <Form.Item hidden={true} name="id">
                    <Input />
                </Form.Item>

                <Form.Item
                    name="name"
                    label={t("general.name")}
                    rules={[
                        {
                            required: true,
                            message: t("identity.oidc_client.name_required"),
                        },
                    ]}
                >
                    <Input placeholder={t("identity.oidc_client.name_placeholder")} />
                </Form.Item>

                <Form.Item
                    name="clientId"
                    label={t("identity.oidc_client.client_id_label")}
                    rules={[
                        {
                            required: true,
                            message: t("identity.oidc_client.client_id_required"),
                        },
                    ]}
                    tooltip={id ? t("identity.oidc_client.client_id_tooltip") : undefined}
                >
                    <Input
                        disabled={!!id}
                        placeholder={t("identity.oidc_client.client_id_placeholder")}
                    />
                </Form.Item>

                {renderRedirectUriFields()}

                <Form.Item
                    name="grantTypes"
                    label={t("identity.oidc_client.grant_types")}
                    rules={[
                        {
                            required: true,
                            message: t("identity.oidc_client.grant_types_required"),
                        },
                    ]}
                >
                    <Checkbox.Group options={grantTypeOptions} />
                </Form.Item>

                <Form.Item
                    name="scopes"
                    label={t("identity.oidc_client.scopes")}
                    rules={[
                        {
                            required: true,
                            message: t("identity.oidc_client.scopes_required"),
                        },
                    ]}
                >
                    <Checkbox.Group options={scopeOptions} />
                </Form.Item>

                <Form.Item
                    name="accessControl"
                    label={t("identity.oidc_client.access_control")}
                    tooltip={t("identity.oidc_client.access_control_tip")}
                    initialValue="all"
                >
                    <Radio.Group options={accessControlOptions} />
                </Form.Item>

                <Form.Item noStyle={true} shouldUpdate={true}>
                    {renderAccessControlFields}
                </Form.Item>

                <Form.Item
                    name="skipConsent"
                    label={t("identity.oidc_client.skip_consent")}
                    valuePropName="checked"
                    initialValue={false}
                    tooltip={t("identity.oidc_client.skip_consent_tip")}
                >
                    <Checkbox>{t("identity.oidc_client.skip_consent_enabled")}</Checkbox>
                </Form.Item>

                <Form.Item name="description" label={t("general.description")}>
                    <Input.TextArea
                        rows={3}
                        placeholder={t("identity.oidc_client.description_placeholder")}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default OidcClientModal;
