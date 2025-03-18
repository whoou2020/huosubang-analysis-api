export const sanitizeInput = (input) => {
  return input.replace(/[^\w@.-]/gi, '');
};

export const validateDatabaseConfig = () => {
  const requiredFields = ['DB_HOST', 'DB_USER', 'DB_PASSWORD'];
  const missing = requiredFields.filter(field => !process.env[field]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必要的数据库配置: ${missing.join(', ')}`);
  }
}; 