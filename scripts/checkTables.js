import pool from '../server/config/database.js';

const checkTables = async () => {
  try {
    const [result] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.tables
      WHERE table_schema = 'luanzhoubang'
    `);
    console.log('现有数据表:', result.map(r => r.TABLE_NAME));
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    pool.end();
  }
};

checkTables(); 