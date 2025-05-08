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
    const latestVersion = await Version.findOne({ isActive: true }).sort({ createdAt: -1 });
    
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
    const versions = await Version.find().sort({ createdAt: -1 });
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

// 上传新版本
router.post('/publish', upload.single('file'), async (ctx) => {
  try {
    console.log('Request Headers:', ctx.request.headers);
    console.log('Request Body:', ctx.request.body);
    console.log('Uploaded File:', ctx.file);
    const { versionNumber, description, publishedBy } = ctx.request.body;
    const file = ctx.file;
    
    if (!file) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '请上传安装包文件'
      };
      return;
    }
    
    // 生成下载链接
    const downloadLink = `/uploads/${file.filename}`;
    
    // 创建新版本记录
    const newVersion = new Version({
      versionNumber,
      downloadLink,
      description,
      publishedBy,
      fileName: file.originalname,
      fileSize: file.size
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

// 更新版本状态
router.put('/:id', async (ctx) => {
  try {
    const { isActive, description } = ctx.request.body;
    
    const updatedVersion = await Version.findByIdAndUpdate(
      ctx.params.id,
      { isActive, description },
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
      message: '版本状态已更新',
      data: updatedVersion
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '更新版本状态失败',
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
    
    // 删除关联的文件
    if (version.downloadLink) {
      const filePath = path.join(__dirname, '..', version.downloadLink);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // 从数据库中删除记录
    await Version.findByIdAndDelete(ctx.params.id);
    
    ctx.body = {
      success: true,
      message: '版本已删除'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '删除版本失败',
      error: error.message
    };
  }
});

module.exports = router;