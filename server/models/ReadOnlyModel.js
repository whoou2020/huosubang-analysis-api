export default class ReadOnlyModel {
  static async findAll(table) {
    const [rows] = await pool.query(`SELECT * FROM ${table}`);
    return rows;
  }

  static async findById(table, id) {
    const [row] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return row[0] || null;
  }

  static async query(sql, params = []) {
    const [result] = await pool.query(sql, params);
    return result;
  }
} 