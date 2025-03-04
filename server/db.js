const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost', // or your MySQL server IP
    user: 'root', // or another MySQL user
    password: '',
    database: 'db_dorm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Use pool.promise() for async queries
module.exports = pool.promise();
