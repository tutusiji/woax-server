const Router = require('koa-router');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

const router = new Router();
const JWT_SECRET = process.env.JWT_SECRET || 'woax-admin-secret-key';

// 创建初始管理员账号（如果不存在）
const createDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new Admin({ username: 'admin' });
      admin.setPassword('admin123'); // 默认密码
      await admin.save();
      console.log('默认管理员账号已创建');
    }
  } catch (error) {
    console.error('创建默认管理员失败:', error);
  }
};

// 应用启动时创建默认管理员
createDefaultAdmin();

// 管理员登录
router.post('/login', async (ctx) => {
  try {
    const { username, password } = ctx.request.body;
    
    const admin = await Admin.findOne({ username });
    if (!admin) {
      ctx.status = 401;
      ctx.body = { success: false, message: '用户名或密码错误' };
      return;
    }
    
    if (!admin.validatePassword(password)) {
      ctx.status = 401;
      ctx.body = { success: false, message: '用户名或密码错误' };
      return;
    }
    
    // 更新最后登录时间
    admin.lastLogin = new Date();
    await admin.save();
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    ctx.body = {
      success: true,
      data: {
        token,
        username: admin.username
      }
    };
  } catch (error) {
    console.error('登录错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '服务器错误' };
  }
});

// 验证管理员令牌
router.get('/verify', async (ctx) => {
  try {
    const token = ctx.headers.authorization?.split(' ')[1];
    if (!token) {
      ctx.status = 401;
      ctx.body = { success: false, message: '未提供令牌' };
      return;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      ctx.status = 401;
      ctx.body = { success: false, message: '无效的令牌' };
      return;
    }
    
    ctx.body = {
      success: true,
      data: {
        username: admin.username
      }
    };
  } catch (error) {
    ctx.status = 401;
    ctx.body = { success: false, message: '无效的令牌' };
  }
});

// 中间件：验证管理员权限
const verifyAdmin = async (ctx, next) => {
  try {
    const token = ctx.headers.authorization?.split(' ')[1];
    if (!token) {
      ctx.status = 401;
      ctx.body = { success: false, message: '未提供令牌' };
      return;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      ctx.status = 401;
      ctx.body = { success: false, message: '无效的令牌' };
      return;
    }
    
    ctx.state.admin = admin;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { success: false, message: '无效的令牌' };
  }
};

module.exports = router;
module.exports.verifyAdmin = verifyAdmin;