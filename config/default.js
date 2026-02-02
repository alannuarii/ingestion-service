import dotenv from 'dotenv';
dotenv.config();

export const config = {
    server: {
        port: process.env.PORT || 3000,
        pollInterval: process.env.POLL_INTERVAL || 3000,
    },
    db: {
        enabled: process.env.ENABLE_DB_WRITE === 'true',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
    },
};
