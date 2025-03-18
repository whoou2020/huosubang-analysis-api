const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || '106.14.192.126',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'luanzhoubang',
  password: process.env.DB_PASSWORD || '@lzb666888..',
  database: process.env.DB_NAME || 'luanzhoubang',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+08:00'
});

// 测试连接函数
const testConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  } finally {
    if (conn) conn.release();
  }
};

// 健康检查函数
const healthCheck = async () => {
  try {
    const [rows] = await pool.execute('SELECT 1 AS result');
    return rows[0].result === 1;
  } catch (error) {
    console.error('数据库健康检查失败:', error.message);
    return false;
  }
};

module.exports = pool;
module.exports.testConnection = testConnection;
module.exports.healthCheck = healthCheck;