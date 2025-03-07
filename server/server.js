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

/**     -------     ROOMS API SECTION      -------     **/
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

// Get Room list with Room Status Description
app.get('/viewAll', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.Room_ID, r.Room_floor, r.Number_of_Renters, r.Room_maxRenters, r.Room_Price,
                rs.Room_Status_Desc, al.Apt_Location
                FROM room r
                LEFT JOIN room_status rs ON r.Room_Status_ID = rs.Room_Status_ID
                LEFT JOIN apartment_location al ON r.Apt_Loc_ID = al.Apt_Loc_ID;
        `);
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
    const sql = `SELECT r.Room_ID, r.Room_floor, r.Number_of_Renters, r.Room_maxRenters, r.Room_Price,
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
// End of Get Full View of Room via aptLocId

// UPDATE room below
app.post("/updateRoom", async (req, res) => {
    const { room_id, floor, tenants, max_renters, price, status } = req.body;
    const sql = `
        UPDATE room 
        SET Room_floor = ?, Number_of_Renters = ?, Room_maxRenters = ?, 
            Room_Status_ID = ?, Room_Price = ?
        WHERE Room_ID = ?`;

    try {
        await db.query(sql, [floor, tenants, max_renters, status, price, room_id]);
        res.json({ message: "Room updated successfully!" });
    } catch (err) {
        console.error("Error updating room:", err);
        res.status(500).json({ error: "Database update failed" });
    }
});
// End of UPDATE room

// add room route
app.post("/addRoom", async (req, res) => {
    const { floor, tenants, max_renters, status, price, apt_loc } = req.body;
    const sql = `
        INSERT INTO room (Room_floor, Number_of_Renters, Room_maxRenters, Room_Status_ID, Room_Price, Apt_Loc_ID) 
        VALUES (?, ?, ?, ?, ?, ?)`;
    try {
        await db.query(sql, [floor, tenants, max_renters, status, price, apt_loc]);
        res.json({ message: "Room added successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message || "Database error" });
    }
});
// End of add room route

// Delete Room Route
app.delete("/deleteRoom/:id", async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const roomId = req.params.id;

        // Check if the room exists
        const [[room]] = await connection.query("SELECT 1 FROM room WHERE Room_ID = ?", [roomId]);

        if (!room) {
            await connection.rollback();
            return res.status(404).json({ error: "Room does not exists!" });
        }

        // Delete the room
        const [result] = await connection.query("DELETE FROM room WHERE Room_ID = ?", [roomId]);

        await connection.commit();
        res.json({ message: `Room ${roomId} deleted successfully` });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: "An error occurred while deleting the room" });
    } finally {
        connection.release();
    }
});
// End of Delete Room Route

/**     -------     END OF ROOMS API SECTION      -------     **/


/**     -------     TENANTS API SECTION      -------     **/
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

// Edit Tenant Route
app.put('/edit-tenant/:personId', async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const personIdEdit = req.params.personId;
        const { contact, moveInDate, moveOutDate } = req.body;
        
        // Update Person_Information table
        const [personUpdate] = await connection.query(
            'UPDATE person_information SET Person_Contact = ? WHERE Person_ID = ?',
            [contact, personIdEdit]
        );

        // Retrieve the correct Contract_ID for this Person_ID
        const [contractResult] = await connection.query(
            'SELECT cd.Contract_Details_ID FROM contract_details cd join contract c on cd.contract_details_id = c.contract_id join person_information p on c.person_id = p.person_id WHERE p.person_id = ?',
            [personIdEdit]
        );

        if (contractResult.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Contract not found for this tenant." });
        }

        const contractId = contractResult[0].Contract_Details_ID;

        // Update Contract_Details using the retrieved Contract_ID
        const [contractUpdate] = await connection.query(
            'UPDATE contract_details SET Actual_Move_In_date = ?, MoveOut_date = ? WHERE Contract_Details_ID = ?',
            [moveInDate, moveOutDate, contractId]
        );

        if (personUpdate.affectedRows === 0 || contractUpdate.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "No changes made or tenant not found." });
        }

        await connection.commit();
        res.json({ message: "Tenant updated successfully." });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: "Failed to update tenant." });
    } finally {
        connection.release();
    }
});

// Show Edit Tenant Name
app.get('/get-person-name/:personId', async (req, res) => {
    const connection = await db.getConnection();

    try {
        const personId = req.params.personId;
        console.log(`SERVER PERSON ID: ${personId}`);
        const [result] = await connection.query(
            "SELECT CONCAT(Person_FName, ' ', Person_MName, ' ', Person_LName) AS name FROM person_information WHERE Person_ID = ?",
            [personId]
        );

        if (result.length > 0) {
            res.json({ name: result[0].name });
        } else {
            res.status(404).json({ error: "Person not found" });
        }

    } catch (error) {
        console.error("Error fetching tenant name:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        connection.release();
    }
});
// End of Show Edit Tenant Name

//Payment route
// Fetch Rent Price for Payment Process
app.get('/get-rent-price', async (req, res) => {
    const { personId, roomId } = req.query;

    if (!personId) {
        return res.status(400).json({ error: 'personId is required' });
    }
    if (!roomId) {
        return res.status(400).json({ error: 'roomId is required' });
    }


    try {
        const query = `
            SELECT cb.total_bill AS rent_price
            FROM Contract_Bill cb
            JOIN Contract_Details cd ON cb.Contract_Details_ID = cd.Contract_Details_ID
            JOIN Contract c ON cd.Contract_Details_ID = c.Contract_ID
            WHERE c.person_ID = ? AND cd.Room_ID = ?
        `;

        const [rows] = await db.execute(query, [personId, roomId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No rent price found for this personId or roomId' });
        }

        res.json({ rent_price: rows[0].rent_price });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Payment Process
app.post("/process-payment", async (req, res) => {
    const { personId, roomId, amountPaid, remarks } = req.body;

    if (!personId || !roomId || !amountPaid) {
        return res.status(400).json({ error: "Missing required fields: personId, roomId, or amountPaid" });
    }

    // If remarks is empty or undefined, set it to NULL
    const remarksValue = remarks && remarks.trim() !== "" ? remarks : null;

    const sql = `
        INSERT INTO Payment (Contract_Bill_ID, Date, Amount, Remarks)
        SELECT 
            cb.Contract_Bill_ID, 
            CURDATE() AS Date, 
            ? AS Amount, 
            ? AS Remarks
        FROM Contract_Bill cb
        JOIN Contract_Details cd ON cb.Contract_Details_ID = cd.Contract_Details_ID
        JOIN Contract c ON c.Contract_ID = cd.Contract_Details_ID
        WHERE c.Person_ID = ? AND cd.Room_ID = ?
    `;

    db.query(sql, [amountPaid, remarksValue, personId, roomId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error while processing payment" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No matching contract found for the given personId and roomId" });
        }

        res.json({ success: true, message: "Payment recorded successfully!" });
    });
});
/**     -------     END OF TENANTS API SECTION      -------     **/


// 🔹 Start the Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});