import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Select, Switch, Typography, Space } from 'antd';

const { Option } = Select;
const { Text } = Typography;

const BaseForm = ({ visible, onCancel, onFinish, initialData, users }) => {
    const [form] = Form.useForm();
    const isEditing = !!initialData;

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
                commander: initialData.commander?._id,
            });
        } else {
            form.setFieldsValue({ isActive: true });
        }
    }, [initialData, form]);

    const handleFinish = (values) => {
        onFinish(values);
        form.resetFields();
    };

    return (
        <Modal
            title={isEditing ? 'Edit Base' : 'Add Base'}
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} autoComplete="off">
                <Form.Item
                    name="name"
                    label="Base Name"
                    rules={[{ required: true, message: 'Please enter the base name' }]}
                >
                    <Input placeholder="e.g., Fort Liberty" />
                </Form.Item>

                <Form.Item
                    name="code"
                    label="Base Code"
                    rules={[{ required: true, message: 'Please enter a unique base code' }]}
                >
                    <Input placeholder="e.g., FTL001" />
                </Form.Item>

                <Form.Item
                    name="location"
                    label="Location"
                    rules={[{ required: true, message: 'Please enter the location' }]}
                >
                    <Input placeholder="e.g., North Carolina, USA" />
                </Form.Item>

                <Form.Item
                    name="commander"
                    label="Commander"
                >
                    <Select placeholder="Select a commander" allowClear>
                        {users.map(user => (
                            <Option key={user._id} value={user._id}>
                                {user.fullname}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>


                <Form.Item name="contactInfo" label="Contact Information">
                    <Input.TextArea rows={3} placeholder="A brief description of the base" />
                </Form.Item>

                <Form.Item name="isActive" label="Status" valuePropName="checked">
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        {isEditing && initialData.updatedAt && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Last updated: {new Date(initialData.updatedAt).toLocaleString()}
                            </Text>
                        )}
                    </div>
                    <Space>
                        <Button onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {isEditing ? 'Update' : 'Create'}
                        </Button>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
};

export default BaseForm;