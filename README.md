# Secure Connect and Communication Platform — Lab 4

A Node.js + Express backend demonstrating signup/login, bcrypt password hashing, JWT authentication, protected routes, role-based access control (RBAC), a private Notes CRUD API, Socket.IO real-time chat, dotenv configuration, and Node.js EventEmitter events.

## Requirements

- Node.js 18 or newer
- npm

The project uses a small JSON-file data store (`data/users.json` and `data/notes.json`) so it can run without a database server. The files are created automatically on first use. Passwords are stored as bcrypt hashes, never as plain text.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env`, then set a long, private JWT secret:

PowerShell:
```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace `JWT_SECRET` with a random secret. Do not commit `.env`.

Start the server:
```bash
npm start
```

Server: `http://localhost:5000`

## REST API (Postman)

For JSON requests, select **Body → raw → JSON** and set `Content-Type: application/json`.

### 1. Signup

`POST /api/auth/signup`

```json
{
  "username": "victor",
  "email": "victor@example.com",
  "password": "123456"
}
```

Expected: `201 Created` with `message`, `id`, `username`, `email`, and `role`.

### 2. Login

`POST /api/auth/login`

```json
{
  "email": "victor@example.com",
  "password": "123456"
}
```

Expected: `200 OK` with a signed JWT in `token`. Copy it for protected requests.

### 3. Protected profile

`GET /api/profile`

Header:
```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Without a token, the API responds with `403` and `{"message":"No token provided"}`.

### 4. Notes CRUD (all require Bearer token)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/notes` | Create a note |
| GET | `/api/notes` | List your notes |
| PUT | `/api/notes/:id` | Update your note |
| DELETE | `/api/notes/:id` | Delete your note |

Create body:
```json
{
  "title": "My First Note",
  "content": "This is my first note of Web Dev III."
}
```

Each user can only read, update, or delete their own notes.

### 5. Role-based access control

`GET /api/admin/users` requires a valid JWT and the `admin` role. New signups receive the `user` role, so normal accounts receive `403 Access denied`. For a local demonstration only, you can change one user's `role` to `admin` in `data/users.json` after signup, then log in again to obtain a token containing the updated role.

## Real-time chat (Socket.IO)

Socket.IO connections must provide the JWT:

```js
const { io } = require("socket.io-client");
const socket = io("http://localhost:5000", {
  auth: { token: "YOUR_JWT_TOKEN" }
});

socket.on("connect", () => {
  socket.emit("chat:message", { text: "Hello team!" });
});

socket.on("chat:message", message => {
  console.log(message);
});
```

Install `socket.io-client` in a separate test client if you want to run this example:
```bash
npm install socket.io-client
```

Open two clients with different registered users to see messages broadcast in the `general` room. The server logs connections, disconnections, and chat activity.

## Event-driven features

`utils/events.js` uses Node's built-in `EventEmitter` and listens for:
- `user:registered`
- `note:created`
- `chat:message`

These events are emitted by the corresponding routes/socket handler and logged in the server terminal.

## Expected demonstrations

1. Signup returns `201 Created`.
2. Login returns `200 OK` and a JWT.
3. `GET /api/notes` without a token returns `403 Forbidden`.
4. The same request with `Authorization: Bearer <token>` returns the current user's notes.
5. Creating a note returns `201 Created`.
6. Authenticated Socket.IO clients exchange messages in real time.
7. EventEmitter messages appear in the server terminal.

## Important security notes

- `.env` is ignored by Git. Commit `.env.example`, never `.env`.
- Do not use the sample password in a real deployment.
- Use HTTPS and a restricted CORS origin in production.
- The JSON store is intended for this classroom lab/demo, not concurrent production workloads.
