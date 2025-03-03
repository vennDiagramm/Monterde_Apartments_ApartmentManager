const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost', // or your MySQL server IP
    user: 'root', // or another MySQL user
    password: '',
    database: 'db_dormitory'
});

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});

module.exports = connection;
