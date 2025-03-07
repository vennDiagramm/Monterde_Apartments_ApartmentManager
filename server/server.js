require('dotenv').config(); // Ensure dotenv is loaded first
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Database connection

const app = express();
const port = process.env.PORT || 3000; // Default to port 3000 if not set in .env

app.use(cors()); // Allows frontend to talk to backend
app.use(express.json()); // Enables JSON parsing
app.use(express.static('public')); // Serve static files from the public folder

// Serve home.html directly from the root (one level up from the 'server' folder)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'home.html')); // Go up one level from 'server'
});

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


// Get rooms by aptLocId
app.get("/getRooms/:aptLocId", async (req, res) => {
    const aptLocId = req.params.aptLocId;
    const sql = "SELECT Room_ID FROM room WHERE Apt_Loc_ID = ? AND Room_Status_ID = 1";

    try {
        const [results] = await db.query(sql, [aptLocId]);
        res.json(results);
    } catch (err) {
        console.error("Error fetching rooms:", err);
        res.status(500).json({ error: "Database error" });
    }
});
// End of Get rooms by aptLocId

// Get Full View of Room via aptLocId
app.get("/getFullRoomView/:aptLocId", async (req, res) => {
    const aptLocId = req.params.aptLocId;
    const sql = `SELECT r.Room_ID, r.Room_floor, r.Number_of_Renters, r.Room_maxRenters, 
                rs.Room_Status_Desc
                FROM room r
                JOIN room_status rs ON r.Room_Status_ID = rs.Room_Status_ID
                WHERE r.Apt_Loc_ID = ?`;

    try {
        const [results] = await db.query(sql, [aptLocId]);
        res.json(results);
    } catch (err) {
        console.error("Error fetching rooms:", err);
        res.status(500).json({ error: "Database error" });
    }
});



// Add Tenant Route
app.post('/add-person', async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { 
            firstName, 
            middleName, 
            lastName, 
            contact, 
            dob, 
            sex,
            street,
            barangay,
            city,
            region,
            roomId,
            apartmentLocation // Apartment Location from the active slide
        } = req.body;

        // Insert person information
        const [personResult] = await connection.query(
            'INSERT INTO person_information (Person_FName, Person_MName, Person_LName, Person_Contact, Person_DOB, Person_sex) VALUES (?, ?, ?, ?, ?, ?)',
            [firstName, middleName || null, lastName, contact, dob, sex]
        );
        const personId = personResult.insertId;

        // Insert City
        const [cityResult] = await connection.query(
            'INSERT INTO city (City_Name, Region_Name) VALUES (?, ?)',
            [city, region]
        );
        const cityId = cityResult.insertId;

        // Insert Barangay
        const [barangayResult] = await connection.query(
            'INSERT INTO barangay (Brgy_Name, City_ID) VALUES (?, ?)',
            [barangay, cityId]
        );
        const barangayId = barangayResult.insertId;

        // Insert Address
        const [addressResult] = await connection.query(
            'INSERT INTO address (Person_Street, Brgy_ID) VALUES (?, ?)',
            [street, barangayId]
        );
        const addressId = addressResult.insertId;

        // Link Person to Address
        await connection.query(
            'INSERT INTO person_address (Person_ID, Address_ID) VALUES (?, ?)',
            [personId, addressId]
        );

        // Insert Occupant
        const [occupantResult] = await connection.query(
            'INSERT INTO occupants (Person_ID) VALUES (?)',
            [personId]
        );
        const occupantId = occupantResult.insertId;

        // Check room capacity
        const [roomCheck] = await connection.query(
            'SELECT Number_of_Renters, Room_maxRenters FROM room WHERE Room_ID = ?',
            [roomId]
        );

        if (roomCheck[0].Number_of_Renters >= roomCheck[0].Room_maxRenters) {
            await connection.rollback();
            return res.status(400).json({ error: "Room is at maximum capacity" });
        }

        // Update room occupancy
        await connection.query(
            'UPDATE room SET Number_of_Renters = Number_of_Renters + 1 WHERE Room_ID = ?',
            [roomId]
        );
        
        let aptLocID;

        if (apartmentLocation.startsWith("Matina")) {
            aptLocID = 1;
        } else if (apartmentLocation.startsWith("Sesame")) {
            aptLocID = 2;
        } else if (apartmentLocation.startsWith("Nabua")) {
            aptLocID = 3;
        } else {
            await connection.rollback();
            return res.status(400).json({ error: "Invalid apartment location" });
        }
        
        // Insert Contract into `contract` table
        await connection.query(
            `INSERT INTO contract (Person_ID, Apt_Loc_ID, Date) VALUES (?, ?, CURDATE())`,
            [personId, aptLocID]
        );
        
        // Insert Contract Details
        await connection.query(
            `INSERT INTO contract_details 
            (Room_ID, Occupants_ID, MoveIn_date, MoveOut_date, Actual_Move_In_Date, Room_Price, Down_Payment) 
            VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), CURDATE(), 
            (SELECT Room_Price FROM room WHERE Room_ID = ?), 0)`,
            [roomId, occupantId, roomId]
        );

        await connection.commit();
        res.json({ personId, message: "Tenant and contract added successfully!" });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: "Failed to add person and contract details" });
    } finally {
        connection.release();
    }
});


// Remove Tenant Route
app.delete('/remove-tenant/:personId', async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const personId = req.params.personId;

        // Remove person information directly
        const [result] = await connection.query(
            'DELETE FROM person_information WHERE Person_ID = ?',
            [personId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Tenant not found or cannot be deleted" });
        }

        await connection.commit();
        res.json({ message: "Tenant removed successfully" });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: "Failed to remove tenant" });
    } finally {
        connection.release();
    }
});

// 🔹 Start the Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});