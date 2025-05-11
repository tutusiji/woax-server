import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Button, Modal, Input, message, Space } from 'antd';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { DatabaseOutlined, CommentOutlined, CloudUploadOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import logo from './assets/logo.png';

// 导入页面组件
import ReportPage from './pages/StatisticPage/index.jsx';
import FeedbackPage from './pages/FeedbackPage.jsx';
import VersionPage from './pages/VersionPage.jsx';

const { Header, Content, Footer } = Layout;

function App() {
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/feedback')) return ['2'];
    if (path.startsWith('/version')) return ['3'];
    return ['1']; // 默认选中数据统计
  };

  // 获取项目列表
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      if (response.data.success && response.data.data.length > 0) {
        setProjects(response.data.data);
        
        // 从localStorage获取上次选择的项目，如果没有则使用第一个项目
        const savedProjectId = localStorage.getItem('currentProjectId');
        const savedProject = savedProjectId 
          ? response.data.data.find(p => p._id === savedProjectId)
          : response.data.data[0];
        
        setCurrentProject(savedProject || response.data.data[0]);
      } else {
        // 如果没有项目，创建默认项目
        createDefaultProject();
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
      message.error('获取项目列表失败');
    }
  };

  // 创建默认项目
  const createDefaultProject = async () => {
    try {
      const response = await axios.post('/api/projects', { name: 'project01' });
      if (response.data.success) {
        setProjects([response.data.data]);
        setCurrentProject(response.data.data);
        localStorage.setItem('currentProjectId', response.data.data._id);
      }
    } catch (error) {
      console.error('创建默认项目失败:', error);
      message.error('创建默认项目失败');
    }
  };

  // 切换项目
  const handleProjectChange = (project) => {
    setCurrentProject(project);
    localStorage.setItem('currentProjectId', project._id);
    // 通知子组件刷新数据
    window.dispatchEvent(new CustomEvent('projectChanged', { detail: project }));
  };

  // 添加新项目
  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      message.error('项目名不能为空');
      return;
    }

    try {
      const response = await axios.post('/api/projects', { name: newProjectName.trim() });
      if (response.data.success) {
        message.success('项目创建成功');
        setProjects([...projects, response.data.data]);
        setNewProjectName('');
        setIsModalVisible(false);
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      message.error('创建项目失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 项目下拉菜单
  const projectMenu = {
    items: projects.map(project => ({
      key: project._id,
      label: project.name,
      onClick: () => handleProjectChange(project)
    })),
  };

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Header className='header' style={{ display: 'flex', alignItems: 'center' }}>
        <img src={logo} className="logo" alt="WOAX服务中台" style={{ marginRight: '20px' }} /> 
        
        {/* 项目下拉列表 */}
        <Dropdown menu={projectMenu} trigger={['click']}>
          <Button style={{ marginRight: '20px' }}>
            <Space>
              {currentProject?.name || '选择项目'}
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
        
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={getSelectedKey()}
          style={{ flex: 1 }}
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
        
        {/* 项目管理按钮 */}
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          style={{ marginLeft: '20px' }}
        >
          项目管理
        </Button>
      </Header>
      
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content" style={{ margin: '16px 0' }}>
          <Routes>
            <Route path="/" element={<ReportPage currentProject={currentProject} />} />
            <Route path="/feedback" element={<FeedbackPage currentProject={currentProject} />} />
            <Route path="/version" element={<VersionPage currentProject={currentProject} />} />
          </Routes>
        </div>
      </Content>
      
      {/* 新增项目弹窗 */}
      <Modal 
        title="新增项目" 
        open={isModalVisible} 
        onOk={handleAddProject} 
        onCancel={() => {
          setIsModalVisible(false);
          setNewProjectName('');
        }}
      >
        <Input 
          placeholder="请输入项目名称" 
          value={newProjectName} 
          onChange={(e) => setNewProjectName(e.target.value)} 
        />
      </Modal>
      
      <Footer style={{ textAlign: 'center' }}>
        WoaX ©{new Date().getFullYear()} Created with React & Ant Design
      </Footer>
    </Layout>
  );
}

export default App;