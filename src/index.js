import express from 'express';
import { config } from '../config/default.js';
import { logger } from './utils/logger.js';
import { modbusService } from './services/modbus-service.js';
import { timescaleService } from './services/timescale-service.js';

const app = express();

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

app.get('/status', (req, res) => {
    const status = modbusService.connections.map(c => ({
        name: c.name,
        connected: c.isConnected,
        ip: c.ip
    }));
    res.json({
        modbus: status
    });
});

const start = async () => {
    try {
        // 1. Connect to Infrastructure
        logger.info(`[Config] DB Enabled: ${config.db.enabled}, Host: ${config.db.host}, Port: ${config.db.port}, User: ${config.db.user}, DB: ${config.db.database}`);
        timescaleService.connect();

        // 2. Start Modbus Polling
        modbusService.start();

        // 3. Start Web Server
        app.listen(config.server.port, () => {
            logger.info(`Ingestion Service running on port ${config.server.port}`);
        });

    } catch (error) {
        logger.error('Failed to start service:', error);
        process.exit(1);
    }
};

start();

// Graceful Shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down...');
    await timescaleService.close();
    process.exit(0);
});
