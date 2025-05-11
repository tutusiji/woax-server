const Router = require('koa-router');
const Project = require('../models/Project');
const Report = require('../models/Report');
const Feedback = require('../models/Feedback');
const Version = require('../models/Version');

const router = new Router();

// 获取所有项目
router.get('/', async (ctx) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    ctx.body = {
      success: true,
      data: projects
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取项目列表失败',
      error: error.message
    };
  }
});

// 获取单个项目详情
router.get('/:id', async (ctx) => {
  try {
    const project = await Project.findById(ctx.params.id);
    if (!project) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '未找到该项目'
      };
      return;
    }
    ctx.body = {
      success: true,
      data: project
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取项目详情失败',
      error: error.message
    };
  }
});

// 创建新项目
router.post('/', async (ctx) => {
  try {
    const { name, description } = ctx.request.body;
    
    // 检查项目名是否已存在
    const existingProject = await Project.findOne({ name: name.trim() });
    if (existingProject) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '项目名已存在'
      };
      return;
    }
    
    // 创建新项目
    const newProject = new Project({
      name: name.trim(),
      description: description ? description.trim() : ''
    });
    
    // 保存到数据库
    const savedProject = await newProject.save();
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: '项目创建成功',
      data: savedProject
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '项目创建失败',
      error: error.message
    };
  }
});

// 更新项目
router.put('/:id', async (ctx) => {
  try {
    const { name, description } = ctx.request.body;
    
    // 如果要更新名称，检查新名称是否与其他项目冲突
    if (name) {
      const existingProject = await Project.findOne({ 
        name: name.trim(),
        _id: { $ne: ctx.params.id }
      });
      
      if (existingProject) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '项目名已存在'
        };
        return;
      }
    }
    
    // 构建更新对象
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    
    const updatedProject = await Project.findByIdAndUpdate(
      ctx.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedProject) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '未找到该项目'
      };
      return;
    }
    
    ctx.body = {
      success: true,
      message: '项目更新成功',
      data: updatedProject
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '更新项目失败',
      error: error.message
    };
  }
});

// 删除项目
router.delete('/:id', async (ctx) => {
  try {
    // 检查是否为最后一个项目
    const projectCount = await Project.countDocuments();
    if (projectCount <= 1) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '系统必须保留至少一个项目'
      };
      return;
    }
    
    const project = await Project.findByIdAndDelete(ctx.params.id);
    if (!project) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '未找到该项目'
      };
      return;
    }
    
    ctx.body = {
      success: true,
      message: '项目已删除'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '删除项目失败',
      error: error.message
    };
  }
});

// 将所有现有数据迁移到指定项目
router.post('/migrate/:projectId', async (ctx) => {
  try {
    const { projectId } = ctx.params;
    
    // 验证项目是否存在
    const project = await Project.findById(projectId);
    if (!project) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '未找到该项目'
      };
      return;
    }
    
    // 更新所有没有项目ID的数据
    await Promise.all([
      Report.updateMany({ projectId: { $exists: false } }, { projectId }),
      Feedback.updateMany({ projectId: { $exists: false } }, { projectId }),
      Version.updateMany({ projectId: { $exists: false } }, { projectId })
    ]);
    
    ctx.body = {
      success: true,
      message: '数据迁移成功'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '数据迁移失败',
      error: error.message
    };
  }
});

module.exports = router;