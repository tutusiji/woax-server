import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Descriptions,
  message,
  Space,
  Card,
  Typography,
  Form,
  Input,
  Upload,
  Badge,
  Tooltip,
} from "antd";
import moment from "moment";
import { InboxOutlined } from "@ant-design/icons";
import axios from "axios";
import AuthButton from "../components/AuthButton";

const { Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const VersionPage = ({ currentProject }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [submitForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 监听项目变化
  useEffect(() => {
    if (currentProject) {
      fetchVersions();
    } else {
      setVersions([]);
    }
  }, [currentProject]);

  // 监听项目变化事件
  useEffect(() => {
    const handleProjectChange = () => {
      fetchVersions();
    };

    window.addEventListener('projectChanged', handleProjectChange);
    return () => {
      window.removeEventListener('projectChanged', handleProjectChange);
    };
  }, []);

  // 获取版本列表
  const fetchVersions = async () => {
    if (!currentProject) return;
    
    setLoading(true);
    try {
      const response = await axios.get('/api/version', {
        params: {
          projectId: currentProject._id
        }
      });
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

  // 更新状态
  const handleUpdateStatus = async () => {
    try {
      const values = await form.validateFields();
      const response = await axios.put(`/api/version/${selectedVersion._id}`, {
        status: values.status
      });
      
      if (response.data.success) {
        message.success('状态更新成功');
        setIsModalVisible(false);
        fetchVersions(); // 重新加载数据
      } else {
        message.error('状态更新失败');
      }
    } catch (error) {
      console.error('更新状态错误:', error);
      message.error('状态更新失败');
    }
  };

  // 删除版本
  const handleDelete = async (record) => {
    try {
      Modal.confirm({
        title: "确认删除",
        content: "确定要删除这个版本吗？",
        onOk: async () => {
          try {
            const response = await axios.delete(`/api/version/${record._id}`);
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
        }
      });
    } catch (error) {
      console.error('删除错误:', error);
      message.error('删除失败');
    }
  };

  // 设为最新版本
  const handleSetLatest = async (record) => {
    try {
      const response = await axios.put(`/api/version/set-latest/${record._id}`);
      if (response.data.success) {
        message.success('已将此版本设为最新版本');
        fetchVersions(); // 重新加载数据
      } else {
        message.error('设置最新版本失败');
      }
    } catch (error) {
      console.error('设置最新版本错误:', error);
      message.error('设置最新版本失败');
    }
  };

  // 上传新版本
  const handleUploadVersion = async () => {
    if (!currentProject) {
      message.error('未选择项目');
      return;
    }
    
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
      formData.append('projectId', currentProject._id);
      
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

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取状态徽章
  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <Badge status="warning" text="草稿" />;
      case 'published':
        return <Badge status="success" text="已发布" />;
      case 'deprecated':
        return <Badge status="error" text="已弃用" />;
      default:
        return <Badge status="default" text="未知" />;
    }
  };

  // 处理表格变化
  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
  };

  // 处理文件变化
  const handleFileChange = (info) => {
    let fileList = [...info.fileList];
    // 限制只能上传一个文件
    fileList = fileList.slice(-1);
    setFileList(fileList);
  };

  // 处理下载
  const handleDownload = (record) => {
    if (!record.downloadUrl) {
      message.error('下载链接不存在');
      return;
    }
    
    try {
      // 创建下载链接
      const link = document.createElement('a');
      link.href = record.downloadUrl; // 使用完整的URL
      
      // 使用原始文件名作为下载文件名
      if (record.originalFileName) {
        link.download = record.originalFileName;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('下载错误:', error);
      message.error('下载失败');
    }
  };

  // 提交新版本
  const handleSubmitVersion = async () => {
    try {
      const values = await submitForm.validateFields();
      if (!values.version || !values.description) {
        message.error('请填写所有必填字段');
        return;
      }
      if (fileList.length === 0) {
        message.error('请上传安装包文件');
        return;
      }
      
      const formData = new FormData();
      formData.append('versionNumber', values.version);
      formData.append('description', values.description);
      formData.append('publishedBy', 'Admin'); // 默认发布者
      formData.append('file', fileList[0].originFileObj);
      formData.append('projectId', currentProject._id);
      
      const response = await axios.post('/api/version/publish', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        message.success('新版本发布成功');
        setIsSubmitModalVisible(false);
        submitForm.resetFields();
        setFileList([]);
        fetchVersions(); // 重新加载数据
      } else {
        message.error('新版本发布失败');
      }
    } catch (error) {
      console.error('提交错误:', error);
      message.error('新版本发布失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: "版本号",
      dataIndex: "versionNumber",
      key: "versionNumber",
      width: 120,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "文件名",
      dataIndex: "originalFileName",
      key: "originalFileName",
      ellipsis: true,
      render: (text) => text || "-",
    },
    {
      title: "文件大小",
      dataIndex: "fileSize",
      key: "fileSize",
      width: 120,
      render: (size) => (size ? formatFileSize(size) : "-"),
    },
    {
      title: "发布时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (timestamp) => moment(timestamp).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => getStatusBadge(status),
    },
    {
      title: "操作",
      key: "action",
      width: 300,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            查看
          </Button>
          {record.downloadUrl && (
            <Button
              type="link"
              size="small"
              onClick={() => handleDownload(record)}
            >
              下载
            </Button>
          )}
          <AuthButton
            type="link"
            size="small"
            onClick={() => handleSetLatest(record)}
            tooltip="需要管理员权限才能设置最新版本"
          >
            设为最新
          </AuthButton>
          <AuthButton
            type="link"
            size="small"
            danger
            onClick={() => handleDelete(record)}
            tooltip="需要管理员权限才能删除版本"
          >
            删除
          </AuthButton>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <Title level={4}>版本更新</Title>
          <AuthButton
            type="primary"
            onClick={() => setIsSubmitModalVisible(true)}
            disabled={!currentProject}
            tooltip="需要管理员权限才能发布新版本"
          >
            发布新版本
          </AuthButton>
        </div>

        <Table
          columns={columns}
          dataSource={versions}
          rowKey="_id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="版本详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedVersion && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="版本号">
                {selectedVersion.versionNumber}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {new Date(selectedVersion.timestamp).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {selectedVersion.description}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusBadge(selectedVersion.status)}
              </Descriptions.Item>
              {selectedVersion.downloadUrl && (
                <Descriptions.Item label="下载链接">
                  <a href={selectedVersion.downloadUrl} target="_blank" rel="noopener noreferrer">
                    {selectedVersion.downloadUrl}
                  </a>
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: "20px" }}>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  status: selectedVersion.status,
                }}
              >
                <Form.Item name="status" label="更新状态">
                  <Space>
                    <AuthButton
                      type={form.getFieldValue("status") === "draft" ? "primary" : "default"}
                      onClick={() => {
                        form.setFieldsValue({ status: "draft" });
                        form.validateFields(["status"]); // 触发表单更新
                      }}
                      tooltip="需要管理员权限才能更新状态"
                    >
                      草稿
                    </AuthButton>
                    <AuthButton
                      type={form.getFieldValue("status") === "published" ? "primary" : "default"}
                      onClick={() => {
                        form.setFieldsValue({ status: "published" });
                        form.validateFields(["status"]); // 触发表单更新
                      }}
                      tooltip="需要管理员权限才能更新状态"
                    >
                      已发布
                    </AuthButton>
                    <AuthButton
                      type={form.getFieldValue("status") === "deprecated" ? "primary" : "default"}
                      onClick={() => {
                        form.setFieldsValue({ status: "deprecated" });
                        form.validateFields(["status"]); // 触发表单更新
                      }}
                      tooltip="需要管理员权限才能更新状态"
                    >
                      已弃用
                    </AuthButton>
                  </Space>
                </Form.Item>

                <Form.Item>
                  <AuthButton type="primary" onClick={handleUpdateStatus} tooltip="需要管理员权限才能更新状态">
                    更新状态
                  </AuthButton>
                </Form.Item>
              </Form>
            </div>
          </div>
        )}
      </Modal>

      {/* 提交新版本弹窗 */}
      <Modal
        title="发布新版本"
        open={isSubmitModalVisible}
        onOk={handleSubmitVersion}
        onCancel={() => setIsSubmitModalVisible(false)}
        okText="发布"
        cancelText="取消"
      >
        <Form form={submitForm} layout="vertical">
          <Form.Item
            name="version"
            label="版本号"
            rules={[{ required: true, message: "请输入版本号" }]}
          >
            <Input placeholder="例如：1.0.0" />
          </Form.Item>
          <Form.Item
            name="description"
            label="版本描述"
            rules={[{ required: true, message: "请输入版本描述" }]}
          >
            <TextArea rows={4} placeholder="请描述此版本的更新内容" />
          </Form.Item>
          <Form.Item name="file" label="上传安装包">
            <Dragger
              name="file"
              multiple={false}
              beforeUpload={() => false}
              onChange={handleFileChange}
              fileList={fileList}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个文件上传，请上传安装包文件
              </p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VersionPage;