module.exports = {
  apps: [
    {
      name: 'openoffice-self',
      script: 'npm',
      args: 'run dev',
      cwd: '/root/clawd/openoffice.self',
      env: {
        PORT: 8888,
        NODE_ENV: 'production'
      },
      // 进程管理
      instances: 1,
      exec_mode: 'fork',
      
      // 自动重启
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // 内存管理
      max_memory_restart: '1G',
      
      // 日志
      log_file: '/root/clawd/openoffice.self/logs/pm2-combined.log',
      out_file: '/root/clawd/openoffice.self/logs/pm2-out.log',
      error_file: '/root/clawd/openoffice.self/logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 监控
      watch: false,
      
      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 10000,
      
      // 重启策略
      restart_delay: 3000
    }
  ]
};