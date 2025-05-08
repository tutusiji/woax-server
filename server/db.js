const mongoose = require('mongoose');
require('dotenv').config();

/**
 * 数据库连接模块
 * 负责处理MongoDB数据库的连接和错误处理
 */

// 连接MongoDB数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/woax', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB连接成功');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB连接失败:', err);
    // 如果是生产环境，可能需要在连接失败时退出进程
    // process.exit(1);
    throw err;
  }
};

// 监听连接事件
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB连接断开');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB连接错误:', err);
});

// 处理应用关闭时的数据库连接
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB连接已关闭（应用终止）');
  process.exit(0);
});

module.exports = {
  connectDB,
  connection: mongoose.connection
};