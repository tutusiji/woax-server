const Router = require("koa-router");
const Report = require("../models/Report");

const router = new Router();

// 聚合：每个用户最后一次上报
router.post("/", async (ctx) => {
  try {
    const { pageCurrent = 1, pageSize = 20 } = ctx.request.body;
    // 修正聚合分页逻辑，避免多余的 $sort 和分页失效
    const pipeline = [
      {
        $group: {
          _id: { $ifNull: ["$username", "未知用户"] },
          username: { $first: { $ifNull: ["$username", "未知用户"] } },
          ip: { $first: "$ip" },
          timestamp: { $max: "$timestamp" },
          version: { $first: "$version" },
          remark: { $first: "$remark" },
          deviceInfo: { $first: "$deviceInfo" },
          docId: { $first: "$_id" },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      { $skip: (pageCurrent - 1) * pageSize },
      { $limit: pageSize },
    ];
    // 先查总数 - 移除严格的username匹配条件
    const countPipeline = [
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
    const { page = 1, pageSize = 10 } = ctx.query;
    const username = ctx.params.username;
    const query = { username };
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
      message: "获取数据统计记录详情失败",
      error: error.message,
    };
  }
});

// 创建新的数据统计记录
router.post("/", async (ctx) => {
  try {
    let {
      username,
      ip,
      userAgent,
      deviceInfo,
      location,
      version,
      remark,
      additionalData,
    } = ctx.request.body;

    // 去除字符串字段两端空格
    username = typeof username === "string" ? username.trim() : username;
    ip = typeof ip === "string" ? ip.trim() : ip;
    userAgent = typeof userAgent === "string" ? userAgent.trim() : userAgent;
    deviceInfo =
      typeof deviceInfo === "string" ? deviceInfo.trim() : deviceInfo;
    location = typeof location === "string" ? location.trim() : location;
    version = typeof version === "string" ? version.trim() : version;
    remark = typeof remark === "string" ? remark.trim() : remark;

    // 创建新的数据统计记录
    const newStatistic = new Report({
      username,
      ip,
      userAgent,
      deviceInfo,
      location,
      version,
      remark,
      additionalData,
    });

    // 保存到数据库
    const savedStatistic = await newStatistic.save();

    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "数据统计成功",
      data: savedStatistic,
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: "数据统计失败",
      error: error.message,
    };
  }
});

// 删除数据统计记录
router.delete("/:id", async (ctx) => {
  try {
    const statistic = await Report.findByIdAndDelete(ctx.params.id);
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

// 拉取接口
router.post("/getReportData", async (ctx) => {
  try {
    const { pageCurrent = 1, pageSize = 20 } = ctx.request.body;
    // 只聚合有 username 字段的数据，取每个用户最新一条
    const pipeline = [
      { $match: { username: { $exists: true, $ne: "" } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$username",
          username: { $first: "$username" },
          ip: { $first: "$ip" },
          timestamp: { $first: "$timestamp" },
          version: { $first: "$version" },
          remark: { $first: "$remark" },
          deviceInfo: { $first: "$deviceInfo" },
          docId: { $first: "$_id" },
        },
      },
      { $sort: { timestamp: -1 } },
      { $skip: (pageCurrent - 1) * pageSize },
      { $limit: pageSize },
    ];
    // 统计唯一用户总数
    const countPipeline = [
      { $match: { username: { $exists: true, $ne: "" } } },
      { $group: { _id: "$username" } },
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

// 自主上报接口
router.post("/addReport", async (ctx) => {
  try {
    let {
      username,
      ip,
      userAgent,
      deviceInfo,
      location,
      version,
      remark,
      additionalData,
    } = ctx.request.body;

    // 去除字符串字段两端空格
    username = typeof username === "string" ? username.trim() : username;
    ip = typeof ip === "string" ? ip.trim() : ip;
    userAgent = typeof userAgent === "string" ? userAgent.trim() : userAgent;
    deviceInfo =
      typeof deviceInfo === "string" ? deviceInfo.trim() : deviceInfo;
    location = typeof location === "string" ? location.trim() : location;
    version = typeof version === "string" ? version.trim() : version;
    remark = typeof remark === "string" ? remark.trim() : remark;

    // 创建新的数据统计记录
    const newStatistic = new Report({
      username,
      ip,
      userAgent,
      deviceInfo,
      location,
      version,
      remark,
      additionalData,
    });

    // 保存到数据库
    const savedStatistic = await newStatistic.save();

    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "数据统计成功",
      data: savedStatistic,
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: "数据统计失败",
      error: error.message,
    };
  }
});
