module.exports = {
  apps: [{
    name: 'tyland-sur-be',
    exec_mode: 'cluster',
    instances: 4,
    script: './server.js',
    args: 'start',
    out_file: '../logs/tyland-node-backend_out.log',
    error_file: '../logs/tyland-node-backend_err.log',
    cron_restart: '0 7 * * *',
    time: true,
    watch: false,
    ignore_watch: ['[/\\]./', 'node_modules', '.git', 'upload'],
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production'
    },
    wait_ready: true,
    restart_delay: 5000
  }]
}
