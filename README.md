<<<<<<< HEAD
# SyncCanvas

**Author & Owner:** Anshul  
**License:** MIT  

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-FF5722)](https://github.com/yjs/yjs)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

**SyncCanvas** is an enterprise-grade, real-time collaborative workspace that merges an **infinite interactive whiteboard** with a **multiplayer code editor** and an **integrated multi-language execution engine**. Built for high-performance engineering teams, hackathons, and technical interviews, SyncCanvas allows developers to brainstorm system architectures, write code together concurrently, and execute programs in real time.

---

## ✨ Features at a Glance

### 🎨 Infinite Collaborative Whiteboard
- **React-Konva Powered Canvas**: High-fps vector rendering supporting infinite pan, zoom, and multi-touch gestures.
- **Rich Creative Toolset**: Freehand pen with custom stroke widths, geometric shapes (rectangles, circles, arrows, lines), sticky notes, and text elements.
- **Multiplayer Presence**: Real-time cursor coordinates and color-coded peer indicators so you always see where your collaborators are working.
- **Undo / Redo & Export**: Full session history management and one-click canvas export to PNG/SVG.

### 💻 Multiplayer Monaco IDE
- **Industry-Standard Editor**: Built on Microsoft Monaco Editor (the core engine behind VS Code) with syntax highlighting, autocomplete, and minimap.
- **Conflict-Free Yjs CRDTs**: Real-time collaborative text synchronization using state-of-the-art CRDT algorithms. Multiple engineers can edit the exact same line simultaneously without merge conflicts or lost keystrokes.
- **Live Peer Awareness**: Colored selection highlights and cursor tags showing each collaborator's active cursor position.

### ⚡ Built-in Code Execution Runner
- **Multi-Language Support**: Execute programs directly in your browser with standard input (stdin) support for:
  - JavaScript (Node.js)
  - TypeScript (`ts-node`)
  - Python (`python3`)
  - C / C++ (`gcc` / `g++`)
  - Java (`openjdk`)
  - Go (`go run`)
  - Rust (`rustc`)
  - Ruby (`ruby`)
  - PHP (`php`)
- **Execution Diagnostics**: Instant capture of stdout, stderr, execution time (in milliseconds), and return codes.

### 🌐 Real-Time Rooms & Communications
- **Room Lifecycle Management**: Instant 6-character room codes for fast sharing and collaboration.
- **Host & Role-Based Permissions**: Room creators can toggle read-only or edit permissions, manage participants, and approve join requests.
- **Integrated In-Room Chat**: Instant team messaging alongside your code and whiteboard canvas.

### 🛡️ Enterprise-Grade Authentication & Storage
- **Security First**: JSON Web Tokens (JWT) with password hashing via Bcrypt, rate limiting, and HTTP-only session cookies.
- **Cloud Database (MongoDB Atlas)**: Production-ready cloud data persistence for user accounts, room state, and collaboration history.
- **Zero-Config Local Fallback**: Automatic local persistent database fallback for seamless offline development.

---

## 🛠️ Architecture & Tech Stack

```text
                     +---------------------------------------+
                     |         SyncCanvas Web Client         |
                     |  (React 18 + Vite + Tailwind/CSS)     |
                     +-------------------+-------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
              [HTTP REST API / Axios]            [WebSockets / Socket.io]
                       |                                   |
                       v                                   v
             +-------------------+               +-------------------+
             | Express REST API  |               | Socket.io Gateway |
             | Auth & Room State |               | Whiteboard & Chat |
             +---------+---------+               +---------+---------+
                       |                                   |
                       |       +-------------------+       |
                       +-----> | Yjs Binary Engine | <-----+
                               |  CRDT Sync Store  |
                               +---------+---------+
                                         |
                               +---------v---------+
                               |   MongoDB Atlas   |
                               |  User & Room Data |
                               +-------------------+
```

### Technology Inventory
- **Frontend**: React 18, Vite, React-Konva, Monaco Editor (`@monaco-editor/react`), Yjs (`y-monaco`, `y-protocols`), Socket.io-client, Lucide Icons.
- **Backend**: Node.js 22, Express.js 5, Socket.io 4, Mongoose 8, JWT, Bcryptjs, Dotenv.
- **Database**: MongoDB Atlas (Cloud) / Persistent Local Fallback Server.

---

## 📂 Project Structure

```text
SyncCanvas/
├── client/                     # Frontend SPA application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/           # Login, Signup, Protected Route wrappers
│   │   │   ├── Dashboard/      # Room cards, creation modal, invite modals
│   │   │   ├── Editor/         # Monaco IDE, language selector, terminal console
│   │   │   ├── Shared/         # Navbar, RoomHeaderBar, ProjectSidebar, Chat
│   │   │   └── Whiteboard/     # Konva Canvas, Drawing Tools, Sticky Notes
│   │   ├── context/            # React AuthContext, SocketContext, WhiteboardContext
│   │   ├── pages/              # Home, Dashboard, Room, Replay, Auth pages
│   │   └── services/           # Axios API instance and Socket.io client
│   ├── index.html              # HTML entrypoint
│   ├── package.json            # Client dependencies
│   └── vite.config.js          # Vite config & API reverse proxy
│
├── server/                     # Backend API & real-time server
│   ├── src/
│   │   ├── config/             # MongoDB database & socket config
│   │   ├── controllers/        # Auth, Room, Session, Admin controllers
│   │   ├── middleware/         # JWT Auth, Role checking, Rate limiting
│   │   ├── models/             # Mongoose schemas (User, Room, Session)
│   │   ├── routes/             # REST route definitions
│   │   ├── services/           # Yjs document store, email delivery
│   │   ├── sockets/            # Socket.io handlers (canvas sync, editor sync)
│   │   ├── app.js              # Express app setup & code runner endpoint
│   │   └── server.js           # HTTP server bootstrapper
│   ├── Dockerfile              # Production container with compilers
│   └── package.json            # Server dependencies
│
├── docs/                       # Specifications & API reference
│   ├── API.md                  # REST endpoints documentation
│   ├── DatabaseSchema.md       # MongoDB collection schemas
│   ├── SocketEvents.md         # WebSocket event protocol reference
│   └── TeamResponsibilities.md # Engineering architecture & ownership
│
├── package.json                # Workspace monorepo root
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on v20 and v22)
- **npm** v9+
- A modern web browser (Chrome, Edge, Firefox, Safari)

### 2. Installation
Clone the repository and install all root, client, and server dependencies with one command:

```bash
git clone https://github.com/SahaiAnshul/SyncCanvas.git
cd SyncCanvas
npm run install-all
```

### 3. Environment Setup
Configure your environment variables in `server/.env` and `client/.env`:

- **`server/.env`**:
  ```env
  PORT=5000
  MONGO_URI=your-mongodb-atlas-connection-string
  CLIENT_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173
  JWT_SECRET=your-secure-jwt-secret
  NODE_ENV=development
  ```

- **`client/.env`**:
  ```env
  VITE_API_URL=/api
  VITE_SOCKET_URL=http://localhost:5000
  ```

*(Template files `.env.example` are provided in both directories for quick reference).*

### 4. Running the Development Servers
Launch both the backend API and frontend client concurrently:

```bash
npm run dev
```

- **Frontend Client:** http://localhost:3000  
- **Backend API:** http://localhost:5000  

To run services individually:
- Client only: `npm run dev:client`
- Server only: `npm run dev:server`

### 5. Production Build
To generate an optimized production bundle:

```bash
npm run build
```

---

## 📄 License & Attribution

Distributed under the **MIT License**. Created and maintained by **Anshul**.
=======
# SyncCanvas
>>>>>>> 6e6d58f982a668803541e3facc64c539ef93fc23
