const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./db');
require('dotenv').config();

// 导入路由
const reportRoutes = require('./routes/report');
const feedbackRoutes = require('./routes/feedback');
const versionRoutes = require('./routes/version');
const projectRoutes = require('./routes/project');

// 创建Koa应用实例
const app = new Koa();
const router = new Router();

// 连接MongoDB数据库
connectDB().catch(err => console.error('数据库连接失败:', err));

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 中间件
app.use(cors());
app.use(bodyParser());

// 静态文件服务
app.use(async (ctx, next) => {
  if (ctx.path.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, ctx.path);
    if (fs.existsSync(filePath)) {
      ctx.type = path.extname(filePath);
      ctx.body = fs.createReadStream(filePath);
      return;
    }
  }
  await next();
});

// 路由
router.use('/api/report', reportRoutes.routes());
router.use('/api/feedback', feedbackRoutes.routes());
router.use('/api/version', versionRoutes.routes());
router.use('/api/projects', projectRoutes.routes());

// 注册路由
app.use(router.routes()).use(router.allowedMethods());

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});