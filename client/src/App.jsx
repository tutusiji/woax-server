import React from 'react';
import { Layout, Menu } from 'antd';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { DatabaseOutlined, CommentOutlined, CloudUploadOutlined } from '@ant-design/icons';
import logo from './assets/logo.png';

// 导入页面组件
import ReportPage from './pages/StatisticPage/index.jsx';
import FeedbackPage from './pages/FeedbackPage.jsx';
import VersionPage from './pages/VersionPage.jsx';

const { Header, Content, Footer } = Layout;

function App() {
  const location = useLocation();
  
  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/feedback')) return ['2'];
    if (path.startsWith('/version')) return ['3'];
    return ['1']; // 默认选中数据统计
  };

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Header className='header' >
         <img src={logo}  className="logo" alt="WOAX服务中台" /> 
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={getSelectedKey()}
          items={[
            {
              key: '1',
              icon: <DatabaseOutlined />,
              label: <Link to="/">数据统计</Link>,
            },
            {
              key: '2',
              icon: <CommentOutlined />,
              label: <Link to="/feedback">意见反馈</Link>,
            },
            {
              key: '3',
              icon: <CloudUploadOutlined />,
              label: <Link to="/version">版本更新</Link>,
            },
          ]}
        />
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content" style={{ margin: '16px 0' }}>
          <Routes>
            <Route path="/" element={<ReportPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/version" element={<VersionPage />} />
          </Routes>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        WoaX ©{new Date().getFullYear()} Created with React & Ant Design
      </Footer>
    </Layout>
  );
}

export default App;