import pool from '../config/database.js';

export class BaseModel {
  static async executeQuery(sql, params = []) {
    const [results] = await pool.execute(sql, params);
    return results;
  }

  static async transactional(queryRunner) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await queryRunner(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
} 