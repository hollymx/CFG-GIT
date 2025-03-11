require('dotenv').config();
const express = require('express')
const mysql = require('mysql2')
const app = express()
const PORT = 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});

// MySQL connection
const pool = mysql.createPool({
    host: 'localhost', 
    user: 'root', 
    password: process.env.DB_PASSWORD, 
    database: 'hairdresser',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0 
});

app.use(express.json())

// Stylist availability
app.get('/stylist', (req, res) => {
    const sql = 'SELECT * FROM stylist WHERE availability > 0 AND status = "available"'
    pool.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching stylists:', err.message)
            return res.status(500).json({ error: err.message })
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'No availability' })
        }

        return res.status(200).json(result)
    });
});

// Booking which updates availability
app.post('/booking', (req, res) => {
    // Log the request body to ensure data is being received
    console.log("Request body:", req.body)

    const { customer, appointment_time, stylist_id } = req.body

    // Required fields for customer to fill in
    if (!customer || !appointment_time || !stylist_id) {
        return res.status(400).json({ error: "Please provide all required information" })
    }

    // Check stylist availability
    const checkStylistAvailability = 'SELECT * FROM stylist WHERE stylist_id = ?'
    pool.query(checkStylistAvailability, [stylist_id], (err, result) => { 
        if (err) {
            console.error('Error checking stylist availability', err.message)
            return res.status(500).json({ error: 'Error booking appointment' })
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Stylist unavailable.' })
        }

        const stylist = result[0]

        // If stylist is available
        if (stylist.availability <= 0 || stylist.status === 'no availability') {
            return res.status(400).json({ error: 'Stylist is fully booked or unavailable.' })
        }

        // Create booking
        const createBooking = 'INSERT INTO bookings (customer, appointment_time, stylist_id) VALUES (?, ?, ?)'
        pool.query(createBooking, [customer, appointment_time, stylist_id], (err, result) => {
            if (err) {
                console.error('Error creating booking', err.message)
                return res.status(500).json({ error: 'Error creating booking.' })
            }

            // Update stylist availability
            const updateAvailability = 'UPDATE stylist SET availability = availability - 1 WHERE stylist_id = ?'
            pool.query(updateAvailability, [stylist_id], (err) => {
                if (err) {
                    console.error('Error updating stylist availability', err.message)
                    return res.status(500).json({ error: 'Error updating stylist availability.' })
                }

                // If the stylist is fully booked, update status
                if (stylist.availability - 1 <= 0) {
                    const updateStatus = 'UPDATE stylist SET status = "no availability" WHERE stylist_id = ?'
                    pool.query(updateStatus, [stylist_id], (err) => {
                        if (err) {
                            console.error('Error updating stylist status', err.message)
                            return res.status(500).json({ error: 'Error updating stylist status.' })
                        }

                        return res.status(201).json({ message: 'Booking created successfully' })
                    })
                } else {
                    return res.status(201).json({ message: 'Booking created successfully.' })
                }
            })
        })
    })
})

// Delete booking
app.delete('/booking/:booking_id', (req, res) => {
    const bookingId = req.params.booking_id
    console.log(`Deleting booking with ID: ${bookingId} = ?`)

    const deleteBookingSql = 'DELETE FROM bookings WHERE booking_id = ?'
    pool.query(deleteBookingSql, [bookingId], (err, result) => {
        if (err) {
            console.error('Error deleting booking:', err.message);
            return res.status(500).json({ error: 'Error deleting booking.' })
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Booking ${bookingId} cancelled` })
        }

            // Update stylist availability after deletion
            const updateAvailability = 'UPDATE stylist SET availability = availability + 1 WHERE stylist_id = ?'
            pool.query(updateAvailability, [result[0].stylist_id], (err) => {
                if (err) {
                    console.error('Error updating stylist availability:', err.message)
                    return res.status(500).json({ error: 'Error updating stylist availability.' })
                }

                return res.status(200).json({ message: `Booking ${bookingId} deleted successfully` })
            })
        })
    })

    //manual update of stylists availability 
    app.put('/stylist/:stylist_id', (req, res) => {
        const stylistId = req.params.stylist_id;
        const { availability } = req.body;

        if (availability === undefined) {
            return res.status(400).json({ error: "Please provide availability." });
        }
        if (availability < 0) {
            return res.status(400).json({ error: "Availability cannot be negative." });
        }

        const updateAvailability = 'UPDATE stylist SET availability = ? WHERE stylist_id = ?';
         pool.query(updateAvailability, [availability, stylistId], (err, result) => {
        if (err) {
            console.error('Error updating stylist availability', err.message);
            return res.status(500).json({ error: 'Error updating stylist availability.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Stylist ${stylistId} not found.` });
        }

        return res.status(200).json({ message: `Stylist ${stylistId} availability updated successfully.` });
    });
});
    
