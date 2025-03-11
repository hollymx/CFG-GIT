npm install express
npm install cors body-parser

npm install mysql2

npm install dotenv

create. env file 
DB_PASSWORD=your_mysql_password
replace with your password

To run
npm start


create MySQL Database 

CREATE DATABASE IF NOT EXISTS hairdresser;

USE hairdresser;

CREATE TABLE IF NOT EXISTS stylist (

  stylist_id INT AUTO_INCREMENT PRIMARY KEY,
  
  stylist_name VARCHAR(255) NOT NULL,
  
  availability INT NOT NULL,
  
  status ENUM('available', 'no availability') NOT NULL DEFAULT 'available'
  
);

CREATE TABLE IF NOT EXISTS bookings (

  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  
  customer VARCHAR(255) NOT NULL,
  
  appointment_time DATETIME NOT NULL,
  
  stylist_id INT NOT NULL,
  
  FOREIGN KEY (stylist_id) REFERENCES stylist(stylist_id)
);

INSERT INTO stylist (stylist_name, availability, status)
VALUES
  ('Alice', 5, 'available'),
  ('Craig', 3, 'available'),
  ('Ben', 5, 'available'),
  ('Sue', 4, 'available');



postman 

create booking
POST http://localhost:3000/booking
{
    "customer": "Holly Macleod",
    "appointment_time": "2025-03-12 14:30:00",
    "stylist_id": "1"
}

POST http://localhost:3000/booking
{
    "customer": "Harry Mick",
    "appointment_time": "2025-10-10 10:30:00",
    "stylist_id": "2"
}

Delete booking
DELETE http://localhost:3000/booking/2

update stylists availability
PUT http://localhost:3000/stylist/3
{
  "availability": 3,
  "status": "available"
}
