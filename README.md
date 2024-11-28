# COMP308-001 Group-5 Group Project

## **Table of Contents**
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Setup Instructions](#setup-instructions)
4. [Running the Application](#running-the-application)

---

## **Prerequisites**
Before running this application, ensure the following tools are installed on your system:

- **Node.js**
- **npm**
- **MongoDB**

---

## **Project Structure**
The project contains the following key components:

- **client/**: Contains the front-end apps.
  - **auth-app/**: Authentication app for login/signup.
  - **nurse-dashboard-app/**: Dashboard for nurses to manage patients.
  - **patient-dashboard-app/**: Dashboard for patients to track vitals and tips.
  - **shell-app/**: The central app coordinating all micro frontends.
- **server/**: Contains the backend GraphQL microservices and gateway.
  - **microservices/auth-microservice.js**: Handles user authentication and patient queries.
  - **microservices/vital-signs-microservice.js**: Manages patient vitals, tips, and alerts.
  - **gateway.js**: Apollo Gateway for federated GraphQL API.
  - **models/**: MongoDB schemas for Users, Vital Signs, Tips, Symptom Checklists, and Emergency Alerts.
- **init.js**: Script for initializing dependencies in all subprojects.

---

## **Setup Instructions**

### 1. Clone the Repository
```bash
git clone https://github.com/kentayamada-centennial/comp308-001-group5.git
cd comp308-001-group5
```

### 2. Install Dependencies
Run the following command to install all dependencies for both the client and server projects:
```bash
node init.js
```

This script will recursively install dependencies for all subprojects in the `client/` and `server/` directories.

### 3. Configure MongoDB
Ensure MongoDB is running locally or remotely. The connection string is hardcoded as:
```
mongodb://localhost:27017/comp308-001-group5
```

### 4. Start the Backend
Navigate to the `server` directory and start the backend microservices:
```bash
cd server
npm run start:all
```
This will:
- Start the authentication microservice on **http://localhost:3004/graphql**
- Start the vital signs microservice on **http://localhost:3005/graphql**
- Start the GraphQL gateway on **http://localhost:4000/graphql**

### 5. Start the Frontend
Navigate to the `client` directory and start all client apps:
```bash
cd client
npm run start:all
```
This will:
- Start the shell app on **http://localhost:3000**
- Start the auth app on **http://localhost:3001**
- Start the nurse dashboard app on **http://localhost:3002**
- Start the patient dashboard app on **http://localhost:3003**

### 6. Open the Application
Visit **http://localhost:3000** in your browser to access the shell app. You will be redirected to the appropriate dashboard after logging in based on your role.

---

## **Running the Application**

1. **Startup Commands Recap:**
   - Start backend services: `npm run start:all` (in `server/`).
   - Start frontend apps: `npm run start:all` (in `client/`).

2. **User Workflow:**
   - Navigate to **http://localhost:3000**.
   - Log in or sign up using the Auth app.
   - If logged in as:
     - **Nurse**: Access the Nurse Dashboard to view and update patient data.
     - **Patient**: Access the Patient Dashboard to track vitals, submit symptoms, and view tips.