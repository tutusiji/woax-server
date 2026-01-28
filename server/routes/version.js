const Router = require('koa-router');
const router = new Router();
const Version = require('../models/Version');
const mongoose = require('mongoose');
const { verifyAdmin } = require('./admin');
const multer = require('@koa/multer');
const path = require('path');
const fs = require('fs');

// 处理中文文件名编码问题的辅助函数
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

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 使用辅助函数处理中文文件名
    const fixedOriginalName = fixChineseFileName(file.originalname);
    
    // 检查是否启用重命名
    const enableRename = req.body.enableRename === 'true';
    
    if (enableRename) {
      // 使用Hash重命名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(fixedOriginalName);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    } else {
      // 保持原文件名
      cb(null, fixedOriginalName);
    }
  }
});

const upload = multer({ 
  storage: storage,
  // 添加文件过滤器来处理中文文件名
  fileFilter: (req, file, cb) => {
    // 修复文件名编码
    file.originalname = fixChineseFileName(file.originalname);
    cb(null, true);
  }
});

// 支持多文件上传的配置
const uploadMultiple = upload.fields([
  { name: 'file', maxCount: 1 },          // 安装包文件
  { name: 'descriptionFile', maxCount: 1 } // 描述文件 (latest.yml)
]);

// 获取版本列表
router.get('/', async (ctx) => {
  try {
    const { page = 1, pageSize = 10, projectId } = ctx.query;
    
    if (!projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少项目ID参数"
      };
      return;
    }
    
    const query = { projectId: new mongoose.Types.ObjectId(projectId) };
    const total = await Version.countDocuments(query);
    const data = await Version.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize));
      
    ctx.body = {
      success: true,
      data,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取版本列表失败",
      error: error.message,
    };
  }
});

// 获取单个版本详情
router.get('/:id', async (ctx) => {
  try {
    const version = await Version.findById(ctx.params.id);
    if (!version) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该版本",
      };
      return;
    }
    ctx.body = {
      success: true,
      data: version,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取版本详情失败",
      error: error.message,
    };
  }
});

// 发布新版本 - 添加管理员权限验证
router.post('/publish', verifyAdmin, uploadMultiple, async (ctx) => {
  try {
    const { versionNumber, description, projectId, publishedBy, originalFileName, updateType, enableRename } = ctx.request.body;
    const files = ctx.request.files;
    const installFile = files?.file?.[0];      // 安装包文件
    const descFile = files?.descriptionFile?.[0]; // 描述文件
    
    console.log('文件重命名配置:', enableRename);
    console.log('上传的文件名:', installFile?.filename);
    console.log('原始文件名:', installFile?.originalname);
    
    if (!versionNumber || !description || !projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要字段"
      };
      // 如果已上传文件但验证失败，删除已上传的文件
      if (files) {
        try {
          if (files.file?.[0]?.path) {
            fs.unlinkSync(files.file[0].path);
          }
          if (files.descriptionFile?.[0]?.path) {
            fs.unlinkSync(files.descriptionFile[0].path);
          }
        } catch (err) {
          console.error('删除文件失败:', err);
        }
      }
      return;
    }
    
    // 创建下载URL
    let downloadUrl = null;
    let savedOriginalFileName = null;
    let fileExt = null;
    let descriptionFileUrl = null;
    let descriptionFileName = null;
    
    // 处理安装包文件
    if (installFile) {
      // 构建完整的下载URL
      const host = ctx.request.header.host;
      const protocol = ctx.request.secure ? 'https' : 'http';
      downloadUrl = `${protocol}://${host}/uploads/${installFile.filename}`;
      
      // 处理中文文件名编码问题
      let finalFileName = null;
      if (originalFileName) {
        // 优先使用前端传递的原始文件名，并修复编码
        finalFileName = fixChineseFileName(originalFileName);
      } else if (installFile.originalname) {
        // 修复文件上传时的编码问题
        finalFileName = fixChineseFileName(installFile.originalname);
      }
      
      savedOriginalFileName = finalFileName;
      fileExt = finalFileName ? path.extname(finalFileName) : null;
    }
    
    // 处理描述文件
    if (descFile) {
      const host = ctx.request.header.host;
      const protocol = ctx.request.secure ? 'https' : 'http';
      descriptionFileUrl = `${protocol}://${host}/uploads/${descFile.filename}`;
      descriptionFileName = fixChineseFileName(descFile.originalname);
    }
    
    console.log('处理文件名:', {
      原始前端传递: originalFileName,
      安装包原始文件名: installFile?.originalname,
      最终保存文件名: savedOriginalFileName,
      文件扩展名: fileExt,
      描述文件名: descriptionFileName,
      描述文件URL: descriptionFileUrl
    });
    
    const newVersion = new Version({
      versionNumber,
      description,
      projectId: new mongoose.Types.ObjectId(projectId),
      timestamp: new Date(),
      status: 'draft',
      downloadUrl,
      originalFileName: savedOriginalFileName,
      fileExt,
      publishedBy: publishedBy || 'Admin',
      fileSize: installFile ? installFile.size : null,
      updateType: updateType || 'passive',
      descriptionFileUrl,
      descriptionFileName
    });
    
    await newVersion.save();
    
    ctx.body = {
      success: true,
      message: "版本发布成功",
      data: newVersion
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "版本发布失败",
      error: error.message,
    };
  }
});

// 设置为最新版本 - 添加管理员权限验证
router.put('/set-latest/:id', verifyAdmin, async (ctx) => {
  try {
    const id = ctx.params.id;
    
    const version = await Version.findById(id);
    if (!version) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该版本"
      };
      return;
    }
    
    // 先将所有同项目的版本状态设为非最新
    await Version.updateMany(
      { projectId: version.projectId, status: 'published' },
      { status: 'deprecated' }
    );
    
    // 将当前版本设为已发布（最新）
    version.status = 'published';
    await version.save();
    
    ctx.body = {
      success: true,
      message: "已将此版本设为最新版本",
      data: version
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "设置最新版本失败",
      error: error.message,
    };
  }
});

// 获取最新版本信息 - 无需权限验证
router.get('/latest/:projectId', async (ctx) => {
  try {
    const { projectId } = ctx.params;
    
    if (!projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少项目ID参数"
      };
      return;
    }
    
    // 查询状态为已发布的最新版本
    const latestVersion = await Version.findOne({
      projectId: new mongoose.Types.ObjectId(projectId),
      status: 'published'
    }).sort({ timestamp: -1 });
    
    if (!latestVersion) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到已发布的版本"
      };
      return;
    }
    
    ctx.body = {
      success: true,
      data: latestVersion
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取最新版本失败",
      error: error.message,
    };
  }
});

// 更新版本状态 - 添加管理员权限验证
router.put('/:id', verifyAdmin, async (ctx) => {
  try {
    const { status, updateType, versionNumber, description } = ctx.request.body;
    const id = ctx.params.id;
    
    const version = await Version.findById(id);
    if (!version) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该版本"
      };
      return;
    }
    
    // 更新状态
    if (status) {
      version.status = status;
    }
    
    // 更新更新方式
    if (updateType) {
      version.updateType = updateType;
    }
    
    // 更新版本号
    if (versionNumber) {
      version.versionNumber = versionNumber;
    }
    
    // 更新版本描述
    if (description !== undefined) {
      version.description = description;
    }
    
    await version.save();
    
    ctx.body = {
      success: true,
      message: "版本更新成功",
      data: version
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "版本更新失败",
      error: error.message,
    };
  }
});

// 删除版本 - 添加管理员权限验证
router.delete('/:id', verifyAdmin, async (ctx) => {
  try {
    const version = await Version.findById(ctx.params.id);
    if (!version) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该版本",
      };
      return;
    }
    
    // 如果有文件，删除文件
    if (version.downloadUrl) {
      const filePath = path.join(__dirname, '..', version.downloadUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // 删除数据库记录
    await Version.findByIdAndDelete(ctx.params.id);
    
    ctx.body = {
      success: true,
      message: "版本已删除",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "删除版本失败",
      error: error.message,
    };
  }
});

module.exports = router;