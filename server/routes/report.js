const Router = require('koa-router');
const Report = require('../models/Report');

const router = new Router();

// 获取所有数据上报记录
router.get('/', async (ctx) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    ctx.body = {
      success: true,
      data: reports
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取数据上报记录失败',
      error: error.message
    };
  }
});

// 获取单个数据上报记录详情
router.get('/:id', async (ctx) => {
  try {
    const report = await Report.findById(ctx.params.id);
    if (!report) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '未找到该数据上报记录'
      };
      return;
    }
    ctx.body = {
      success: true,
      data: report
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取数据上报记录详情失败',
      error: error.message
    };
  }
});

// 创建新的数据上报记录
router.post('/', async (ctx) => {
  try {
    const { username, ip, userAgent, deviceInfo, location, additionalData } = ctx.request.body;
    
    // 创建新的数据上报记录
    const newReport = new Report({
      username,
      ip,
      userAgent,
      deviceInfo,
      location,
      additionalData
    });
    
    // 保存到数据库
    const savedReport = await newReport.save();
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: '数据上报成功',
      data: savedReport
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '数据上报失败',
      error: error.message
    };
  }
});

// 删除数据上报记录
router.delete('/:id', async (ctx) => {
  try {
    const report = await Report.findByIdAndDelete(ctx.params.id);
    if (!report) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '未找到该数据上报记录'
      };
      return;
    }
    ctx.body = {
      success: true,
      message: '数据上报记录已删除'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '删除数据上报记录失败',
      error: error.message
    };
  }
});

module.exports = router;