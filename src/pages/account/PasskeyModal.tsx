import {useFormRequest} from "@/hook/use-antd-form-query";
import {Form, Input, Modal} from "antd";
import {useTranslation} from "react-i18next";
import {WebauthnCredential} from "@/api/account-api";

export interface Props {
    open: boolean;
    handleOk: (values: any) => void;
    handleCancel: () => void;
    confirmLoading: boolean;
    credential?: WebauthnCredential;
}

const PasskeyModal = ({
                          open,
                          handleOk,
                          handleCancel,
                          confirmLoading,
                          credential
                      }: Props) => {
    let {t} = useTranslation();
    const [form] = Form.useForm();
    const get = async () => {
        return credential ?? {};
    };
    useFormRequest(form, ["form-request", "web/src/pages/account/PasskeyModal.tsx", open, credential?.id], get, {enabled: open});
    return <Modal title={''}
                  open={open} mask={{closable: false}}
                  destroyOnHidden={true}
                  onOk={() => {
                      form.validateFields().then(async values => {
                          handleOk(values);
                      });
                  }}
                  onCancel={() => {
                      handleCancel();
                  }}
                  confirmLoading={confirmLoading}>

        <Form form={form} clearOnDestroy={true} layout="vertical">
            <Form.Item hidden={true} name={'id'}>
                <Input/>
            </Form.Item>
            <Form.Item name={'name'} label={t('general.name')} required={true}>
                <Input/>
            </Form.Item>
        </Form>
    </Modal>;
};
export default PasskeyModal;
