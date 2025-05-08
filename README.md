# WoaX 项目

这是一个使用React前端、Node.js+Koa后端和MongoDB数据库的全栈应用程序。

## 功能特点

1. **数据上报** - 收集用户数据，包括时间、用户名、IP等信息
2. **意见反馈** - 收集用户提交的使用意见，支持富文本和用户信息
3. **版本更新通知** - 管理和通知用户新版本信息，包括版本号和下载链接

## 项目结构

```
WoaX/
├── client/            # React前端应用
└── server/            # Node.js+Koa后端应用
```

## 安装与运行

### 前端

```bash
cd client
npm install
npm start
```

### 后端

```bash
cd server
npm install
npm start
```

## 技术栈

- 前端：React、React Router、Ant Design
- 后端：Node.js、Koa.js
- 数据库：MongoDB