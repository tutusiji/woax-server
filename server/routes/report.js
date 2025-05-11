const Router = require("koa-router");
const Report = require("../models/Report");
const mongoose = require("mongoose");

const router = new Router();

// 聚合：每个用户最后一次上报
router.post("/getReportData", async (ctx) => {
  try {
    const { pageCurrent = 1, pageSize = 20, projectId } = ctx.request.body;
    
    if (!projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少项目ID参数"
      };
      return;
    }

    // 转换projectId为ObjectId
    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    
    // 修正聚合分页逻辑，添加项目过滤
    const pipeline = [
      {
        $match: { projectId: projectObjectId }
      },
      {
        $sort: { timestamp: -1 } // 先按时间戳降序排序
      },
      {
        $group: {
          _id: { $ifNull: ["$username", "未知用户"] },
          username: { $first: { $ifNull: ["$username", "未知用户"] } },
          ip: { $first: "$ip" },
          timestamp: { $first: "$timestamp" }, // 使用$first而不是$max，因为已经按时间戳排序
          version: { $first: "$version" },
          remark: { $first: "$remark" },
          deviceInfo: { $first: "$deviceInfo" },
          docId: { $first: "$_id" },
          projectId: { $first: "$projectId" }
        },
      },
      {
        $sort: { timestamp: -1 }, // 最终结果仍按时间戳降序排序
      },
      { $skip: (pageCurrent - 1) * pageSize },
      { $limit: pageSize },
    ];
    
    // 先查总数 - 添加项目过滤
    const countPipeline = [
      {
        $match: { projectId: projectObjectId }
      },
      {
        $group: {
          _id: { $ifNull: ["$username", "未知用户"] },
        },
      },
      { $count: "total" },
    ];
    
    const totalAgg = await Report.aggregate(countPipeline);
    const total = totalAgg.length > 0 ? totalAgg[0].total : 0;

    const dataAgg = await Report.aggregate(pipeline);
    const data = dataAgg.map((item) => ({
      ...item,
      _id: item.docId,
    }));

    ctx.body = {
      success: true,
      data,
      total,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取数据统计失败",
      error: error.message,
    };
  }
});

// 用户所有记录分页
router.get("/user/:username", async (ctx) => {
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
    
    const username = ctx.params.username;
    const query = { 
      username,
      projectId: new mongoose.Types.ObjectId(projectId)
    };
    
    const total = await Report.countDocuments(query);
    const data = await Report.find(query)
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
      message: "获取用户记录失败",
      error: error.message,
    };
  }
});

// 添加上报数据
router.post("/addReport", async (ctx) => {
  try {
    const { username, ip, userAgent, deviceInfo, location, version, remark, projectId } = ctx.request.body;
    
    if (!projectId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少项目ID参数"
      };
      return;
    }
    
    // 创建新的上报记录
    const newReport = new Report({
      username,
      ip,
      userAgent,
      deviceInfo,
      location,
      version,
      remark,
      projectId: new mongoose.Types.ObjectId(projectId),
      timestamp: new Date()
    });
    
    // 保存到数据库
    await newReport.save();
    
    ctx.body = {
      success: true,
      message: "数据上报成功",
      data: newReport
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: "数据上报失败",
      error: error.message
    };
  }
});

// 获取单个数据统计记录详情
router.get("/:id", async (ctx) => {
  try {
    const statistic = await Report.findById(ctx.params.id);
    if (!statistic) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该数据统计记录",
      };
      return;
    }
    ctx.body = {
      success: true,
      data: statistic,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取数据统计记录失败",
      error: error.message,
    };
  }
});

// 删除数据统计记录
router.delete("/:id", async (ctx) => {
  try {
    const result = await Report.findByIdAndDelete(ctx.params.id);
    if (!result) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "未找到该数据统计记录",
      };
      return;
    }
    ctx.body = {
      success: true,
      message: "数据统计记录已删除",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "删除数据统计记录失败",
      error: error.message,
    };
  }
});

module.exports = router;
