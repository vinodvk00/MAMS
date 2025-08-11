import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Select, Switch, Typography, Space } from 'antd';

const { Option } = Select;
const { Text } = Typography;

const CATEGORY_OPTIONS = ["WEAPON", "VEHICLE", "AMMUNITION", "EQUIPMENT", "OTHER"];

const EquipmentForm = ({ visible, onCancel, onFinish, initialData }) => {
    const [form] = Form.useForm();
    const isEditing = !!initialData;

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue(initialData);
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
            title={isEditing ? 'Edit Equipment Type' : 'Add Equipment Type'}
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} autoComplete="off">
                <Form.Item
                    name="name"
                    label="Equipment Name"
                    rules={[{ required: true, message: 'Please enter the equipment name' }]}
                >
                    <Input placeholder="e.g., M4A1 Carbine" />
                </Form.Item>

                <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: 'Please select a category' }]}
                >
                    <Select placeholder="Select a category">
                        {CATEGORY_OPTIONS.map(category => (
                            <Option key={category} value={category}>
                                {category}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="code"
                    label="Equipment Code"
                    rules={[{ required: true, message: 'Please enter a unique equipment code' }]}
                >
                    <Input placeholder="e.g., WPN-M4A1" />
                </Form.Item>

                <Form.Item name="description" label="Description">
                    <Input.TextArea rows={3} placeholder="A brief description of the equipment" />
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

export default EquipmentForm;
