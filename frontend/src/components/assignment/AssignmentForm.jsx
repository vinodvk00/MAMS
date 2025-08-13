import React from 'react';
import { Form, Select, DatePicker, Input } from 'antd';

const { Option } = Select;

const AssignmentForm = ({ form, assets, users }) => {
    return (
        <Form form={form} layout="vertical" name="assignmentForm">
            <Form.Item
                name="assetId"
                label="Asset"
                rules={[{ required: true, message: 'Please select an asset!' }]}
            >
                <Select placeholder="Select an available asset">
                    {assets.map((asset) => (
                        <Option key={asset._id} value={asset._id}>
                            {asset.equipmentType?.name} ({asset.serialNumber})
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                name="assignedToUserId"
                label="Assign To"
                rules={[{ required: true, message: 'Please select a user!' }]}
            >
                <Select placeholder="Select a user">
                    {users.map((user) => (
                        <Option key={user._id} value={user._id}>
                            {user.fullname} ({user.username})
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item name="assignmentDate" label="Assignment Date">
                <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="expectedReturnDate" label="Expected Return Date">
                <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="purpose" label="Purpose">
                <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={2} />
            </Form.Item>
        </Form>
    );
};

export default AssignmentForm;