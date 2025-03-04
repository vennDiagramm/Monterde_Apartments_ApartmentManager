/** DITO E LAGAY YUNG THING*/
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Database connection

const app = express();
app.use(cors()); // Allows frontend to talk to backend
app.use(express.json()); // Enables JSON parsing
app.use(express.static('public')); // Serves static files (HTML, script.js)

// Get Room List
app.get('/rooms', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM room");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});


// 🔹 Start the Server
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
