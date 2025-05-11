const Router = require('koa-router');
const multer = require('@koa/multer');
const path = require('path');
const fs = require('fs');
const Version = require('../models/Version');

const router = new Router();

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
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 10485760) // 默认10MB
  }
});

// 获取最新版本信息
router.get('/latest', async (ctx) => {
  try {
    const projectId = ctx.query.projectId;
    
    // 验证项目ID
    if (!projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少项目ID参数"
      };
      return;
    }
    
    const latestVersion = await Version.findOne({ isActive: true, projectId }).sort({ createdAt: -1 });
    
    if (!latestVersion) {
      ctx.body = {
        success: true,
        hasNewVersion: false,
        message: '没有可用的新版本'
      };
      return;
    }
    
    ctx.body = {
      success: true,
      hasNewVersion: true,
      data: {
        versionNumber: latestVersion.versionNumber,
        downloadLink: latestVersion.downloadLink,
        releaseDate: latestVersion.releaseDate,
        description: latestVersion.description
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取版本信息失败',
      error: error.message
    };
  }
});

// 获取所有版本信息
router.get('/', async (ctx) => {
  try {
    const projectId = ctx.query.projectId;
    
    // 验证项目ID
    if (!projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少项目ID参数"
      };
      return;
    }
    
    const versions = await Version.find({ projectId }).sort({ createdAt: -1 });
    ctx.body = {
      success: true,
      data: versions
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取版本列表失败',
      error: error.message
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
        message: '未找到该版本信息'
      };
      return;
    }
    ctx.body = {
      success: true,
      data: version
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取版本详情失败',
      error: error.message
    };
  }
});

// 更新版本信息
router.put('/:id', async (ctx) => {
  try {
    const { isActive, description } = ctx.request.body;
    const updateData = {};
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    
    if (description) {
      updateData.description = description;
    }
    
    const updatedVersion = await Version.findByIdAndUpdate(
      ctx.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedVersion) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '未找到该版本信息'
      };
      return;
    }
    
    ctx.body = {
      success: true,
      message: '更新成功',
      data: updatedVersion
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '更新失败',
      error: error.message
    };
  }
});

// 删除版本
router.delete('/:id', async (ctx) => {
  try {
    const version = await Version.findById(ctx.params.id);
    if (!version) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '未找到该版本信息'
      };
      return;
    }
    
    // 删除文件
    if (version.fileName) {
      const filePath = path.join(__dirname, '../uploads', version.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // 删除数据库记录
    await Version.findByIdAndDelete(ctx.params.id);
    
    ctx.body = {
      success: true,
      message: '删除成功'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '删除失败',
      error: error.message
    };
  }
});

// 发布新版本
router.post('/publish', upload.single('file'), async (ctx) => {
  try {
    const { versionNumber, description, publishedBy, projectId } = ctx.request.body;
    const file = ctx.request.file;
    
    // 验证必填字段
    if (!versionNumber || !description || !publishedBy || !file || !projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '缺少必要参数'
      };
      return;
    }
    
    // 检查版本号是否已存在
    const existingVersion = await Version.findOne({ versionNumber, projectId });
    if (existingVersion) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '该版本号已存在'
      };
      return;
    }
    
    // 创建下载链接
    const fileName = file.filename;
    const fileSize = file.size;
    const downloadLink = `/api/version/download/${fileName}`;
    
    // 创建新版本记录
    const newVersion = new Version({
      versionNumber,
      downloadLink,
      releaseDate: new Date(),
      description,
      isActive: true,
      fileName,
      fileSize,
      publishedBy,
      projectId
    });
    
    // 保存到数据库
    const savedVersion = await newVersion.save();
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: '新版本发布成功',
      data: savedVersion
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '新版本发布失败',
      error: error.message
    };
  }
});

// 下载版本文件
router.get('/download/:filename', async (ctx) => {
  try {
    const fileName = ctx.params.filename;
    const filePath = path.join(__dirname, '../uploads', fileName);
    
    if (!fs.existsSync(filePath)) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '文件不存在'
      };
      return;
    }
    
    ctx.attachment(fileName);
    ctx.body = fs.createReadStream(filePath);
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '下载失败',
      error: error.message
    };
  }
});

module.exports = router;