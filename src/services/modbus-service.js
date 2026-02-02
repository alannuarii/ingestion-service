import net from 'net';
import jsmodbus from 'jsmodbus';
import { logger } from '../utils/logger.js';
import { config } from '../../config/default.js';
import fs from 'fs';
import { ParserService } from './parser-service.js';
import { timescaleService } from './timescale-service.js';

const devicesConfig = JSON.parse(fs.readFileSync(new URL('../../config/devices.json', import.meta.url)));

class ModbusConnection {
    constructor(deviceConfig) {
        this.name = deviceConfig.name;
        this.ip = deviceConfig.ip;
        this.port = deviceConfig.port;
        this.requests = deviceConfig.requests;
        this.socket = new net.Socket();
        this.client = new jsmodbus.client.TCP(this.socket);
        this.isConnected = false;

        this.setupConnection();
    }

    setupConnection() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            logger.info(`[${this.name}] Modbus Connected to ${this.ip}:${this.port}`);
        });

        this.socket.on('error', (err) => {
            logger.error(`[${this.name}] Connection Error: ${err.message}`);
        });

        this.socket.setTimeout(10000); // 10s Timeout
        this.socket.on('timeout', () => {
            logger.warn(`[${this.name}] Connection Timed Out. Destroying socket...`);
            this.socket.destroy();
            this.isConnected = false;
        });

        this.socket.on('close', () => {
            this.isConnected = false;
            logger.warn(`[${this.name}] Connection Closed. Reconnecting in 5s...`);
            setTimeout(() => this.connect(), 5000);
        });

        this.connect();
    }

    connect() {
        this.socket.connect({ host: this.ip, port: this.port });
    }

    async poll() {
        if (!this.isConnected) return;

        let mergedData = {};
        let hasData = false;

        for (const req of this.requests) {
            try {
                // Wait for response
                const res = await this.client.readHoldingRegisters(req.startAddr, req.quantity, { unitId: req.unitId });
                const buffer = res.response.body.valuesAsBuffer;

                // Parse
                let parsedData = null;
                if (req.type === 'PM5350') {
                    parsedData = ParserService.parsePM5350(buffer);
                } else if (req.type === 'DSE_ELECTRIC') {
                    parsedData = ParserService.parseDSEMeter(buffer);
                } else if (req.type === 'DSE_POWER') {
                    parsedData = ParserService.parseDSEPower(buffer);
                }

                if (parsedData) {
                    // Merge data from this request into the main object
                    mergedData = { ...mergedData, ...parsedData };
                    hasData = true;
                }

            } catch (err) {
                logger.error(`[${this.name}] Poll Error (Unit ${req.unitId}): ${err.message}`);
            }
        }

        // Save merged data once per cycle (if any data was collected)
        if (hasData) {
            this.handleData(this.name, mergedData);
        }
    }

    handleData(topicName, data) {
        // 1. TimescaleDB (Historical)
        if (config.db.enabled) {
            // topicName is device name (e.g. PM-DG8), used as device_id
            timescaleService.insertLog(topicName, data);
        }
    }
}

export class ModbusService {
    constructor() {
        this.connections = [];
    }

    start() {
        devicesConfig.forEach(device => {
            this.connections.push(new ModbusConnection(device));
        });

        // Start Polling Loop
        setInterval(() => {
            this.pollAll();
        }, config.server.pollInterval);

        logger.info(`Modbus Service Started. Polling ${this.connections.length} devices every ${config.server.pollInterval}ms.`);
    }

    async pollAll() {
        // Poll all devices in parallel (non-blocking)
        this.connections.forEach(conn => conn.poll());
    }
}

export const modbusService = new ModbusService();
