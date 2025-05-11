const mongoose = require('mongoose');
const { connectDB } = require('../db');
const Project = require('../models/Project');
const Report = require('../models/Report');
const Feedback = require('../models/Feedback');
const Version = require('../models/Version');

// 初始化默认项目并迁移数据
async function initializeProject() {
  try {
    // 连接数据库
    await connectDB();
    console.log('数据库连接成功');

    // 检查是否已有项目
    const projectCount = await Project.countDocuments();
    
    if (projectCount === 0) {
      console.log('创建默认项目...');
      
      // 创建默认项目
      const defaultProject = new Project({
        name: 'project01',
        description: '默认项目'
      });
      
      const savedProject = await defaultProject.save();
      console.log(`默认项目创建成功: ${savedProject.name}`);
      
      // 迁移现有数据到默认项目
      const projectId = savedProject._id;
      
      // 更新所有没有项目ID的数据
      const [reportResult, feedbackResult, versionResult] = await Promise.all([
        Report.updateMany({ projectId: { $exists: false } }, { projectId }),
        Feedback.updateMany({ projectId: { $exists: false } }, { projectId }),
        Version.updateMany({ projectId: { $exists: false } }, { projectId })
      ]);
      
      console.log(`迁移报告数据: ${reportResult.modifiedCount} 条记录已更新`);
      console.log(`迁移反馈数据: ${feedbackResult.modifiedCount} 条记录已更新`);
      console.log(`迁移版本数据: ${versionResult.modifiedCount} 条记录已更新`);
      
      console.log('数据迁移完成');
    } else {
      console.log(`已存在 ${projectCount} 个项目，跳过初始化`);
    }
    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
    
    process.exit(0);
  } catch (error) {
    console.error('初始化项目失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initializeProject();