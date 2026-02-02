import { logger } from '../utils/logger.js';

export class ParserService {
    /**
     * Parses buffer for PM5350 devices (FloatBE)
     * Based on Node-RED flow for PM_DG8, PM_DG9
     * @param {Buffer} buffer 
     * @returns {Object} Parsed data
     */
    static parsePM5350(buffer) {
        try {
            return {
                currentL1: parseFloat(buffer.readFloatBE(0).toFixed(2)),
                currentL2: parseFloat(buffer.readFloatBE(4).toFixed(2)),
                currentL3: parseFloat(buffer.readFloatBE(8).toFixed(2)),
                voltageL1L2: parseFloat(buffer.readFloatBE(40).toFixed(2)),
                voltageL2L3: parseFloat(buffer.readFloatBE(44).toFixed(2)),
                voltageL3L1: parseFloat(buffer.readFloatBE(48).toFixed(2)),
                activePower: parseFloat(buffer.readFloatBE(120).toFixed(2)),
                reactivePower: parseFloat(buffer.readFloatBE(136).toFixed(2)),
                powerFactor: parseFloat(buffer.readFloatBE(168).toFixed(2)),
                frequency: parseFloat(buffer.readFloatBE(220).toFixed(2)),
            };
        } catch (error) {
            logger.error('Error parsing PM5350 buffer:', error);
            return null;
        }
    }

    /**
     * Parses buffer for DSE Electric readings (Current, Voltage, Freq)
     * Based on Node-RED flow for PM_DG1, PM_DG6, PM_DG7 (First Request)
     * @param {Buffer} buffer 
     * @returns {Object} Parsed data
     */
    static parseDSEMeter(buffer) {
        try {
            return {
                frequency: parseFloat((buffer.readUInt16BE(0) / 10).toFixed(2)),
                voltageL1L2: parseFloat((buffer.readUInt32BE(14) / 10).toFixed(2)),
                voltageL2L3: parseFloat((buffer.readUInt32BE(18) / 10).toFixed(2)),
                voltageL3L1: parseFloat((buffer.readUInt32BE(22) / 10).toFixed(2)),
                currentL1: parseFloat((buffer.readUInt32BE(26) / 10).toFixed(2)),
                currentL2: parseFloat((buffer.readUInt32BE(30) / 10).toFixed(2)),
                currentL3: parseFloat((buffer.readUInt32BE(34) / 10).toFixed(2)),
            };
        } catch (error) {
            logger.error('Error parsing DSE Meter buffer:', error);
            return null;
        }
    }

    /**
     * Parses buffer for DSE Power readings (Power, PF)
     * Based on Node-RED flow for PM_DG1_2, PM_DG6_2, PM_DG7_2 (Second Request)
     * @param {Buffer} buffer 
     * @returns {Object} Parsed data
     */
    static parseDSEPower(buffer) {
        try {
            return {
                activePower: parseFloat((buffer.readInt32BE(0) / 1000).toFixed(2)),
                reactivePower: parseFloat((buffer.readInt32BE(32) / 1000).toFixed(2)),
                powerFactor: parseFloat((buffer.readInt16BE(42) / 100).toFixed(2)),
            };
        } catch (error) {
            logger.error('Error parsing DSE Power buffer:', error);
            return null;
        }
    }
}
