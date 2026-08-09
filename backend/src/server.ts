import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`⚡️ EVShield Backend API running on port ${PORT}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`🔒 Allowed CORS Origin: ${config.frontendUrl}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log('====================================================');
});

// Graceful Shutdown handling
const handleShutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
