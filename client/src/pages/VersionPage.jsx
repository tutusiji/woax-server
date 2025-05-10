import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Descriptions, message, Space, Card, Typography, Form, Input, Upload, Switch } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const VersionPage = () => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  // 获取版本列表
  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/version');
      if (response.data.success) {
        setVersions(response.data.data);
      } else {
        message.error('获取版本列表失败');
      }
    } catch (error) {
      console.error('获取版本列表错误:', error);
      message.error('获取版本列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看详情
  const handleViewDetails = (record) => {
    setSelectedVersion(record);
    setIsModalVisible(true);
    form.setFieldsValue({
      isActive: record.isActive,
      description: record.description || ''
    });
  };

  // 更新版本状态
  const handleUpdateVersion = async () => {
    try {
      const values = await form.validateFields();
      const response = await axios.put(`/api/version/${selectedVersion._id}`, values);
      
      if (response.data.success) {
        message.success('更新成功');
        setIsModalVisible(false);
        fetchVersions(); // 重新加载数据
      } else {
        message.error('更新失败');
      }
    } catch (error) {
      console.error('更新错误:', error);
      message.error('更新失败');
    }
  };

  // 删除版本
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/api/version/${id}`);
      if (response.data.success) {
        message.success('删除成功');
        fetchVersions(); // 重新加载数据
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除错误:', error);
      message.error('删除失败');
    }
  };

  // 上传新版本
  const handleUploadVersion = async () => {
    try {
      const values = await uploadForm.validateFields();
      if (!values.versionNumber || !values.description || !values.publishedBy) {
        message.error('请填写所有必填字段');
        return;
      }
      if (fileList.length === 0) {
        message.error('请上传安装包文件');
        return;
      }
      const formData = new FormData();
      formData.append('versionNumber', values.versionNumber);
      formData.append('description', values.description);
      formData.append('publishedBy', values.publishedBy);
      formData.append('file', fileList[0].originFileObj);
      const response = await axios.post('/api/version/publish', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        message.success('新版本发布成功');
        setIsUploadModalVisible(false);
        uploadForm.resetFields();
        setFileList([]);
        fetchVersions(); // 重新加载数据
      } else {
        message.error('新版本发布失败');
      }
    } catch (error) {
      console.error('上传错误:', error);
      message.error('新版本发布失败');
    }
  };

  // 文件上传配置
  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      setFileList([file]);
      return false; // 阻止自动上传
    },
    fileList,
  };

  // 初始加载数据
  useEffect(() => {
    fetchVersions();
  }, []);

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 表格列定义
  const columns = [
    {
      title: '版本号',
      dataIndex: 'versionNumber',
      key: 'versionNumber',
    },
    {
      title: '发布日期',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size) => formatFileSize(size),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => isActive ? '激活' : '未激活',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => handleViewDetails(record)}>查看</Button>
          <Button danger onClick={() => handleDelete(record._id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card className="shadow-xl ">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={2}>版本更新管理</Title>
          <Button type="primary" onClick={() => setIsUploadModalVisible(true)}>发布新版本</Button>
        </div>
        <Table 
          columns={columns} 
          dataSource={versions} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="版本详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleUpdateVersion}>更新</Button>
        ]}
        width={700}
      >
        {selectedVersion && (
          <>
            <Descriptions bordered column={1} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="版本号">{selectedVersion.versionNumber}</Descriptions.Item>
              <Descriptions.Item label="发布日期">{new Date(selectedVersion.releaseDate).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="文件名">{selectedVersion.fileName}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{formatFileSize(selectedVersion.fileSize)}</Descriptions.Item>
              <Descriptions.Item label="下载链接">
                <a href={selectedVersion.downloadLink} target="_blank" rel="noopener noreferrer">
                  {selectedVersion.downloadLink}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="发布者">{selectedVersion.publishedBy}</Descriptions.Item>
            </Descriptions>
            
            <Form form={form} layout="vertical">
              <Form.Item name="isActive" label="激活状态" valuePropName="checked">
                <Switch checkedChildren="激活" unCheckedChildren="未激活" />
              </Form.Item>
              <Form.Item name="description" label="版本描述">
                <TextArea rows={4} placeholder="输入版本描述" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* 上传新版本弹窗 */}
      <Modal
        title="发布新版本"
        open={isUploadModalVisible}
        onCancel={() => setIsUploadModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsUploadModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleUploadVersion}>发布</Button>
        ]}
        width={700}
      >
        <Form form={uploadForm} layout="vertical" className="version-form">
          <Form.Item 
            name="versionNumber" 
            label="版本号" 
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="请输入版本号，例如：1.0.0" />
          </Form.Item>
          <Form.Item 
            name="publishedBy" 
            label="发布者"
            rules={[{ required: true, message: '请输入发布者' }]}
          >
            <Input placeholder="请输入发布者姓名" />
          </Form.Item>
          <Form.Item 
            name="description" 
            label="版本描述" 
            rules={[{ required: true, message: '请输入版本描述' }]}
          >
            <TextArea rows={4} placeholder="请输入版本描述，包括新功能、修复的问题等" />
          </Form.Item>
          <Form.Item 
            label="上传安装包"
            rules={[{ required: true, message: '请上传安装包文件' }]}
          >
            <Dragger {...uploadProps} className="upload-area">
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">支持单个文件上传，请上传应用安装包</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VersionPage;