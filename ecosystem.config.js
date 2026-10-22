// PM2 process manager config — used on VPS to keep Node.js running 24/7
// Usage: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'narresho-solar',
      script: './server/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
