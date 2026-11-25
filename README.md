# Lab 4: Secure Connect and Communication Platform

**Course:** Web Dev III | **Unit:** 4 | **Marks:** 2.5

A secure Node.js backend where users can sign up, log in, manage personal notes, and chat in real time. Authentication is built from scratch (no starter kits or chat frameworks).

## Tech Stack

| Tool | Purpose |
|---|---|
| Node.js | Server-side runtime |
| Express.js | Routing and middleware |
| jsonwebtoken (JWT) | Authentication tokens |
| bcrypt | Password hashing |
| dotenv | Environment variables |
| Socket.IO | Real-time chat |
| MongoDB (Mongoose) | Data persistence |
| Node.js EventEmitter | Event-driven features |

## Features

- Signup and login with bcrypt-hashed passwords
- JWT authentication (Bearer header or `token` cookie)
- Protected routes and role-based access control (`user` / `admin`)
- Secure Notes API with full CRUD, scoped to the note owner
- Real-time chat with rooms, typing indicator and saved history; sockets require a valid JWT
- Event-driven logging with EventEmitter

## Setup and Run

```bash
cd secure-connect
npm install
cp .env.example .env     # then set JWT_SECRET
npm start
```

MongoDB must be running (for example `brew services start mongodb-community` on macOS).

`.env` values:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/secure_connect
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=10
ADMIN_SIGNUP_KEY=lab4-admin-key
```

> The screenshots below were taken with `PORT=5001`, because macOS AirPlay Receiver occupies port 5000 by default.

Open `http://localhost:<PORT>` for the chat client.

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | public | Register `{username, email, password}` |
| POST | `/api/auth/login` | public | Returns `token` and sets a cookie |
| POST | `/api/auth/logout` | public | Clears the cookie |
| GET | `/api/auth/me` | JWT | Current user |
| POST | `/api/notes` | JWT | Create note `{title, content}` |
| GET | `/api/notes` | JWT | List own notes (admin: `?all=true`) |
| GET | `/api/notes/:id` | JWT | Read one note |
| PUT | `/api/notes/:id` | JWT | Update note |
| DELETE | `/api/notes/:id` | JWT | Delete note |
| GET | `/api/admin/users` | JWT + admin | List users |
| DELETE | `/api/admin/users/:id` | JWT + admin | Delete user and their notes |

A missing token returns `403 {"message":"No token provided"}`. An invalid or expired token returns `401`.

## Socket.IO Events

- Client to server: `joinRoom`, `leaveRoom`, `chatMessage {room, text}`, `typing`
- Server to client: `joinedRoom`, `history`, `chatMessage`, `systemMessage`, `typing`

## EventEmitter

`events/appEvents.js` listens for `user:registered`, `user:login`, `user:loginFailed`, `note:created`, `note:updated`, `note:deleted` and `chat:message`. Routes and sockets only emit events; the listeners log them to the console.

## Expected Output

### Fig 1. Signup and login responses (Postman)

**Signup: `201 Created`**

<img width="1710" height="1112" alt="Screenshot 2026-11-25 at 5 42 17 PM" src="https://github.com/user-attachments/assets/d7e50b4b-8b9f-48b5-bb5b-f8a0d835328e" />


**Login: `200 OK` with a JWT**

<img width="1710" height="1112" alt="Screenshot 2026-11-25 at 5 23 23 PM" src="https://github.com/user-attachments/assets/169c0ae1-10eb-4d29-85bf-8dff35e5f77f" />


### Fig 2. Notes API: blocked without a token, accessible with a valid JWT

**No token: `403 Forbidden`**

<img width="1710" height="1112" alt="Screenshot 2026-11-25 at 5 28 32 PM" src="https://github.com/user-attachments/assets/e2cf8c9d-2f64-4c2d-b39e-d8b49a10e443" />


**Create a note: `201 Created`**

<img width="1710" height="1112" alt="Screenshot 2026-11-25 at 5 34 39 PM" src="https://github.com/user-attachments/assets/63290885-f02c-4307-9e73-4bbde73c36de" />


**List notes: `200 OK`**

<img width="1710" height="1112" alt="Screenshot 2026-11-25 at 5 40 01 PM" src="https://github.com/user-attachments/assets/3e6bc45b-3b03-460c-9a02-c1f980f87056" />


### Fig 3. Real-time chat activity logged via Socket.IO

<img width="1710" height="1112" alt="Screenshot 2026-11-25 at 10 18 49 PM" src="https://github.com/user-attachments/assets/b0b54cba-7dce-41d2-b10a-063f60cc9c14" />


## Project Structure

```
server.js            App, HTTP server and Socket.IO bootstrap
config/db.js         MongoDB connection
models/              User, Note, Message
middleware/auth.js   verifyToken and authorizeRoles (RBAC)
routes/              auth, notes, admin
socket/chat.js       JWT-authenticated chat
events/appEvents.js  EventEmitter listeners
public/index.html    Minimal chat client
images/              Screenshots used in this README
```

## Concepts Covered

Authentication, Authorization, JWT, bcrypt, Protected Routes, RBAC, dotenv, WebSockets, Socket.IO, EventEmitter, Real-Time Communication
