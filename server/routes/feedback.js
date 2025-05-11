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
    const projectId = ctx.query.projectId;

    // 验证项目ID
    if (!projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少项目ID参数",
      };
      return;
    }

    // 查询条件
    const query = { projectId };

    // 查询总数
    const total = await Feedback.countDocuments(query);

    // 分页查询
    const feedbacks = await Feedback.find(query)
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
    let { username, content, email, ip, projectId } = ctx.request.body;
    // 去除字符串字段两端空格
    username = typeof username === "string" ? username.trim() : username;
    content = typeof content === "string" ? content.trim() : content;
    email = typeof email === "string" ? email.trim() : email;
    ip = typeof ip === "string" ? ip.trim() : ip;

    // 验证项目ID
    if (!projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少项目ID参数",
      };
      return;
    }

    // 创建新的意见反馈
    const newFeedback = new Feedback({
      username,
      content,
      email,
      ip,
      projectId,
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
    const updateData = {};

    // 更新状态
    if (status) {
      updateData.status = status;
    }

    // 添加回复
    if (replyInput && typeof replyInput === "string" && replyInput.trim()) {
      const replyItem = {
        content: replyInput.trim(),
        time: new Date(),
        admin: "管理员", // 可以根据实际登录用户替换
      };

      // 使用 $push 操作符将新回复添加到 replyHistory 数组的开头
      updateData.$push = {
        replyHistory: {
          $each: [replyItem],
          $position: 0,
        },
      };
    }

    // 更新文档
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      ctx.params.id,
      updateData,
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
      message: "更新成功",
      data: updatedFeedback,
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: "更新失败",
      error: error.message,
    };
  }
});

// 删除意见反馈
router.delete("/:id", async (ctx) => {
  try {
    const deletedFeedback = await Feedback.findByIdAndDelete(ctx.params.id);
    if (!deletedFeedback) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该意见反馈",
      };
      return;
    }
    ctx.body = {
      success: true,
      message: "删除成功",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "删除失败",
      error: error.message,
    };
  }
});

module.exports = router;
