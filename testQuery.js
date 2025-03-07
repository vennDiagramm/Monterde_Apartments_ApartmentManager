// Example query to test the connection
async function testQuery() {
    try {
        const [rows, fields] = await pool.query("SELECT * FROM room LIMIT 10");
        console.log(rows); // Display the results
    } catch (err) {
        console.error('Error querying the database:', err);
    }
}

testQuery(); // Call the function to test the connectionnode testQuery.js

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const [result] = await db.query('SELECT 1 + 1 AS result');
        res.json({ 
            message: 'Database connection successful', 
            result: result[0].result,
            connectionDetails: {
                host: process.env.DB_HOST,
                database: process.env.DB_NAME
            }
        });
    } catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({ 
            error: 'Database connection failed', 
            details: error.message 
        });
    }
});
