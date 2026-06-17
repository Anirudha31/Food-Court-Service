# Food Court Management System

## Overview
The Smart Food-Court & Cafe Management System is a production-ready, full-stack web ecosystem engineered to modernize the dining and ordering experience in high-traffic cafeterias, food courts, and cafes. By replacing traditional, slow physical queues with a snappy, mobile-responsive digital pipeline, the application automates the journey from browsing a live menu to secure checkout and instant kitchen fulfillment.

## LIVE Demo
LIVE link - [ Click here & wait sometime ](https://food-court-service.onrender.com)
**User Interface Access-> (ID - github1 )(Password - github123)
**Staff Panel Access-> (ID - GitHubStaff )(Password - githubstaff123)

## Features
 ** User Interface: ** A mobile-responsive frontend for users to browse the menu, add items to their cart, and place orders seamlessly from any device .---
 ** Staff & Admin Panels: ** Secure login portals for staff to manage live orders and for admins to update the menu, control staff access, and monitor operations .---
 ** QR Code Verification: ** Secure and automated order pickup system that utilizes unique, dynamically generated QR codes for each transaction .---
 ** Database Management: ** Fully integrated with MongoDB for persistent storage of menu inventories, real-time order tracking, and secure staff credentials .

## Tech Stack
 ** Frontend :  HTML5, CSS3, Vanilla JavaScript---
 ** Backend :  Node.js, Express.js---
 ** Database :  MongoDB---
 ** Payment Gateway : Razorpay
 
## Installation & Setup

1. Clone the Repository :
   
   `git clone https://github.com/Anirudha31/Food-Court-Service.git`
   
2. Install Dependencies :
   ** Ensure you have Node.js & npm installed ,
   then go to "Backend" folder by :
     `cd Backend`
   then install backend dependencies by : 
     `npm install` or  `npm i`

3. Environment Configuration :
   Create a `.env` file in the "Backend" directory and add your MONGODB_URI , JWT_SECRET , RAZORPAY_KEY_ID , RAZORPAY_KEY_SECRET same as in `.env.example` file .
   
4. Initial Data Entry :
    Run ` node seed.js ` for initial data entry to database and you will get the all initial login ID & password .

6. Start the Server :  
    Run  ` node server.js ` for start the backend server .
   
 * The server will start and connect to MongoDB. *

7. Access the Application :
   Open your web browser and navigate to `http://localhost:5000` to view the frontend.

## Developer
** Anirudha Khanrah **
