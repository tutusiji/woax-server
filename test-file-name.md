# 文件名处理功能测试指南

## 修改内容总结

### 前端修改 (VersionPage.jsx)

1. **上传功能改进**：
   - `handleUploadVersion()`: 添加了 `originalFileName` 字段到 FormData
   - `handleSubmitVersion()`: 添加了 `originalFileName` 字段到 FormData
   - 两个函数都使用 `fileList[0].name` 获取原始文件名

2. **下载功能改进**：
   - `handleDownload()`: 改为使用 fetch API 获取文件
   - 使用 Blob 和 URL.createObjectURL 创建下载链接
   - 优先使用 `record.originalFileName` 作为下载文件名
   - 添加了内存清理 (`URL.revokeObjectURL`)
   - 改进了错误处理和用户提示

3. **界面显示改进**：
   - 详情弹窗中添加了原始文件名和文件大小的显示
   - 表格中文件名列已正确配置为显示 `originalFileName`

### 后端修改 (version.js)

1. **发布版本接口改进**：
   - 从请求体中获取 `originalFileName` 参数
   - 优先使用前端传递的原始文件名
   - 如果没有传递，则使用上传文件的原始名称作为备选

### 数据库模型 (Version.js)

- 模型已包含 `originalFileName` 字段，无需修改

## 测试步骤

1. **上传测试**：
   - 选择一个具有特殊名称的文件（如：`我的应用安装包 v1.0.0.zip`）
   - 通过"发布新版本"功能上传
   - 检查数据库中是否正确保存了原始文件名

2. **显示测试**：
   - 在版本列表中检查文件名列是否显示原始文件名
   - 点击"查看"按钮，检查详情弹窗中是否显示原始文件名

3. **下载测试**：
   - 点击"下载"按钮
   - 检查下载的文件是否使用了原始文件名
   - 验证文件内容是否正确

## 预期行为

- 上传时：前端获取文件的原始名称并传递给后端保存
- 显示时：界面上显示保存的原始文件名
- 下载时：下载的文件使用保存的原始文件名

## 兼容性处理

- 如果 `originalFileName` 不存在，会尝试使用 `fileName` 字段
- 如果都不存在，会根据版本号和文件扩展名生成默认文件名
- 这确保了对旧数据的兼容性
