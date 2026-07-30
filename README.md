# Task Manager

A small project and task management app. Admins create projects and manage their members, members work on the tasks of the projects they belong to.

- **Backend:** Express 5, MongoDB with Mongoose, JWT auth, bcrypt, express-validator
- **Frontend:** React 19 (Vite), React Router, axios, Tailwind CSS 4
- **Tests:** Jest + Supertest with an in-memory MongoDB

## Implemented Features

### Core Requirements

**Authentication**

- Register and login
- JWT authentication
- Password hashing with bcrypt
- Protected routes
- Admin and Member roles

**Projects**

- Create, read, update and delete projects
- Admin can add and remove project members
- Users only see projects they have access to

**Tasks**

- Create, read, update and delete tasks
- Fields: title, description, status, priority, dueDate, creator, assignee
- Status: Todo, In Progress, Done
- Filtering by status, priority and assignee
- Unauthorized access prevented

**Frontend**

- Login page and register page
- Dashboard
- Project list and project details pages
- Task management UI
- Responsive design using Tailwind CSS
- Loading, empty, success and error states
- Client-side validation

**Backend**

- REST APIs with proper status codes
- Request validation
- Centralized error handling
- Environment variables
- MongoDB persistence with Mongoose
- Seed data for one admin, two members and sample project and task data

**Testing**

- 17 backend tests with Jest and Supertest

**Documentation**

- README, `.env.example` and Postman collection

### Bonus Features

- Pagination, sorting and search for projects and tasks
- Swagger / OpenAPI documentation served at `/api/docs`
- Docker Compose setup for the Express app and MongoDB

## Requirements

- Node.js 18 or newer
- For option 1: MongoDB running locally, or a MongoDB Atlas connection string
- For option 2: Docker Desktop

## Running the Project

There are two supported ways to start the backend. The frontend runs the same way in both, so pick one option below and then follow the frontend step.

### Option 1: Run locally

Backend and MongoDB both on your machine.

```bash
cd Backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

The API runs on http://localhost:5000. `MONGO_URI` in `Backend/.env` points at `mongodb://127.0.0.1:27017/task-manager` by default, so change it if you use Atlas.

### Option 2: Run with Docker

The API and MongoDB run in containers, the frontend still runs on your machine. No local MongoDB needed.

From the project root:

```bash
docker compose up -d --build
docker compose exec api npm run seed
```

The API runs on http://localhost:5000. MongoDB is published on **27018** on the host so it does not clash with a local MongoDB on 27017, and its data lives in the `mongo-data` volume so it survives a restart.

The API waits for MongoDB's healthcheck before starting, otherwise it would exit on the first connection attempt. Set `JWT_SECRET` and `CLIENT_URL` in a `.env` file next to `docker-compose.yml` to override the defaults.

```bash
docker compose logs -f api
docker compose down
docker compose down -v
```

The last command also deletes the database volume.

### Frontend

Needed for both options.

```bash
cd Frontend
npm install
cp .env.example .env
npm run dev
```

The app runs on http://localhost:5173. If Vite reports that port is taken and moves to another one, set `CLIENT_URL` in `Backend/.env` to match, otherwise the API will reject the browser's requests as a CORS error.

## Seeded accounts

`npm run seed` clears the database and inserts one admin, two members, two projects and five tasks.

| Role   | Email                    | Password  |
| ------ | ------------------------ | --------- |
| Admin  | admin@taskmanager.com    | Admin123  |
| Member | sara@taskmanager.com     | Member123 |
| Member | omar@taskmanager.com     | Member123 |

## Environment variables

**Backend/.env**

| Variable         | Description                          |
| ---------------- | ------------------------------------ |
| `PORT`           | API port, defaults to 5000           |
| `MONGO_URI`      | MongoDB connection string            |
| `JWT_SECRET`     | Secret used to sign tokens           |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d`     |
| `CLIENT_URL`     | Allowed origin for CORS              |

**Frontend/.env**

| Variable        | Description                                        |
| --------------- | -------------------------------------------------- |
| `VITE_API_URL`  | API base URL, defaults to http://localhost:5000/api |

## Scripts

| Command        | Where    | Description                        |
| -------------- | -------- | ---------------------------------- |
| `npm run dev`  | Backend  | Start the API with nodemon         |
| `npm start`    | Backend  | Start the API                      |
| `npm run seed` | Backend  | Reset the database with demo data  |
| `npm test`     | Backend  | Run the test suite                 |
| `npm run dev`  | Frontend | Start the Vite dev server          |
| `npm run build`| Frontend | Build for production               |

## Permissions

| Action                        | Admin | Member                       |
| ----------------------------- | ----- | ---------------------------- |
| See a project                 | All   | Only projects they belong to |
| Create / update / delete      | Yes   | No                           |
| Add / remove project members  | Yes   | No                           |
| See and create tasks          | All   | Only in their projects       |
| Update a task                 | Yes   | Only in their projects       |
| Delete a task                 | Yes   | Only tasks they created      |

Project access is decided in one place: the `canAccess` method on the project model. Task routes load the task's project and reuse it, so tasks can never be reached through a project the user has no access to.

## API

All routes are prefixed with `/api`. Every route except register and login needs an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint         | Description                     |
| ------ | ---------------- | ------------------------------- |
| POST   | `/auth/register` | Create an account (role member) |
| POST   | `/auth/login`    | Log in and get a token          |
| GET    | `/auth/me`       | Current user                    |

### Users

| Method | Endpoint | Description                |
| ------ | -------- | -------------------------- |
| GET    | `/users` | List all users, admin only |

### Projects

| Method | Endpoint                        | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/projects`                     | Projects the user can see  |
| GET    | `/projects/:id`                 | A single project           |
| POST   | `/projects`                     | Create a project, admin    |
| PUT    | `/projects/:id`                 | Update a project, admin    |
| DELETE | `/projects/:id`                 | Delete a project, admin    |
| POST   | `/projects/:id/members`         | Add a member, admin        |
| DELETE | `/projects/:id/members/:userId` | Remove a member, admin     |

### Tasks

| Method | Endpoint     | Description                    |
| ------ | ------------ | ------------------------------ |
| GET    | `/tasks`     | List tasks, supports filters   |
| GET    | `/tasks/:id` | A single task                  |
| POST   | `/tasks`     | Create a task                  |
| PUT    | `/tasks/:id` | Update a task                  |
| DELETE | `/tasks/:id` | Delete a task                  |

Filters for `GET /tasks`: `project`, `status` (`Todo`, `In Progress`, `Done`), `priority` (`Low`, `Medium`, `High`) and `assignee`. Without a `project` filter the response contains the tasks of every project the user can access.

```
GET /api/tasks?project=<id>&status=Todo&priority=High
```

### Pagination, sorting and search

`GET /projects` and `GET /tasks` accept these query parameters:

| Parameter | Default       | Notes                                                             |
| --------- | ------------- | ----------------------------------------------------------------- |
| `page`    | `1`           | Must be 1 or more                                                 |
| `limit`   | `10`          | Between 1 and 100, anything larger is rejected with a 400         |
| `search`  | none          | Case insensitive, matches name/description or title/description   |
| `sort`    | `-createdAt`  | Prefix with `-` for descending                                    |

Sortable fields are `createdAt` and `name` for projects, and `createdAt`, `dueDate`, `title` and `status` for tasks. An unknown sort field is ignored and the default is used instead, so a bad value never breaks the request. Search terms are escaped before being used as a regular expression, so a value like `.*` is matched literally.

Both endpoints answer with a page wrapper:

```json
{
  "items": [],
  "total": 12,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

### Status codes

| Code | When                                             |
| ---- | ------------------------------------------------ |
| 200  | Successful read, update or delete                |
| 201  | Resource created                                 |
| 400  | Validation failed or invalid id                  |
| 401  | Missing, invalid or expired token, bad login     |
| 403  | Authenticated but not allowed                    |
| 404  | Resource or route not found                      |
| 409  | Email already registered, user already a member  |

Validation errors come back in a consistent shape:

```json
{
  "message": "Validation failed",
  "errors": [{ "field": "password", "message": "Password must be at least 6 characters" }]
}
```

## API documentation

Swagger UI is served by the API itself:

- http://localhost:5000/api/docs
- http://localhost:5000/api/docs.json for the raw OpenAPI 3.0 document

The spec lives in `Backend/src/openapi.json`. Click **Authorize** in Swagger UI and paste a token from `POST /auth/login` to try the protected endpoints.

## Postman

Import `postman_collection.json`. Run **Auth → Login (admin)** first, it stores the token in a collection variable so every other request is authenticated. **Projects → List projects** stores the first project id in the same way.

## Tests

```bash
cd Backend
npm test
```

17 tests run against an in-memory MongoDB, so no local database is needed. They cover registration and validation, login failures, protected routes, role permissions, project visibility per user, member management, task creation rules, task filtering, pagination, sorting, search and delete permissions.

## Project structure

```
docker-compose.yml         api + mongodb
postman_collection.json

Backend/
  Dockerfile
  src/
    app.js                 express app, routes and error handling
    server.js              database connection and server start
    seed.js                demo data
    constants.js           task status and priority values
    query.js               pagination, sorting and search helpers
    openapi.json           swagger / openapi document
    models/                user, project, task
    middleware/            auth, validate, errorHandler
    routes/                auth, users, projects, tasks
    controllers/           request handlers
  tests/                   jest + supertest

Frontend/
  src/
    api.js                 axios instance and error helper
    taskMeta.js            statuses, priorities, badge styles, date helpers
    context/AuthContext.jsx
    components/            navbar, layout, modal, forms, toast, pagination
    pages/                 login, register, dashboard, projects, project details
```

## Notes on the design

- Controllers talk to Mongoose directly. With three models a service or repository layer would only add indirection.
- Express 5 forwards rejected promises to the error middleware, so controllers do not need try/catch. Expected failures answer with a status code directly, the central handler deals with unexpected errors, cast errors and duplicate keys.
- Tasks are a flat resource with a `project` query parameter instead of nested routes. That keeps one router and lets the dashboard list tasks across all projects.
- The frontend keeps state in the page that needs it. Only authentication is shared through context.
- Pagination, sorting and search share four small functions in `query.js` instead of a plugin or a base controller. Sort fields are whitelisted and search terms are escaped, so untrusted query strings cannot reach the database as operators.
- The OpenAPI document is a plain JSON file rather than annotations collected from the code, which keeps the route files free of large comment blocks.
- The dashboard counts tasks over the first 100 results. Exact totals and pagination pull in opposite directions and a single page of counters is enough for the overview.
