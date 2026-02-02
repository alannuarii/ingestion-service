import { logger } from '../utils/logger.js';

export class ParserService {
    /**
     * Parses buffer for PM5350 devices (FloatBE)
     * Based on Node-RED flow for PM_DG8, PM_DG9
     * @param {Buffer} buffer 
     * @returns {Object} Parsed data
     */
    /**
     * Safely parse float and cap at max value to prevent DB overflow
     */
    static safeParse(val, divisor = 1) {
        const MAX_VAL = 999999.99; // Matches typical NUMERIC(10,2) limit roughly
        let parsed = parseFloat((val / divisor).toFixed(2));
        if (parsed > MAX_VAL) return null; // Assume invalid/overflow reading
        if (parsed < -MAX_VAL) return null;
        return parsed;
    }

    /**
     * Parses buffer for PM5350 devices (FloatBE)
     * Based on Node-RED flow for PM_DG8, PM_DG9
     * @param {Buffer} buffer 
     * @returns {Object} Parsed data
     */
    static parsePM5350(buffer) {
        try {
            return {
                currentL1: ParserService.safeParse(buffer.readFloatBE(0)),
                currentL2: ParserService.safeParse(buffer.readFloatBE(4)),
                currentL3: ParserService.safeParse(buffer.readFloatBE(8)),
                voltageL1L2: ParserService.safeParse(buffer.readFloatBE(40)),
                voltageL2L3: ParserService.safeParse(buffer.readFloatBE(44)),
                voltageL3L1: ParserService.safeParse(buffer.readFloatBE(48)),
                activePower: ParserService.safeParse(buffer.readFloatBE(120)),
                reactivePower: ParserService.safeParse(buffer.readFloatBE(136)),
                powerFactor: ParserService.safeParse(buffer.readFloatBE(168)),
                frequency: ParserService.safeParse(buffer.readFloatBE(220)),
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
                frequency: ParserService.safeParse(buffer.readUInt16BE(0), 10),
                voltageL1L2: ParserService.safeParse(buffer.readUInt32BE(14), 10),
                voltageL2L3: ParserService.safeParse(buffer.readUInt32BE(18), 10),
                voltageL3L1: ParserService.safeParse(buffer.readUInt32BE(22), 10),
                currentL1: ParserService.safeParse(buffer.readUInt32BE(26), 10),
                currentL2: ParserService.safeParse(buffer.readUInt32BE(30), 10),
                currentL3: ParserService.safeParse(buffer.readUInt32BE(34), 10),
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
                activePower: ParserService.safeParse(buffer.readInt32BE(0), 1000),
                reactivePower: ParserService.safeParse(buffer.readInt32BE(32), 1000),
                powerFactor: ParserService.safeParse(buffer.readInt16BE(42), 100),
            };
        } catch (error) {
            logger.error('Error parsing DSE Power buffer:', error);
            return null;
        }
    }
}
