import React, { useContext } from 'react';
import { Button, Tooltip } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';

/**
 * 权限按钮组件
 * 用于包装需要管理员权限的操作按钮
 * 如果用户未登录，则显示锁定图标并禁用按钮
 * 如果用户已登录，则正常显示按钮
 */
const AuthButton = ({ children, onClick, tooltip = '需要管理员权限', ...props }) => {
  const { isAuthenticated, showLoginModal } = useContext(AuthContext);

  // 处理点击事件
  const handleClick = (e) => {
    if (!isAuthenticated) {
      // 如果未登录，显示登录弹窗
      showLoginModal();
      return;
    }
    
    // 如果已登录，执行原始点击事件
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Tooltip title={!isAuthenticated ? tooltip : ''}>
      <Button
        {...props}
        onClick={handleClick}
        icon={!isAuthenticated ? <LockOutlined /> : props.icon}
        disabled={!isAuthenticated && props.disabled}
      >
        {children}
      </Button>
    </Tooltip>
  );
};

export default AuthButton;