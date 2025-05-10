const Router = require("koa-router");
const Feedback = require("../models/Feedback");

const router = new Router();

// 获取意见反馈列表（支持分页）
router.get("/", async (ctx) => {
  try {
    // 获取分页参数
    const page = parseInt(ctx.query.page) || 1;
    const pageSize = parseInt(ctx.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    // 查询总数
    const total = await Feedback.countDocuments();

    // 分页查询
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    ctx.body = {
      success: true,
      data: feedbacks,
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取意见反馈失败",
      error: error.message,
    };
  }
});

// 获取单个意见反馈详情
router.get("/:id", async (ctx) => {
  try {
    const feedback = await Feedback.findById(ctx.params.id);
    if (!feedback) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该意见反馈",
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
      message: "获取意见反馈详情失败",
      error: error.message,
    };
  }
});

// 提交新的意见反馈
router.post("/", async (ctx) => {
  try {
    const { username, content, email, ip } = ctx.request.body;

    // 创建新的意见反馈
    const newFeedback = new Feedback({
      username,
      content,
      email,
      ip,
    });

    // 保存到数据库
    const savedFeedback = await newFeedback.save();

    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "意见反馈提交成功",
      data: savedFeedback,
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: "意见反馈提交失败",
      error: error.message,
    };
  }
});

// 更新意见反馈状态
router.put("/:id", async (ctx) => {
  try {
    const { status, replyInput } = ctx.request.body;

    // 构建更新对象
    const updateObj = {};
    if (status) updateObj.status = status;
    if (typeof replyInput === "string" && replyInput.trim()) {
      // 追加到回复记录
      updateObj.$push = {
        replyHistory: {
          content: replyInput.trim(),
          time: new Date(),
          admin: ctx.state.user?.username || "管理员",
        },
      };
      updateObj.replyInput = replyInput.trim(); // 可选：保留最新输入
    }

    // 如果没有回复，只更新状态
    const updateQuery =
      Object.keys(updateObj).length > 0 ? updateObj : { status };

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      ctx.params.id,
      updateQuery,
      { new: true }
    );

    if (!updatedFeedback) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该意见反馈",
      };
      return;
    }

    ctx.body = {
      success: true,
      message: "意见反馈状态已更新",
      data: updatedFeedback,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "更新意见反馈状态失败",
      error: error.message,
    };
  }
});

// 删除意见反馈
router.delete("/:id", async (ctx) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(ctx.params.id);
    if (!feedback) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该意见反馈",
      };
      return;
    }
    ctx.body = {
      success: true,
      message: "意见反馈已删除",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "删除意见反馈失败",
      error: error.message,
    };
  }
});

module.exports = router;
