# Lab 4: Secure Connect and Communication Platform (Web Dev III)

Node.js + Express + JWT + bcrypt + dotenv + Socket.IO + MongoDB (Mongoose).
No auth boilerplate, no chat frameworks.

## Run
1. Start MongoDB locally (or use an Atlas URI).
2. `npm install`
3. `cp .env.example .env` and set `JWT_SECRET` (and `MONGO_URI` if needed)
4. `npm start`  -> `[server] listening on http://localhost:5000`
5. Open http://localhost:5000 for the chat client, or use Postman for the API.

## API
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/signup | public | `{username,email,password}` -> 201 `User registered` |
| POST | /api/auth/login | public | `{email,password}` -> 200 `Login successful` + `token` (also sets `token` cookie) |
| POST | /api/auth/logout | public | clears cookie |
| GET | /api/auth/me | JWT | current user |
| POST | /api/notes | JWT | create note `{title,content}` -> 201 |
| GET | /api/notes | JWT | list own notes (admin: `?all=true` for all) |
| GET | /api/notes/:id | JWT | read one (owner/admin) |
| PUT | /api/notes/:id | JWT | update (owner/admin) |
| DELETE | /api/notes/:id | JWT | delete (owner/admin) |
| GET | /api/admin/users | JWT + admin | list users (RBAC) |
| DELETE | /api/admin/users/:id | JWT + admin | delete user and their notes |

No token -> `403 {"message":"No token provided"}`. Bad/expired token -> `401`.
Send the token as `Authorization: Bearer <token>` or as a `token` cookie.

Make an admin: add `"adminKey": "<ADMIN_SIGNUP_KEY from .env>"` to the signup body.

## Socket.IO
Connect with `io({ auth: { token } })`. Events:
- server -> client: `joinedRoom`, `history`, `chatMessage`, `systemMessage`, `typing`
- client -> server: `joinRoom(room)`, `leaveRoom(room)`, `chatMessage({room,text})`, `typing(room)`

Default room is `general`. Messages are saved in MongoDB.

## EventEmitter
`events/appEvents.js` defines listeners for `user:registered`, `user:login`,
`user:loginFailed`, `note:created`, `note:updated`, `note:deleted`, `chat:message`.
Routes and sockets only emit; the listeners log. That produces the console output
shown in Fig 3 (`[general] Aditi: ...`).

## Folder structure
```
server.js          app + http + socket bootstrap
config/db.js       MongoDB connection
models/            User, Note, Message
middleware/auth.js verifyToken + authorizeRoles (RBAC)
routes/            auth, notes, admin
socket/chat.js     JWT-authenticated Socket.IO chat
events/appEvents.js EventEmitter listeners
public/index.html  minimal chat client
```
