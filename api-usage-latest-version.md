# 调用 `/api/version/latest/:projectId` 接口示例

## 接口信息

- **路径**: `/api/version/latest/:projectId`
- **方法**: GET
- **权限**: 无需权限验证（公开接口）
- **参数**: 
  - `projectId` (路径参数): 项目ID

## 返回数据格式

### 成功响应 (200)
```javascript
{
  "success": true,
  "data": {
    "_id": "版本ID",
    "versionNumber": "1.0.0",
    "description": "版本描述",
    "projectId": "项目ID",
    "timestamp": "2025-07-26T12:00:00.000Z",
    "status": "published",
    "downloadUrl": "http://localhost:3000/uploads/file-123456789.zip",
    "originalFileName": "应用安装包.zip",
    "fileExt": ".zip",
    "publishedBy": "Admin",
    "fileSize": 1024000
  }
}
```

### 错误响应 (404 - 未找到版本)
```javascript
{
  "success": false,
  "message": "未找到已发布的版本"
}
```

### 错误响应 (400 - 缺少参数)
```javascript
{
  "success": false,
  "message": "缺少项目ID参数"
}
```

## 前端调用示例

### 1. 使用 axios 调用

```javascript
// 获取最新版本信息
const fetchLatestVersion = async (projectId) => {
  try {
    const response = await axios.get(`/api/version/latest/${projectId}`);
    if (response.data.success) {
      const latestVersion = response.data.data;
      console.log('最新版本:', latestVersion);
      return latestVersion;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('该项目暂无已发布的版本');
      return null;
    } else {
      console.error('获取最新版本失败:', error);
      throw error;
    }
  }
};

// 使用示例
const projectId = '507f1f77bcf86cd799439011';
fetchLatestVersion(projectId)
  .then(version => {
    if (version) {
      console.log('版本号:', version.versionNumber);
      console.log('下载链接:', version.downloadUrl);
      console.log('文件名:', version.originalFileName);
    }
  })
  .catch(error => {
    console.error('调用失败:', error);
  });
```

### 2. React Hook 示例

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const useLatestVersion = (projectId) => {
  const [latestVersion, setLatestVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLatestVersion = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/version/latest/${projectId}`);
      if (response.data.success) {
        setLatestVersion(response.data.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setLatestVersion(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestVersion();
  }, [projectId]);

  return { latestVersion, loading, error, refetch: fetchLatestVersion };
};

// 组件中使用
const VersionComponent = ({ projectId }) => {
  const { latestVersion, loading, error, refetch } = useLatestVersion(projectId);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!latestVersion) return <div>暂无已发布的版本</div>;

  return (
    <div>
      <h3>最新版本: {latestVersion.versionNumber}</h3>
      <p>发布时间: {new Date(latestVersion.timestamp).toLocaleString()}</p>
      {latestVersion.downloadUrl && (
        <a href={latestVersion.downloadUrl} download={latestVersion.originalFileName}>
          下载 {latestVersion.originalFileName}
        </a>
      )}
      <button onClick={refetch}>重新获取</button>
    </div>
  );
};
```

### 3. 在 VersionPage 组件中的集成

```javascript
const VersionPage = ({ currentProject }) => {
  const [latestVersion, setLatestVersion] = useState(null);
  const [loadingLatest, setLoadingLatest] = useState(false);

  // 获取最新版本信息
  const fetchLatestVersion = async () => {
    if (!currentProject) return;
    
    setLoadingLatest(true);
    try {
      const response = await axios.get(`/api/version/latest/${currentProject._id}`);
      if (response.data.success) {
        setLatestVersion(response.data.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        message.error('获取最新版本失败');
      }
      setLatestVersion(null);
    } finally {
      setLoadingLatest(false);
    }
  };

  // 在项目变化时获取最新版本
  useEffect(() => {
    if (currentProject) {
      fetchLatestVersion();
    } else {
      setLatestVersion(null);
    }
  }, [currentProject]);

  return (
    <div>
      {/* 显示最新版本信息 */}
      {latestVersion && (
        <Card title="当前最新版本" loading={loadingLatest}>
          <p>版本号: {latestVersion.versionNumber}</p>
          <p>发布时间: {moment(latestVersion.timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
          {latestVersion.downloadUrl && (
            <Button 
              type="primary" 
              onClick={() => handleDownload(latestVersion)}
            >
              下载最新版本
            </Button>
          )}
        </Card>
      )}
      
      {/* 其他内容... */}
    </div>
  );
};
```

## 使用场景

1. **版本检查**: 客户端应用检查是否有新版本可用
2. **自动更新**: 获取最新版本信息进行自动更新
3. **下载页面**: 在下载页面显示最新版本信息
4. **版本对比**: 与当前版本进行对比
5. **通知提醒**: 当有新版本发布时提醒用户

## 注意事项

1. 只返回状态为 `published` 的版本
2. 按时间戳降序排列，返回最新的一个
3. 如果没有已发布的版本，返回404错误
4. 接口无需权限验证，可以公开访问
5. 建议在调用时处理404错误（这是正常情况）
