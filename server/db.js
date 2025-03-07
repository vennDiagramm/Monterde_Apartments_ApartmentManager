require('dotenv').config(); // Load environment variables from .env file
const mysql = require("mysql2");

// Create the connection pool using the DATABASE_URL from .env
const pool = mysql.createPool({
    // Using individual connection parameters instead of uri
    host: process.env.DB_HOST || 'shuttle.proxy.rlwy.net',
    port: process.env.DB_PORT || '17717',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'qHKhdTwVXrxzbrBKaStayQeCASakRwEA',
    database: process.env.DB_NAME || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Error handling for the pool connection
pool.on('connection', (connection) => {
    console.log('Database connection established');
});

pool.on('error', (err) => {
    console.error('Unexpected database error', err);
});

// Use pool.promise() for async queries
module.exports = pool.promise();