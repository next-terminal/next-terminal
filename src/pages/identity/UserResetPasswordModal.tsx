import { Form, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";
export interface Props {
  open: boolean;
  handleOk: (values: any) => void;
  handleCancel: () => void;
  confirmLoading: boolean;
}
const UserResetPasswordModal = ({
  open,
  handleOk,
  handleCancel,
  confirmLoading
}: Props) => {
  const [form] = Form.useForm();
  let {
    t
  } = useTranslation();
  return <Modal title={t('identity.user.reset_password.confirm_title')} open={open} mask={{
    closable: false
  }} destroyOnHidden={true} onOk={() => {
    form.validateFields().then(async values => {
      handleOk(values);
    });
  }} onCancel={() => {
    handleCancel();
  }} confirmLoading={confirmLoading}>

            <Form form={form} layout="vertical">
                <Form.Item name={'password'} label={t('assets.password')} rules={[{
        pattern: /^\S*$/,
        message: t('identity.user.no_spaces_allowed')
      }]} extra={t('identity.user.reset_password.confirm_content')}>
    <Input />
      </Form.Item>
            </Form>
        </Modal>;
};
export default UserResetPasswordModal;
