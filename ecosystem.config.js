module.exports = {
  apps: [{
    name: 'api-server',
    script: 'server/app.js',
    env: {
      NODE_ENV: 'development',
      PORT: 3004
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3004
    },
    watch: false,
    max_memory_restart: '300M',
    error_file: 'logs/api-error.log',
    out_file: 'logs/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    restart_delay: 3000,
    max_restarts: 10
  }]
}; 