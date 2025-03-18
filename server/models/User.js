import BaseModel from './BaseModel.js';

class User extends BaseModel {
  static tableName = 'users';

  static async findByEmail(email) {
    const [user] = await this.executeQuery(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return user;
  }
}

export default User; 