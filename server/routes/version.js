const Router = require('koa-router');
const router = new Router();
const Version = require('../models/Version');
const mongoose = require('mongoose');
const { verifyAdmin } = require('./admin');
const multer = require('@koa/multer');
const path = require('path');
const fs = require('fs');

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

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
router.post('/publish', verifyAdmin, upload.single('file'), async (ctx) => {
  try {
    const { versionNumber, description, projectId, publishedBy } = ctx.request.body;
    const file = ctx.request.file;
    
    if (!versionNumber || !description || !projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要字段"
      };
      // 如果已上传文件但验证失败，删除已上传的文件
      if (file && file.path) {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('删除文件失败:', err);
        }
      }
      return;
    }
    
    // 创建下载URL
    let downloadUrl = null;
    let originalFileName = null;
    let fileExt = null;
    
    if (file) {
      // 构建完整的下载URL
      const host = ctx.request.header.host;
      const protocol = ctx.request.secure ? 'https' : 'http';
      downloadUrl = `${protocol}://${host}/uploads/${file.filename}`;
      originalFileName = file.originalname;
      fileExt = path.extname(file.originalname);
    }
    
    const newVersion = new Version({
      versionNumber,
      description,
      projectId: new mongoose.Types.ObjectId(projectId),
      timestamp: new Date(),
      status: 'draft',
      downloadUrl,
      originalFileName,
      fileExt,
      publishedBy: publishedBy || 'Admin',
      fileSize: file ? file.size : null
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
    const { status } = ctx.request.body;
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