const Router = require('koa-router');
const router = new Router();
const Feedback = require('../models/Feedback');
const mongoose = require('mongoose');
const { verifyAdmin } = require('./admin');

// 获取反馈列表
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
    const total = await Feedback.countDocuments(query);
    const data = await Feedback.find(query)
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
      message: "获取反馈列表失败",
      error: error.message,
    };
  }
});

// 获取单个反馈详情
router.get('/:id', async (ctx) => {
  try {
    const feedback = await Feedback.findById(ctx.params.id);
    if (!feedback) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该反馈",
      };
      return;
    }
    ctx.body = {
      success: true,
      data: feedback,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取反馈详情失败",
      error: error.message,
    };
  }
});

// 提交新反馈 - 添加管理员权限验证
router.post('/', verifyAdmin, async (ctx) => {
  try {
    const { username, email, content, projectId } = ctx.request.body;
    
    if (!username || !content || !projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要字段"
      };
      return;
    }
    
    const newFeedback = new Feedback({
      username,
      email,
      content,
      projectId: new mongoose.Types.ObjectId(projectId),
      ip: ctx.request.ip,
      timestamp: new Date(),
      status: 'pending',
      replyHistory: []
    });
    
    await newFeedback.save();
    
    ctx.body = {
      success: true,
      message: "反馈提交成功",
      data: newFeedback
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "反馈提交失败",
      error: error.message,
    };
  }
});

// 更新反馈状态 - 添加管理员权限验证
router.put('/:id', verifyAdmin, async (ctx) => {
  try {
    const { status, replyInput, admin } = ctx.request.body;
    const id = ctx.params.id;
    
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该反馈"
      };
      return;
    }
    
    // 更新状态
    if (status) {
      feedback.status = status;
    }
    
    // 添加回复
    if (replyInput) {
      feedback.replyHistory.push({
        content: replyInput,
        admin: admin || 'Admin',
        time: new Date()
      });
    }
    
    await feedback.save();
    
    ctx.body = {
      success: true,
      message: "反馈更新成功",
      data: feedback
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "反馈更新失败",
      error: error.message,
    };
  }
});

// 删除反馈 - 添加管理员权限验证
router.delete('/:id', verifyAdmin, async (ctx) => {
  try {
    const result = await Feedback.findByIdAndDelete(ctx.params.id);
    if (!result) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该反馈",
      };
      return;
    }
    ctx.body = {
      success: true,
      message: "反馈已删除",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "删除反馈失败",
      error: error.message,
    };
  }
});

module.exports = router;
