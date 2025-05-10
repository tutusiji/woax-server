// 使用内置的fetch API代替axios

// 生成随机IP地址
function generateRandomIP() {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(
    Math.random() * 256
  )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

// 生成随机版本号
function generateRandomVersion() {
  const major = Math.floor(Math.random() * 5) + 1;
  const minor = Math.floor(Math.random() * 10);
  const patch = Math.floor(Math.random() * 10);
  return `v${major}.${minor}.${patch}`;
}

// 生成随机设备信息
function generateRandomDevice() {
  const devices = ["Windows", "MacOS", "Linux", "iOS", "Android"];
  const browsers = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];
  return `${devices[Math.floor(Math.random() * devices.length)]} - ${
    browsers[Math.floor(Math.random() * browsers.length)]
  }`;
}

// 生成随机用户名
function generateRandomUsername() {
  const prefixes = ["user", "test", "admin", "guest", "dev"];
  const suffix = Math.floor(Math.random() * 1000);
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffix}`;
}

// 生成随机备注
function generateRandomRemark() {
  const remarks = [
    "测试数据",
    "自动生成的记录",
    "模拟用户行为",
    "系统测试",
    "功能验证",
    "性能测试",
    "兼容性测试",
    "用户体验测试",
    "安全测试",
    "压力测试",
  ];
  return remarks[Math.floor(Math.random() * remarks.length)];
}

// 生成随机位置信息
function generateRandomLocation() {
  const cities = [
    "北京",
    "上海",
    "广州",
    "深圳",
    "杭州",
    "成都",
    "武汉",
    "西安",
    "南京",
    "重庆",
  ];
  return cities[Math.floor(Math.random() * cities.length)];
}

// 生成随机附加数据
function generateRandomAdditionalData(date) {
  const features = [
    "登录",
    "注册",
    "浏览",
    "搜索",
    "购买",
    "评论",
    "分享",
    "收藏",
    "下载",
    "上传",
  ];
  const status = ["成功", "失败", "进行中", "已取消", "已完成"];

  return {
    feature: features[Math.floor(Math.random() * features.length)],
    status: status[Math.floor(Math.random() * status.length)],
    duration: Math.floor(Math.random() * 1000),
    timestamp: date.toISOString(),
  };
}

// 生成随机日期（过去30天内）
function generateRandomDate() {
  const now = new Date();
  const pastDays = Math.floor(Math.random() * 30);
  const pastDate = new Date(now.getTime() - pastDays * 24 * 60 * 60 * 1000);
  return pastDate;
}

// 生成模拟数据
async function generateAndInsertData() {
  console.log("开始生成100条模拟数据...");

  for (let i = 0; i < 100; i++) {
    // 先生成随机日期，确保timestamp和additionalData使用相同的日期
    const randomDate = generateRandomDate();

    const data = {
      username: generateRandomUsername(),
      ip: generateRandomIP(),
      timestamp: randomDate,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      deviceInfo: generateRandomDevice(),
      location: generateRandomLocation(),
      version: generateRandomVersion(),
      remark: generateRandomRemark(),
      additionalData: generateRandomAdditionalData(randomDate),
    };

    try {
      const response = await fetch(
        "http://localhost:3001/api/report/addReport",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();

      if (responseData.success) {
        console.log(`成功插入第 ${i + 1} 条数据`);
      } else {
        console.error(`插入第 ${i + 1} 条数据失败:`, responseData.message);
      }
    } catch (error) {
      console.error(`插入第 ${i + 1} 条数据出错:`, error.message);
    }

    // 添加延迟，避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("数据生成完成！");
}

// 执行数据生成和插入
generateAndInsertData();

// node d:\CodeLab\WoaX\server\scripts\generateData.js
