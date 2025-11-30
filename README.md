📘 Employee Management System (Full-Stack Project)

A simple and secure Employee Management System built using the MERN-style architecture (React + Node.js) with SQLite (SQL database).
This project allows admins to manage employee records with full CRUD operations.

✔ Add Employee
✔ View Employee List
✔ Update Employee
✔ Delete Employee
✔ Admin Login (JWT)
✔ SQL Database (SQLite)
✔ Clean Dark UI

Built as part of Prodigy InfoTech – Full-Stack Web Development Internship.

🚀 Features
🔐 Authentication

Admin Login (JWT based)
Default Admin:
username: admin
password: admin123

👨‍💼 Employee Management (CRUD)

Add new employees
View list of employees
Update employee details
Delete employee
Server-side validation
SQL database storage (SQLite)

🎨 Frontend UI

Modern dark dashboard
Responsive design
Employee avatars
Search filter
Clean table layout

🛠 Tech Stack
Frontend:
React (Vite)
Axios
CSS3 Custom UI

Backend:

Node.js
Express.js
SQLite database
JWT Authentication
Bcrypt password hashing
Express Validator

📂 Project Structure
<img width="208" height="344" alt="image" src="https://github.com/user-attachments/assets/45cda340-ce09-4d51-ab8d-d12a600c4b7b" />


⚙️ Backend Setup
1️⃣ Install dependencies
cd backend
npm install

2️⃣ Create .env file
PORT=4000
JWT_SECRET=your_secret_key_here

3️⃣ Start backend
npm run dev


Backend runs at:
🔗 http://localhost:4000

💻 Frontend Setup
1️⃣ Install dependencies
cd client
npm install

2️⃣ Create .env file
VITE_API_URL=http://localhost:4000

3️⃣ Start frontend
npm run dev


Frontend runs at:
🔗 http://localhost:5173

🧪 Testing the API
Login (POST)
POST http://localhost:4000/api/auth/login


Body:

{
  "username": "admin",
  "password": "admin123"
}

Employees CRUD:

POST /api/employees
GET /api/employees
PUT /api/employees/:id
DELETE /api/employees/:id

All routes require JWT token.


🔐 Admin Login

<img width="1469" height="852" alt="image" src="https://github.com/user-attachments/assets/5ab05b96-5ba2-4ce2-8ea9-d3a52e311d42" />


🏢 Dashboard

<img width="1470" height="880" alt="image" src="https://github.com/user-attachments/assets/d69936ba-3655-42c8-89ce-392aa12819d4" />

