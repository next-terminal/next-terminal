import { Form, Input, Modal } from 'antd';
import { useTranslation } from "react-i18next";
interface Props {
  open: boolean;
  parameters: string[];
  handleOk: (values: any) => void;
  handleCancel: () => void;
  confirmLoading: boolean;
}
const GuacdRequiredParameters = ({
  open,
  parameters,
  confirmLoading,
  handleCancel,
  handleOk
}: Props) => {
  let {
    t
  } = useTranslation();
  const [form] = Form.useForm();
  return <Modal title={t('access.required_auth')} mask={{
    closable: false
  }} open={open} onOk={() => {
    form.validateFields().then(async values => {
      handleOk(values);
    });
  }} confirmLoading={confirmLoading} onCancel={() => {
    handleCancel();
  }}>
            <Form form={form} layout="vertical">
                {parameters?.map(parameter => {
        if (parameter == 'password') {
          return <Form.Item key={parameter} label={t(parameter)} name={parameter}>
    <Input.Password />
          </Form.Item>;
        } else {
          return <Form.Item key={parameter} label={t(parameter)} name={parameter}>
    <Input />
          </Form.Item>;
        }
      })}
            </Form>
        </Modal>;
};
export default GuacdRequiredParameters;
