import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import axios from 'axios';

const ReportFormModal = ({ visible, onCancel, onSuccess, projectId }) => {
  const [form] = Form.useForm();

  // 当弹窗关闭时重置表单
  useEffect(() => {
    if (!visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const handleOk = async () => {
    if (!projectId) {
      message.error('未选择项目');
      return;
    }

    try {
      const values = await form.validateFields();
      const response = await axios.post('/api/report/addReport', {
        ...values,
        projectId
      });
      if (response.data.success) {
        message.success('上报成功');
        form.resetFields();
        onSuccess();
      } else {
        message.error('上报失败');
      }
    } catch (error) {
      console.error('上报错误:', error);
      message.error('上报失败: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <Modal
      open={visible}
      title="自主上报数据"
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="ip"
          label="IP地址"
          rules={[{ required: true, message: '请输入IP地址' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="userAgent"
          label="用户代理"
          rules={[{ required: true, message: '请输入用户代理' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="deviceInfo"
          label="设备信息"
          rules={[{ required: true, message: '请输入设备信息' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="location"
          label="位置"
          rules={[{ required: true, message: '请输入位置' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="version"
          label="版本"
          rules={[{ required: true, message: '请输入版本' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="remark"
          label="备注"
          rules={[{ required: true, message: '请输入备注' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleOk}>
            提交
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReportFormModal;