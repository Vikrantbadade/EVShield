import app from './app.js';
import { config } from './config/env.js';
import { wsService } from './services/websocket.service.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`⚡️ EVShield Backend API running on port ${PORT}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`🔒 Allowed CORS Origin: ${config.frontendUrl}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🔌 WebSocket Stream: ws://localhost:${PORT}/ws/telemetry`);
  console.log('====================================================');
});

// Initialize WebSocket stream server
wsService.initialize(server);

// Global error safety handlers
process.on('uncaughtException', (err) => {
  console.error('Unhandled Exception in backend server:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection in backend server:', reason);
});

// Graceful Shutdown handling
const handleShutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down HTTP & WebSocket server...`);
  wsService.shutdown();
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
