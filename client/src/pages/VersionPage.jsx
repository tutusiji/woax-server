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
  Select,
  Radio,
  Switch,
} from "antd";
import moment from "moment";
import { InboxOutlined } from "@ant-design/icons";
import axios from "axios";
import AuthButton from "../components/AuthButton";

const { Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;

const VersionPage = ({ currentProject }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [descriptionFileList, setDescriptionFileList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 监听项目变化
  useEffect(() => {
    if (currentProject) {
      fetchVersions();
      fetchLatestVersion();
    } else {
      setVersions([]);
      setLatestVersion(null);
    }
  }, [currentProject]);

  // 监听项目变化事件
  useEffect(() => {
    const handleProjectChange = () => {
      fetchVersions();
      fetchLatestVersion();
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

  // 获取最新版本信息
  const fetchLatestVersion = async () => {
    if (!currentProject) return;
    
    setLoadingLatest(true);
    try {
      const response = await axios.get(`/api/version/latest/${currentProject._id}`);
      if (response.data.success) {
        setLatestVersion(response.data.data);
      } else {
        // 如果没有找到最新版本，这是正常情况，不显示错误
        setLatestVersion(null);
        console.log('未找到已发布的最新版本');
      }
    } catch (error) {
      console.error('获取最新版本错误:', error);
      // 404错误是正常的，表示没有已发布的版本
      if (error.response?.status !== 404) {
        message.error('获取最新版本失败');
      }
      setLatestVersion(null);
    } finally {
      setLoadingLatest(false);
    }
  };

  // 查看详情
  const handleViewDetails = (record) => {
    setSelectedVersion(record);
    setIsModalVisible(true);
    form.setFieldsValue({
      versionNumber: record.versionNumber,
      description: record.description || '',
      status: record.status,
      updateType: record.updateType || 'passive'
    });
  };

  // 更新版本状态
  const handleUpdateVersion = async () => {
    try {
      const values = await form.validateFields();
      const updateData = {
        versionNumber: values.versionNumber,
        description: values.description,
        status: values.status,
        updateType: values.updateType || 'passive'
      };
      
      const response = await axios.put(`/api/version/${selectedVersion._id}`, updateData);
      
      if (response.data.success) {
        message.success('版本信息更新成功');
        setIsModalVisible(false);
        fetchVersions(); // 重新加载数据
        fetchLatestVersion(); // 重新获取最新版本信息
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
      const updateData = {};
      
      if (values.status) {
        updateData.status = values.status;
      }
      
      if (values.updateType) {
        updateData.updateType = values.updateType;
      }
      
      const response = await axios.put(`/api/version/${selectedVersion._id}`, updateData);
      
      if (response.data.success) {
        message.success('更新成功');
        setIsModalVisible(false);
        fetchVersions(); // 重新加载数据
        fetchLatestVersion(); // 重新获取最新版本信息
      } else {
        message.error('更新失败');
      }
    } catch (error) {
      console.error('更新错误:', error);
      message.error('更新失败');
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
        fetchLatestVersion(); // 重新获取最新版本信息
      } else {
        message.error('设置最新版本失败');
      }
    } catch (error) {
      console.error('设置最新版本错误:', error);
      message.error('设置最新版本失败');
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

  // 获取更新方式显示文本
  const getUpdateTypeText = (updateType) => {
    switch (updateType) {
      case 'force':
        return '强制更新';
      case 'active':
        return '主动提醒';
      case 'passive':
        return '被动提醒';
      default:
        return '被动提醒';
    }
  };

  // 获取更新方式徽章
  const getUpdateTypeBadge = (updateType) => {
    switch (updateType) {
      case 'force':
        return <Badge status="error" text="强制更新" />;
      case 'active':
        return <Badge status="warning" text="主动提醒" />;
      case 'passive':
        return <Badge status="default" text="被动提醒" />;
      default:
        return <Badge status="default" text="被动提醒" />;
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

  // 处理描述文件变化
  const handleDescriptionFileChange = (info) => {
    let fileList = [...info.fileList];
    // 限制只能上传一个文件
    fileList = fileList.slice(-1);
    setDescriptionFileList(fileList);
  };

  // 修复中文文件名编码问题的辅助函数
  const fixChineseFileName = (filename) => {
    if (!filename) return filename;
    
    try {
      // 检查是否包含常见的中文乱码字符
      if (filename.includes('æ') || filename.includes('¼') || filename.includes('é') || 
          filename.includes('¨') || filename.includes('§') || filename.includes('«')) {
        // 尝试通过TextDecoder修复编码
        const encoder = new TextEncoder();
        const decoder = new TextDecoder('utf-8');
        const bytes = encoder.encode(filename);
        return decoder.decode(bytes);
      }
      
      // 尝试解码URL编码
      try {
        const decoded = decodeURIComponent(filename);
        if (decoded !== filename && !decoded.includes('%')) {
          return decoded;
        }
      } catch (e) {
        // 解码失败，继续
      }
      
      return filename;
    } catch (error) {
      console.warn('文件名编码修复失败:', error);
      return filename;
    }
  };

  // 处理下载
  const handleDownload = async (record) => {
    if (!record.downloadUrl) {
      message.error('下载链接不存在');
      return;
    }
    
    try {
      // 使用 fetch 获取文件，以便正确处理文件名
      const response = await fetch(record.downloadUrl);
      if (!response.ok) {
        throw new Error('下载失败');
      }
      
      // 获取文件数据
      const blob = await response.blob();
      
      // 确定下载文件名，处理中文编码问题
      let fileName = 'download';
      if (record.originalFileName) {
        // 优先使用保存的原始文件名，并修复可能的编码问题
        fileName = fixChineseFileName(record.originalFileName);
      } else if (record.fileName) {
        // 备选：使用 fileName 字段
        fileName = fixChineseFileName(record.fileName);
      } else {
        // 最后备选：从版本号生成文件名
        const fileExtension = record.downloadUrl.split('.').pop() || 'zip';
        fileName = `${record.versionNumber || 'version'}.${fileExtension}`;
      }
      
      // 创建下载链接
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // 使用 encodeURIComponent 确保文件名正确传递
      link.download = fileName;
      link.style.display = 'none';
      
      // 执行下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理内存
      window.URL.revokeObjectURL(downloadUrl);
      
      message.success(`开始下载文件: ${fileName}`);
    } catch (error) {
      console.error('下载错误:', error);
      message.error('下载失败，请稍后重试');
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
      // 添加原始文件名
      formData.append('originalFileName', fileList[0].name);
      // 添加更新方式
      formData.append('updateType', values.updateType || 'passive');
      
      // 添加重命名配置
      formData.append('enableRename', values.enableRename || false);
      
      // 如果有描述文件，也上传
      if (descriptionFileList.length > 0) {
        formData.append('descriptionFile', descriptionFileList[0].originFileObj);
      }
      
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
        setDescriptionFileList([]);
        fetchVersions(); // 重新加载数据
        fetchLatestVersion(); // 重新获取最新版本信息
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
      title: "描述文件",
      dataIndex: "descriptionFileName",
      key: "descriptionFileName",
      width: 120,
      render: (text, record) => {
        if (text && record.descriptionFileUrl) {
          return (
            <a 
              href={record.descriptionFileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontSize: "12px" }}
            >
              {text}
            </a>
          );
        }
        return "-";
      },
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
      title: "更新方式",
      dataIndex: "updateType",
      key: "updateType",
      width: 110,
      render: (updateType) => getUpdateTypeBadge(updateType),
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

        {/* 最新版本信息卡片 */}
        {latestVersion && (
          <Card 
            size="small" 
            style={{ 
              marginBottom: "20px", 
              backgroundColor: "#f6ffed", 
              borderColor: "#b7eb8f" 
            }}
            title={
              <div style={{ display: "flex", alignItems: "center" }}>
                <Badge status="success" />
                <span style={{ marginLeft: "8px" }}>当前最新版本</span>
              </div>
            }
            loading={loadingLatest}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>
                  版本 {latestVersion.versionNumber}
                </div>
                <div style={{ color: "#666", fontSize: "12px" }}>
                  发布时间: {moment(latestVersion.timestamp).format("YYYY-MM-DD HH:mm:ss")}
                </div>
                {latestVersion.originalFileName && (
                  <div style={{ color: "#666", fontSize: "12px" }}>
                    文件: {latestVersion.originalFileName}
                  </div>
                )}
              </div>
              <div>
                {latestVersion.downloadUrl && (
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => handleDownload(latestVersion)}
                  >
                    下载最新版本
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

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
              {selectedVersion.originalFileName && (
                <Descriptions.Item label="原始文件名">
                  {selectedVersion.originalFileName}
                </Descriptions.Item>
              )}
              {selectedVersion.fileSize && (
                <Descriptions.Item label="文件大小">
                  {formatFileSize(selectedVersion.fileSize)}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="状态">
                {getStatusBadge(selectedVersion.status)}
              </Descriptions.Item>
              <Descriptions.Item label="更新方式">
                {getUpdateTypeBadge(selectedVersion.updateType)}
              </Descriptions.Item>
              {selectedVersion.descriptionFileName && (
                <Descriptions.Item label="描述文件">
                  <a href={selectedVersion.descriptionFileUrl} target="_blank" rel="noopener noreferrer">
                    {selectedVersion.descriptionFileName}
                  </a>
                </Descriptions.Item>
              )}
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
                  updateType: selectedVersion.updateType || 'passive',
                  versionNumber: selectedVersion.versionNumber,
                  description: selectedVersion.description,
                }}
              >
                <Form.Item 
                  name="versionNumber" 
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

                <Form.Item name="updateType" label="更新方式">
                  <Radio.Group>
                    <Radio.Button value="passive">被动提醒</Radio.Button>
                    <Radio.Button value="active">主动提醒</Radio.Button>
                    <Radio.Button value="force">强制更新</Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Form.Item>
                  <Space>
                    <AuthButton 
                      type="primary" 
                      onClick={handleUpdateVersion} 
                      tooltip="需要管理员权限才能更新版本信息"
                    >
                      保存修改
                    </AuthButton>
                    <AuthButton 
                      type="default" 
                      onClick={handleUpdateStatus} 
                      tooltip="需要管理员权限才能更新状态"
                    >
                      更新状态
                    </AuthButton>
                  </Space>
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
          <Form.Item name="descriptionFile" label="上传描述文件 (可选)">
            <Dragger
              name="descriptionFile"
              multiple={false}
              beforeUpload={() => false}
              onChange={handleDescriptionFileChange}
              fileList={descriptionFileList}
              accept=".yml,.yaml"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽 latest.yml 文件到此区域上传</p>
              <p className="ant-upload-hint">
                可选：上传版本描述文件 (latest.yml)，用于自动更新检查
              </p>
            </Dragger>
          </Form.Item>
          <Form.Item 
            name="updateType" 
            label="更新方式" 
            initialValue="passive"
          >
            <Radio.Group>
              <Radio.Button value="passive">被动提醒</Radio.Button>
              <Radio.Button value="active">主动提醒</Radio.Button>
              <Radio.Button value="force">强制更新</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item 
            name="enableRename" 
            label="文件重命名" 
            initialValue={false}
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="启用Hash重命名" 
              unCheckedChildren="保持原文件名"
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              启用后将使用Hash重命名文件，关闭则保持原文件名（同名文件会被替换）
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VersionPage;