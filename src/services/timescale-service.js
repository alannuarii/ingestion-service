import pg from 'pg';
import { config } from '../../config/default.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export class TimescaleService {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    connect() {
        if (!config.db.enabled) {
            logger.info('TimescaleDB Write Disabled.');
            return;
        }

        this.pool = new Pool({
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            database: config.db.database,
        });

        this.pool.on('error', (err) => {
            logger.error('Unexpected error on idle (TimescaleDB) client', err);
            this.isConnected = false;
        });

        // Test connection
        this.pool.connect()
            .then(client => {
                logger.info(`Connected to TimescaleDB at ${config.db.host}:${config.db.port}`);
                this.isConnected = true;
                client.release();
            })
            .catch(err => {
                logger.error('Failed to connect to TimescaleDB:', err.message);
            });
    }

    /**
     * Maps parser keys to DB columns
     */
    mapToColumns(data) {
        return {
            voltage_l1_l2: data.voltageL1L2,
            voltage_l2_l3: data.voltageL2L3,
            voltage_l3_l1: data.voltageL3L1,
            current_l1: data.currentL1,
            current_l2: data.currentL2,
            current_l3: data.currentL3,
            active_power: data.activePower,
            reactive_power: data.reactivePower,
            power_factor: data.powerFactor,
            frequency: data.frequency
        };
    }

    async insertLog(deviceId, data) {
        if (!this.isConnected || !this.pool) return;

        const dbData = this.mapToColumns(data);
        const query = `
            INSERT INTO telemetry_logs (
                time, device_id, 
                voltage_l1_l2, voltage_l2_l3, voltage_l3_l1,
                current_l1, current_l2, current_l3,
                active_power, reactive_power, power_factor, frequency
            ) VALUES (
                NOW(), $1, 
                $2, $3, $4, 
                $5, $6, $7, 
                $8, $9, $10, $11
            )
        `;

        const values = [
            deviceId,
            dbData.voltage_l1_l2 || null,
            dbData.voltage_l2_l3 || null,
            dbData.voltage_l3_l1 || null,
            dbData.current_l1 || null,
            dbData.current_l2 || null,
            dbData.current_l3 || null,
            dbData.active_power || null,
            dbData.reactive_power || null,
            dbData.power_factor || null,
            dbData.frequency || null
        ];

        try {
            await this.pool.query(query, values);
            // logger.debug(`Saved data for ${deviceId}`);
        } catch (err) {
            logger.error(`TimescaleDB Insert Error [${deviceId}]: ${err.message}`);
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            logger.info('TimescaleDB connection pool closed.');
        }
    }
}

export const timescaleService = new TimescaleService();
