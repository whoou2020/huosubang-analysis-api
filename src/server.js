const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const port = process.env.PORT || 3004;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 基本路由
app.get("/", (req, res) => {
  res.json({ message: "欢迎使用火速帮配送数据分析API" });
});

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 