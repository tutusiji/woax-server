import React, { createContext, useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import axios from 'axios';

// 创建认证上下文
export const AuthContext = createContext();

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [loginForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 初始化时检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      verifyToken(token);
    }
  }, []);

  // 验证令牌
  const verifyToken = async (token) => {
    try {
      const response = await axios.get('/api/admin/verify', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setIsAuthenticated(true);
        setAdminUsername(response.data.data.username);
      } else {
        // 令牌无效，清除本地存储
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
        setAdminUsername('');
      }
    } catch (error) {
      console.error('验证令牌错误:', error);
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
      setAdminUsername('');
    }
  };

  // 显示登录弹窗
  const showLoginModal = () => {
    setIsLoginModalVisible(true);
  };

  // 隐藏登录弹窗
  const hideLoginModal = () => {
    setIsLoginModalVisible(false);
    loginForm.resetFields();
  };

  // 处理登录
  const handleLogin = async () => {
    try {
      setLoading(true);
      const values = await loginForm.validateFields();
      
      const response = await axios.post('/api/admin/login', values);
      
      if (response.data.success) {
        const { token, username } = response.data.data;
        
        // 保存令牌到本地存储
        localStorage.setItem('adminToken', token);
        
        // 更新状态
        setIsAuthenticated(true);
        setAdminUsername(username);
        
        // 关闭弹窗
        hideLoginModal();
        
        message.success('登录成功');
      } else {
        message.error(response.data.message || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理注销
  const handleLogout = () => {
    // 清除本地存储
    localStorage.removeItem('adminToken');
    
    // 更新状态
    setIsAuthenticated(false);
    setAdminUsername('');
    
    message.success('已注销');
  };

  // 提供的上下文值
  const contextValue = {
    isAuthenticated,
    adminUsername,
    showLoginModal,
    handleLogout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      
      {/* 登录弹窗 */}
      <Modal
        title="管理员登录"
        open={isLoginModalVisible}
        onCancel={hideLoginModal}
        footer={null}
      >
        <Form
          form={loginForm}
          layout="vertical"
          onFinish={handleLogin}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入管理员用户名" />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入管理员密码" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </AuthContext.Provider>
  );
};