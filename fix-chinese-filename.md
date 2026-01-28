# 中文文件名乱码问题修复

## 问题描述
原始文件名 `æé¼æ¸å®äº.ttf` 出现乱码，这是由于文件上传和下载过程中编码处理不当导致的。

## 修复方案

### 1. 后端修复 (server/routes/version.js)

#### 添加文件名编码修复函数
```javascript
function fixChineseFileName(filename) {
  if (!filename) return filename;
  
  try {
    // 检查是否包含乱码字符
    if (filename.includes('æ') || filename.includes('¼') || filename.includes('é')) {
      // 尝试从 latin1 转换为 utf8
      return Buffer.from(filename, 'latin1').toString('utf8');
    }
    
    // 尝试解码URL编码
    try {
      const decoded = decodeURIComponent(filename);
      if (decoded !== filename) {
        return decoded;
      }
    } catch (e) {
      // 解码失败，继续下一步
    }
    
    return filename;
  } catch (error) {
    console.warn('文件名编码修复失败:', error);
    return filename;
  }
}
```

#### 更新multer配置
- 在文件上传时使用修复函数处理文件名
- 在fileFilter中预处理文件名编码

#### 更新发布版本逻辑
- 优先使用前端传递的原始文件名
- 使用修复函数处理编码问题
- 添加详细的日志输出便于调试

### 2. 前端修复 (client/src/pages/VersionPage.jsx)

#### 添加文件名编码修复函数
```javascript
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
```

#### 更新下载函数
- 使用修复函数处理从数据库读取的文件名
- 确保下载时使用正确的中文文件名

## 测试步骤

1. **上传测试**：
   - 上传一个包含中文的文件，如 `测试文件.ttf`
   - 检查后端日志，确认文件名正确处理
   - 检查数据库中保存的文件名是否正确

2. **显示测试**：
   - 在版本列表中检查文件名是否正确显示
   - 在详情弹窗中检查原始文件名显示

3. **下载测试**：
   - 点击下载按钮
   - 确认下载的文件名是正确的中文名称
   - 验证文件内容完整性

## 常见乱码模式

| 正确文件名 | 乱码显示 | 修复方法 |
|----------|----------|----------|
| 测试文件.ttf | æµè¯æä»¶.ttf | latin1 -> utf8 |
| 中文字体.ttf | ä¸­æå­ä½.ttf | latin1 -> utf8 |
| 安装包.zip | å®è£å.zip | latin1 -> utf8 |

## 预期效果

修复后，系统应该能够：
- 正确处理包含中文字符的文件名
- 在上传、存储、显示和下载过程中保持文件名完整性
- 自动识别和修复常见的编码问题
- 对于无法修复的编码问题，提供降级处理方案

## 兼容性说明

- 修复函数包含多种编码检测和修复策略
- 对于无法识别的编码问题，会保持原文件名不变
- 向下兼容现有的正确编码文件名
