import {Form, Input, Modal} from 'antd';
import {useEffect} from 'react';

interface Props {
    title: string;
    value?: string;
    open: boolean;
    onOk: (prompt: string) => void;
    onCancel: () => void;
    label: string;
    placeholder: string;
    confirmLoading: boolean;
}

const PromptModal = ({
                         title,
                         open,
                         onOk,
                         onCancel,
                         label,
                         placeholder,
                     confirmLoading,
                     value
                 }: Props) => {
    const [form] = Form.useForm();
    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                'prompt': value
            });
        }
    }, [form, open, value]);
    return <div>
        <Modal title={title} open={open} onOk={() => {
            form.validateFields().then(async values => {
                onOk(values['prompt']);
            });
        }} onCancel={() => {
            onCancel();
        }} confirmLoading={confirmLoading}>
            <Form form={form} layout="vertical">
                <Form.Item name={'prompt'} label={label} required={true}>
                    <Input
                        placeholder={placeholder}
                        autoFocus={true} />
                </Form.Item>
            </Form>
        </Modal>
    </div>;
};
export default PromptModal;
