module.exports = {
  apps: [
    {
      name: 'notification-service',
      script: 'src/server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      
      // Environment configuration
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Process management
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Monitoring
      monitoring: false,
      pmx: true,
      
      // Advanced settings
      listen_timeout: 3000,
      kill_timeout: 5000,
      wait_ready: true,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Node.js specific
      node_args: '--max-old-space-size=2048',
      
      // Watch mode (disabled for production)
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        'tests',
        'docs'
      ],
      
      // Source map support
      source_map_support: true,
      
      // Graceful shutdown
      shutdown_with_message: true,
      
      // Custom settings
      time: true,
      automation: false,
      treekill: true
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourrepo/notification-service.git',
      path: '/var/www/notification-service',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
