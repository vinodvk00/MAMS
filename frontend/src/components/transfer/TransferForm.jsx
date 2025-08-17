import React, { useState } from "react";
import { Form, Select, InputNumber, Input, Typography } from "antd";

const { Option } = Select;
const { Text } = Typography;

const TransferForm = ({ form, bases, availableAssets, user }) => {
    const [selectedAsset, setSelectedAsset] = useState(null);
    const otherBases = bases.filter(b => b._id !== user?.assignedBase);

    const handleAssetChange = assetId => {
        const asset = availableAssets.find(a => a._id === assetId);
        setSelectedAsset(asset);
        form.setFieldsValue({ quantity: 1 }); 
    };

    return (
        <Form form={form} layout='vertical' name='transferForm'>
            <Form.Item
                name='fromBaseId'
                label='From Base'
                rules={[
                    {
                        required: true,
                        message: "Please select the source base!",
                    },
                ]}
                initialValue={
                    user?.role === "base_commander"
                        ? user.assignedBase
                        : undefined
                }
            >
                <Select
                    placeholder='Select source base'
                    disabled={user?.role === "base_commander"}
                >
                    {bases.map(base => (
                        <Option key={base._id} value={base._id}>
                            {base.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                name='toBaseId'
                label='To Base'
                rules={[
                    {
                        required: true,
                        message: "Please select the destination base!",
                    },
                ]}
            >
                <Select placeholder='Select destination base'>
                    {otherBases.map(base => (
                        <Option key={base._id} value={base._id}>
                            {base.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                name='assetId'
                label='Asset to Transfer'
                rules={[{ required: true, message: "Please select an asset!" }]}
            >
                <Select
                    placeholder='Select an available asset'
                    showSearch
                    optionFilterProp='children'
                    onChange={handleAssetChange}
                >
                    {availableAssets.map(asset => (
                        <Option key={asset._id} value={asset._id}>
                            {asset.serialNumber} - {asset.equipmentType?.name}{" "}
                            (Qty: {asset.quantity})
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            {selectedAsset && (
                <Form.Item
                    name='quantity'
                    label='Quantity to Transfer'
                    rules={[
                        {
                            required: true,
                            message: "Please input the quantity!",
                        },
                        {
                            type: "number",
                            min: 1,
                            message: "Quantity must be at least 1",
                        },
                        {
                            type: "number",
                            max: selectedAsset.quantity,
                            message: `Cannot exceed available quantity of ${selectedAsset.quantity}`,
                        },
                    ]}
                >
                    <InputNumber
                        min={1}
                        max={selectedAsset.quantity}
                        style={{ width: "100%" }}
                    />
                </Form.Item>
            )}

            <Form.Item name='transportDetails' label='Transport Details'>
                <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name='notes' label='Notes'>
                <Input.TextArea rows={2} />
            </Form.Item>
        </Form>
    );
};

export default TransferForm;
