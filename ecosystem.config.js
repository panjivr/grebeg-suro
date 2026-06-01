/**
 * PM2 process config — Grebeg Suro Attendance System
 *
 * Usage on VPS:
 *   pm2 start ecosystem.config.js
 *   pm2 save && pm2 startup
 *
 * App env vars (DATABASE_URL, JWT_SECRET, Supabase, Telegram, …) are loaded
 * automatically by Next.js from the `.env` file at runtime. Only PORT/NODE_ENV
 * need to be set here so the HTTP server binds to the correct port.
 */
module.exports = {
  apps: [
    {
      name: "grebeg-suro",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 3100,
      },
    },
  ],
};
