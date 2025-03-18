import { readFileSync } from 'fs';
import pool from '../server/config/database.js';

const runMigration = async () => {
  try {
    const sql = readFileSync('./server/database/migrations/20240620_create_users_table.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ 数据库迁移成功');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
  } finally {
    pool.end();
  }
};

runMigration(); 