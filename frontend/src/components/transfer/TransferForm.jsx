import React from 'react';
import { Form, Select, InputNumber, Input } from 'antd';

const { Option } = Select;

const TransferForm = ({ form, bases, equipmentTypes, user }) => {
    const otherBases = bases.filter(b => b._id !== user?.assignedBase);

    return (
        <Form form={form} layout="vertical" name="transferForm">
            <Form.Item
                name="fromBaseId"
                label="From Base"
                rules={[{ required: true, message: 'Please select the source base!' }]}
                initialValue={user?.role === 'base_commander' ? user.assignedBase : undefined}
            >
                <Select
                    placeholder="Select source base"
                    disabled={user?.role === 'base_commander'}
                >
                    {bases.map((base) => (
                        <Option key={base._id} value={base._id}>
                            {base.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                name="toBaseId"
                label="To Base"
                rules={[{ required: true, message: 'Please select the destination base!' }]}
            >
                <Select placeholder="Select destination base">
                    {otherBases.map((base) => (
                        <Option key={base._id} value={base._id}>
                            {base.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                name="equipmentTypeId"
                label="Equipment Type"
                rules={[{ required: true, message: 'Please select an equipment type!' }]}
            >
                <Select placeholder="Select equipment type">
                    {equipmentTypes.map((type) => (
                        <Option key={type._id} value={type._id}>
                            {type.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                name="totalQuantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please input the quantity!' }]}
            >
                <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="transportDetails" label="Transport Details">
                <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={2} />
            </Form.Item>
        </Form>
    );
};

export default TransferForm;