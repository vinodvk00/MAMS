import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Select, Input, InputNumber, DatePicker, Typography } from 'antd';

const { Option } = Select;
const { Text } = Typography;

const ExpenditureForm = ({ visible, onCancel, onFinish, bases, equipmentTypes, assets }) => {
    const [form] = Form.useForm();
    const [availableQuantity, setAvailableQuantity] = useState(0);
    const [filteredBases, setFilteredBases] = useState(bases);

    const selectedBase = Form.useWatch('base', form);
    const selectedEquipmentType = Form.useWatch('equipmentType', form);

    const availableEquipmentTypes = useMemo(() => {
        const availableAssetTypeIds = new Set(
            assets
                .filter(asset => asset.status === 'AVAILABLE' && asset.quantity > 0)
                .map(asset => asset.equipmentType?._id)
        );
        return equipmentTypes.filter(type => availableAssetTypeIds.has(type._id));
    }, [assets, equipmentTypes]);

    useEffect(() => {
        if (selectedEquipmentType) {
            const availableBaseIds = new Set(
                assets
                    .filter(asset =>
                        asset.equipmentType?._id === selectedEquipmentType &&
                        asset.status === 'AVAILABLE' &&
                        asset.quantity > 0
                    )
                    .map(asset => asset.currentBase?._id)
            );

            const newFilteredBases = bases.filter(base => availableBaseIds.has(base._id));
            setFilteredBases(newFilteredBases);
            form.setFieldsValue({ base: undefined });
        } else {
            setFilteredBases(bases);
            form.setFieldsValue({ base: undefined });
        }
    }, [selectedEquipmentType, assets, bases, form]);


    useEffect(() => {
        if (selectedBase && selectedEquipmentType) {
            const quantity = assets
                .filter(asset => asset.currentBase?._id === selectedBase && asset.equipmentType?._id === selectedEquipmentType && asset.status === 'AVAILABLE')
                .reduce((sum, asset) => sum + (asset.quantity || 1), 0);
            setAvailableQuantity(quantity);
        } else {
            setAvailableQuantity(0);
        }
    }, [selectedBase, selectedEquipmentType, assets]);

    const handleOk = () => {
        form.validateFields()
            .then(values => {
                onFinish(values);
                form.resetFields();
            })
            .catch(info => {
                console.log('Validate Failed:', info);
            });
    };

    return (
        <Modal
            title="Create Expenditure"
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okText="Create"
            destroyOnClose
        >
            <Form form={form} layout="vertical" name="expenditureForm">
                <Form.Item
                    name="equipmentType"
                    label="Equipment Type"
                    rules={[{ required: true, message: 'Please select an equipment type!' }]}
                >
                    <Select placeholder="Select equipment type">
                        {availableEquipmentTypes.map((type) => (
                            <Option key={type._id} value={type._id}>
                                {type.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="base" label="Base" rules={[{ required: true, message: 'Please select a base!' }]}>
                    <Select placeholder="Select a base" disabled={!selectedEquipmentType}>
                        {filteredBases.map((base) => (
                            <Option key={base._id} value={base._id}>
                                {base.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="quantity"
                    label="Quantity"
                    rules={[
                        { required: true, message: 'Please input the quantity!' },
                        {
                            validator: (_, value) => {
                                if (value > availableQuantity) {
                                    return Promise.reject(new Error(`Quantity cannot exceed available stock of ${availableQuantity}`));
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
                <Text type="secondary">Available: {availableQuantity}</Text>
                <Form.Item
                    name="reason"
                    label="Reason"
                    rules={[{ required: true, message: 'Please select a reason!' }]}
                >
                    <Select placeholder="Select a reason">
                        <Option value="TRAINING">Training</Option>
                        <Option value="OPERATION">Operation</Option>
                        <Option value="MAINTENANCE">Maintenance</Option>
                        <Option value="DISPOSAL">Disposal</Option>
                        <Option value="OTHER">Other</Option>
                    </Select>
                </Form.Item>
                <Form.Item name="expenditureDate" label="Expenditure Date">
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name={['operationDetails', 'operationName']} label="Operation Name">
                    <Input />
                </Form.Item>
                <Form.Item name={['operationDetails', 'operationId']} label="Operation ID">
                    <Input />
                </Form.Item>
                <Form.Item name="notes" label="Notes">
                    <Input.TextArea />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ExpenditureForm;
