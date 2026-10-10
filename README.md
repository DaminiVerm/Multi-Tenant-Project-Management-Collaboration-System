# ProjectHub – Project Management App

## About the Project

ProjectHub is a full-stack project management application built using the MERN stack. It helps teams organize projects, manage tasks, track progress, and collaborate efficiently.

## Features

- User registration and login
- JWT-based authentication
- Organization and project management
- Create, update, and delete tasks
- Task status management (To Do, In Progress, Review, Done)
- Task priority and assignment
- Search and filter tasks
- Drag-and-drop task management
- Real-time updates using Socket.IO
- Notifications and activity logs
- Role-based access control

## Tech Stack

### Frontend
- React.js
- Vite
- Axios
- React Router
- @dnd-kit
- Socket.IO Client

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs
- Zod
- Socket.IO

## Project Structure

```text
project-management-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
│
└── README.md
```

## Prerequisites

Make sure you have installed:

- Node.js and npm
- MongoDB (local installation or MongoDB Atlas)
- Git (optional)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd project-management-app
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret_key
```

Replace the MongoDB connection string and JWT secret with your own values.

Start the backend:

```bash
npm run dev
```

If your project does not have a `dev` script, use the start command configured in your `backend/package.json`.

### 3. Set Up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens |

Do not commit your `.env` file or expose your JWT secret.

## Application Workflow

1. Register an account or sign in.
2. Access your organization.
3. Create or select a project.
4. Add tasks and assign priorities or team members.
5. Update task statuses as work progresses.
6. Track changes and receive notifications.

## API Overview

The backend provides REST API endpoints for authentication, organizations, projects, tasks, notifications, and audit logs.

Common task operations may include:

- `GET /api/tasks` – Retrieve tasks
- `POST /api/tasks` – Create a task
- `PUT /api/tasks/:id` – Update a task
- `DELETE /api/tasks/:id` – Delete a task

Exact routes depend on the backend route configuration.

## Future Improvements

- Team collaboration enhancements
- Advanced reporting and analytics
- Email notifications
- Improved mobile responsiveness
- Deployment to cloud hosting platforms

## Author

Damini Verma

Computer Science Graduate | MERN Stack Developer
