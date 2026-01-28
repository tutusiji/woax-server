# 版本更新方式功能实现

## 功能概述

为版本管理系统增加了"更新方式"属性，支持三种更新类型：
- **强制更新**: 用户必须更新才能继续使用
- **主动提醒**: 主动提醒用户有新版本可用
- **被动提醒**: 被动显示更新信息，默认选项

同时支持上传两种文件：
- **安装包文件**: 应用程序安装包 (.exe, .dmg, .AppImage 等)
- **描述文件**: 版本描述文件 (latest.yml)，用于自动更新检查

## 数据库模型修改

### Version.js 模型更新
```javascript
updateType: {
  type: String,
  enum: ['force', 'active', 'passive'],
  default: 'passive',
  trim: true
},
descriptionFileUrl: {
  type: String,
  trim: true
},
descriptionFileName: {
  type: String,
  trim: true
}
```

## 后端 API 修改

### 1. 发布版本接口 (`POST /api/version/publish`)
- 新增 `updateType` 参数支持
- 支持多文件上传：`file`（安装包）和 `descriptionFile`（描述文件）
- 默认值为 `'passive'`

### 2. 更新版本接口 (`PUT /api/version/:id`)
- 支持同时更新 `status` 和 `updateType`
- 可单独更新任一字段

## 前端界面修改

### 1. 版本列表表格
- 新增"更新方式"列
- 新增"描述文件"列，显示 latest.yml 文件链接
- 使用不同颜色的徽章显示：
  - 强制更新：红色徽章
  - 主动提醒：黄色徽章
  - 被动提醒：灰色徽章

### 2. 版本详情弹窗
- 在基本信息中显示更新方式
- 显示描述文件下载链接（如果存在）
- 添加更新方式编辑功能
- 使用 Radio.Group 组件进行选择
- 合并状态和更新方式的更新按钮

### 3. 发布新版本弹窗
- 新增更新方式选择器
- 新增描述文件上传器（可选）
- 支持 .yml/.yaml 文件格式
- 默认选择"被动提醒"
- 使用 Radio.Button 样式

## 功能特点

### 1. 用户体验优化
```javascript
// 更新方式显示函数
const getUpdateTypeText = (updateType) => {
  switch (updateType) {
    case 'force': return '强制更新';
    case 'active': return '主动提醒';
    case 'passive': return '被动提醒';
    default: return '被动提醒';
  }
};

// 更新方式徽章
const getUpdateTypeBadge = (updateType) => {
  switch (updateType) {
    case 'force': return <Badge status="error" text="强制更新" />;
    case 'active': return <Badge status="warning" text="主动提醒" />;
    case 'passive': return <Badge status="default" text="被动提醒" />;
    default: return <Badge status="default" text="被动提醒" />;
  }
};
```

### 2. 数据验证
- 后端使用 mongoose enum 验证
- 前端提供预定义选项，避免输入错误
- 默认值设置确保数据完整性

### 3. 向下兼容
- 为现有版本数据提供默认值 `'passive'`
- 不影响现有功能的正常使用

## 使用场景

### 1. 强制更新 (force)
```javascript
// 适用场景：
// - 安全漏洞修复
// - 重要功能变更
// - 不兼容的版本更新
updateType: 'force'
```

### 2. 主动提醒 (active)
```javascript
// 适用场景：
// - 新功能发布
// - 性能优化
// - 用户体验改进
updateType: 'active'
```

### 3. 被动提醒 (passive)
```javascript
// 适用场景：
// - 小版本更新
// - Bug 修复
// - 可选功能增加
updateType: 'passive' // 默认值
```

## API 调用示例

### 发布新版本
```javascript
const formData = new FormData();
formData.append('versionNumber', '1.2.0');
formData.append('description', '重要安全更新');
formData.append('updateType', 'force'); // 强制更新
formData.append('file', fileObject);        // 安装包文件
formData.append('descriptionFile', ymlFile); // 描述文件（可选）
formData.append('projectId', projectId);

const response = await axios.post('/api/version/publish', formData);
```

### latest.yml 文件格式示例
```yaml
# 版本信息
version: 1.2.0
releaseDate: '2025-07-26'

# 文件信息
files:
  - url: https://example.com/downloads/app-1.2.0.exe
    sha512: 'sha512hash值'
    size: 52428800

# 更新信息
path: app-1.2.0.exe
sha512: 'sha512hash值'
releaseDate: '2025-07-26T10:00:00.000Z'

# 发布说明
releaseNotes: |
  ## 版本 1.2.0 更新内容
  - 重要安全漏洞修复
  - 性能优化

# 更新策略
updateType: force
```

### 更新版本信息
```javascript
const updateData = {
  status: 'published',
  updateType: 'active'
};

const response = await axios.put(`/api/version/${versionId}`, updateData);
```

## 前端组件使用

### 在版本列表中显示
```jsx
{
  title: "更新方式",
  dataIndex: "updateType",
  key: "updateType",
  width: 110,
  render: (updateType) => getUpdateTypeBadge(updateType),
},
{
  title: "描述文件",
  dataIndex: "descriptionFileName",
  key: "descriptionFileName",
  width: 120,
  render: (text, record) => {
    if (text && record.descriptionFileUrl) {
      return (
        <a href={record.descriptionFileUrl} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      );
    }
    return "-";
  },
}
```

### 在表单中选择
```jsx
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
```

## 测试建议

1. **创建版本测试**：
   - 测试三种更新方式的创建
   - 验证默认值设置
   - 检查数据库存储

2. **更新功能测试**：
   - 测试状态和更新方式的独立更新
   - 测试同时更新多个字段
   - 验证更新结果显示

3. **界面显示测试**：
   - 检查表格中的徽章显示
   - 验证详情弹窗信息
   - 测试表单交互

4. **兼容性测试**：
   - 验证现有版本数据的显示
   - 测试API的向下兼容性
   - 检查默认值处理

## 扩展建议

1. **客户端集成**：可以根据更新方式在客户端实现不同的更新策略
2. **通知系统**：结合消息推送系统，根据更新方式发送不同级别的通知
3. **统计分析**：收集不同更新方式的用户响应数据
4. **自动化规则**：根据版本内容自动推荐合适的更新方式
5. **描述文件解析**：客户端可以解析 latest.yml 文件实现智能更新
6. **签名验证**：为描述文件添加数字签名，确保更新安全性
