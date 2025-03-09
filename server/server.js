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

// Get all rooms with status description
app.get('/viewAll', async (req, res) => {
    try {
        const [rows] = await db.query('CALL GetAllRoomsWithStatus()');
        res.json(rows[0]); // Note: Results are in the first element of the returned array
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});
// End of Get all rooms with status description

// Get rooms by aptLocId
app.get("/getRooms/:aptLocId", async (req, res) => {
    const aptLocId = req.params.aptLocId;
    try {
        const [results] = await db.query('CALL GetRoomsByAptLocId(?)', [aptLocId]);
        res.json(results[0]); // Note: Results are in the first element of the returned array
    } catch (err) {
        console.error("Error fetching rooms:", err);
        res.status(500).json({ error: "Database error" });
    }
});
// End of Get rooms by aptLocId

// Get Full View of Room via aptLocId
app.get("/getFullRoomView/:aptLocId", async (req, res) => {
    const aptLocId = req.params.aptLocId;
    try {
        const [results] = await db.query('CALL GetFullRoomViewByAptLocId(?)', [aptLocId]);
        res.json(results[0]); // Note: Results are in the first element of the returned array
    } catch (err) {
        console.error("Error fetching rooms:", err);
        res.status(500).json({ error: "Database error" });
    }
});
// End of Get Full View of Room via aptLocId

// Update room
app.post("/updateRoom", async (req, res) => {
    const { room_id, floor, tenants, max_renters, price, status } = req.body;
    try {
        const [result] = await db.query(
            'CALL UpdateRoom(?, ?, ?, ?, ?, ?)', 
            [room_id, floor, tenants, max_renters, price, status]
        );
        const affectedRows = result[0][0].affected_rows;
        if (affectedRows > 0) {
            res.json({ message: "Room updated successfully!" });
        } else {
            res.status(404).json({ message: "Room not found or no changes made" });
        }
    } catch (err) {
        console.error("Error updating room:", err);
        res.status(500).json({ error: "Database update failed" });
    }
});
// End of Update room

// Add room
app.post("/addRoom", async (req, res) => {
    const { floor, tenants, max_renters, status, price, apt_loc } = req.body;
    try {
        const [result] = await db.query(
            'CALL AddRoom(?, ?, ?, ?, ?, ?)',
            [floor, tenants, max_renters, status, price, apt_loc]
        );
        const newRoomId = result[0][0].new_room_id;
        res.json({ 
            message: "Room added successfully!", 
            roomId: newRoomId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message || "Database error" });
    }
});
// End of Add room

// Delete Room
app.delete("/deleteRoom/:id", async (req, res) => {
    const roomId = req.params.id;
    try {
        // For procedures with OUT parameters, we need to use a different approach
        const [result] = await db.query(
            `SET @success = FALSE; 
             SET @message = '';
             CALL DeleteRoom(?, @success, @message);
             SELECT @success AS success, @message AS message;`,
            [roomId]
        );
        
        // The result from the SELECT statement will be in the last result set
        const { success, message } = result[result.length - 1][0];
        
        if (success) {
            res.json({ message });
        } else {
            res.status(404).json({ error: message });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred while deleting the room" });
    }
});
// End of Delete Room

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

// Search Function
app.get('/search-tenant/:name', async (req, res) => {
    const connection = await db.getConnection();

    try {
        const name = req.params.name;

        let rows;

        if (name.trim() === "All") {
            [rows] = await connection.query(
                `SELECT 
                    pi.Person_ID, 
                    CONCAT(pi.Person_FName, ' ', COALESCE(pi.Person_MName, ''), ' ', pi.Person_LName) AS FullName, 
                    pi.Person_Contact, 
                    ps.sex_title AS Person_sex,
                    a.Person_Street,
                    b.Brgy_Name,
                    c.City_Name,
                    c.Region_Name
                FROM person_information pi
                LEFT JOIN person_sex ps ON pi.Person_sex = ps.sex_id
                LEFT JOIN person_address pa ON pi.Person_ID = pa.Person_ID
                LEFT JOIN address a ON pa.Address_ID = a.Address_ID
                LEFT JOIN barangay b ON a.Brgy_ID = b.Brgy_ID
                LEFT JOIN city c ON b.City_ID = c.City_ID`
            );
        } else {
            [rows] = await connection.query(
                `SELECT 
                    pi.Person_ID, 
                    CONCAT(pi.Person_FName, ' ', COALESCE(pi.Person_MName, ''), ' ', pi.Person_LName) AS FullName, 
                    pi.Person_Contact, 
                    ps.sex_title AS Person_sex,
                    a.Person_Street,
                    b.Brgy_Name,
                    c.City_Name,
                    c.Region_Name
                FROM person_information pi
                LEFT JOIN person_sex ps ON pi.Person_sex = ps.sex_id
                LEFT JOIN person_address pa ON pi.Person_ID = pa.Person_ID
                LEFT JOIN address a ON pa.Address_ID = a.Address_ID
                LEFT JOIN barangay b ON a.Brgy_ID = b.Brgy_ID
                LEFT JOIN city c ON b.City_ID = c.City_ID
                WHERE pi.Person_FName LIKE ?`,
                [`%${name}%`]
            );
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "No tenant found" });
        }

        res.json(rows);

    } catch (error) {
        console.error("Error searching tenant:", error);
        res.status(500).json({ error: "Failed to search tenant" });
    } finally {
        connection.release();
    }
});


// 🔹 Start the Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});