import http from "http";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import axios from "axios";
import { io } from "socket.io-client";
import * as Y from "yjs";
import mongoose from "mongoose";

// Load environment from server/.env
const envPath = path.resolve("server", ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Ensure JWT secret and origins are configured
process.env.JWT_SECRET = process.env.JWT_SECRET || "synccanvas_super_secret_jwt_key_anshul_2026_collaborate";
const DIAGNOSTIC_PORT = process.env.DIAGNOSTIC_PORT || 5005;
const BASE_URL = `http://localhost:${DIAGNOSTIC_PORT}`;
const SOCKET_URL = `http://localhost:${DIAGNOSTIC_PORT}`;
process.env.CLIENT_ORIGIN = `http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:${DIAGNOSTIC_PORT}`;

// Color formatting for console
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgCyan: "\x1b[46m\x1b[30m",
};

class DiagnosticSuite {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.currentSection = "";
    this.startTime = Date.now();
  }

  section(title) {
    this.currentSection = title;
    console.log(`\n${c.bold}${c.cyan}┌─────────────────────────────────────────────────────────────┐${c.reset}`);
    console.log(`${c.bold}${c.cyan}│ ${title.padEnd(59)} │${c.reset}`);
    console.log(`${c.bold}${c.cyan}└─────────────────────────────────────────────────────────────┘${c.reset}`);
  }

  async runStep(testName, fn) {
    this.totalTests += 1;
    const start = Date.now();
    try {
      const details = await fn();
      const elapsed = Date.now() - start;
      this.passedTests += 1;
      const detailStr = details ? ` ${c.dim}(${details})${c.reset}` : "";
      console.log(`  ${c.green}✔ PASS${c.reset}  ${testName}${detailStr} ${c.dim}[${elapsed}ms]${c.reset}`);
      this.results.push({ section: this.currentSection, test: testName, status: "PASS", elapsed, details });
      return true;
    } catch (err) {
      const elapsed = Date.now() - start;
      this.failedTests += 1;
      console.log(`  ${c.red}✖ FAIL${c.reset}  ${testName} ${c.dim}[${elapsed}ms]${c.reset}`);
      console.log(`         ${c.red}Error: ${err.message}${c.reset}`);
      if (err.response?.data) {
        console.log(`         ${c.yellow}Response Data:${c.reset}`, JSON.stringify(err.response.data));
      }
      this.results.push({ section: this.currentSection, test: testName, status: "FAIL", elapsed, error: err.message });
      return false;
    }
  }
}

// Socket event wait helper
function waitForEvent(socket, eventName, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for socket event '${eventName}' after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once(eventName, (...args) => {
      clearTimeout(timer);
      resolve(args.length === 1 ? args[0] : args);
    });
  });
}

// Wait predicate for socket events that might be emitted multiple times
function waitForEventMatch(socket, eventName, predicate, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, listener);
      reject(new Error(`Timeout waiting for matching '${eventName}' event after ${timeoutMs}ms`));
    }, timeoutMs);

    function listener(...args) {
      const data = args.length === 1 ? args[0] : args;
      if (predicate(data)) {
        clearTimeout(timer);
        socket.off(eventName, listener);
        resolve(data);
      }
    }

    socket.on(eventName, listener);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runFullDiagnostic() {
  console.log(`\n${c.bold}${c.bgCyan}  SYNCCANVAS FULL SYSTEM DIAGNOSTIC SUITE  ${c.reset}`);
  console.log(`${c.dim}Environment : ${process.env.NODE_ENV || "development"}${c.reset}`);
  console.log(`${c.dim}Target Port : ${DIAGNOSTIC_PORT}${c.reset}`);
  console.log(`${c.dim}Timestamp   : ${new Date().toISOString()}${c.reset}\n`);

  const runner = new DiagnosticSuite();

  // Dynamically import server modules
  const appModule = await import("../server/src/app.js");
  const dbModule = await import("../server/src/config/db.js");
  const socketModule = await import("../server/src/sockets/index.js");

  const app = appModule.default;
  const connectDB = dbModule.default;
  const closeDB = dbModule.closeDB;
  const initializeSocket = socketModule.initializeSocket;

  let server;
  let ioServer;
  let dbConnection;

  // Track created test data
  const ts = Date.now();
  const users = {
    alice: {
      name: "Alice Architecture",
      email: `alice_${ts}@diagnostic.local`,
      password: "Password123!",
      token: null,
      id: null,
      socket: null,
    },
    bob: {
      name: "Bob Collaborator",
      email: `bob_${ts}@diagnostic.local`,
      password: "Password123!",
      token: null,
      id: null,
      socket: null,
    },
    charlie: {
      name: "Charlie Observer",
      email: `charlie_${ts}@diagnostic.local`,
      password: "Password123!",
      token: null,
      id: null,
      socket: null,
    },
  };

  let testRoom = {
    id: null,
    roomCode: null,
    roomName: "Distributed Architecture & Canvas Lab",
    description: "End-to-End multi-user synchronization test room",
  };

  try {
    /* ========================================================================= */
    /* 1. INFRASTRUCTURE & HEALTH DIAGNOSTIC                                     */
    /* ========================================================================= */
    runner.section("1. Infrastructure & Health Diagnostics");

    await runner.runStep("Database Connection Initialization", async () => {
      // Clean up any stale lock files from previous runs
      try {
        const lockPath = path.resolve("data", "db", "mongod.lock");
        const wtLockPath = path.resolve("data", "db", "WiredTiger.lock");
        if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
        if (fs.existsSync(wtLockPath)) fs.unlinkSync(wtLockPath);
      } catch {}

      dbConnection = await connectDB();
      if (!dbConnection && mongoose.connection.readyState !== 1) {
        throw new Error("Mongoose connection failed to initialize readyState = 1");
      }
      return `State: Connected (readyState: ${mongoose.connection.readyState})`;
    });

    await runner.runStep("HTTP & WebSocket Gateway Bootstrapping", async () => {
      server = http.createServer(app);
      ioServer = initializeSocket(server);
      await new Promise((resolve, reject) => {
        server.listen(DIAGNOSTIC_PORT, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      return `Listening on http://localhost:${DIAGNOSTIC_PORT}`;
    });

    await runner.runStep("Root Health Check (GET /)", async () => {
      const res = await axios.get(`${BASE_URL}/`);
      if (res.status !== 200 || !res.data.success) {
        throw new Error(`Unexpected response: status ${res.status}`);
      }
      return `Response: "${res.data.message}"`;
    });

    await runner.runStep("System Liveness Check (GET /healthz)", async () => {
      const res = await axios.get(`${BASE_URL}/healthz`);
      if (res.status !== 200 || res.data.status !== "healthy") {
        throw new Error(`Healthz returned status: ${res.data.status}`);
      }
      return "Status: healthy";
    });

    /* ========================================================================= */
    /* 2. AUTHENTICATION FLOW DIAGNOSTIC (MULTIPLE USERS)                        */
    /* ========================================================================= */
    runner.section("2. Authentication & Multi-User Management");

    await runner.runStep("Auth Validation: Weak Password Rejection", async () => {
      try {
        await axios.post(`${BASE_URL}/api/auth/signup`, {
          name: "Weak User",
          email: "weak@test.local",
          password: "short", // < 8 chars, missing rules
        });
        throw new Error("Server allowed invalid password");
      } catch (err) {
        if (err.response?.status === 400) {
          return "Correctly rejected (400 Bad Request)";
        }
        throw err;
      }
    });

    await runner.runStep("Auth Validation: Malformed Email Rejection", async () => {
      try {
        await axios.post(`${BASE_URL}/api/auth/signup`, {
          name: "Invalid Email User",
          email: "invalid-email-string",
          password: "ValidPassword123!",
        });
        throw new Error("Server allowed malformed email");
      } catch (err) {
        if (err.response?.status === 400) {
          return "Correctly rejected (400 Bad Request)";
        }
        throw err;
      }
    });

    await runner.runStep("User 1 Signup (Alice - Room Host)", async () => {
      const res = await axios.post(`${BASE_URL}/api/auth/signup`, {
        name: users.alice.name,
        email: users.alice.email,
        password: users.alice.password,
      });
      if (res.status !== 201 || !res.data.token || !res.data.user?.id) {
        throw new Error("Signup did not return valid token/user");
      }
      users.alice.token = res.data.token;
      users.alice.id = res.data.user.id;
      return `User ID: ${users.alice.id}, Email: ${users.alice.email}`;
    });

    await runner.runStep("Duplicate Signup Prevention", async () => {
      try {
        await axios.post(`${BASE_URL}/api/auth/signup`, {
          name: users.alice.name,
          email: users.alice.email,
          password: users.alice.password,
        });
        throw new Error("Duplicate email signup succeeded when it should fail");
      } catch (err) {
        if (err.response?.status === 409) {
          return "Correctly returned 409 Conflict";
        }
        throw err;
      }
    });

    await runner.runStep("User 1 Login Verification", async () => {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: users.alice.email,
        password: users.alice.password,
      });
      if (res.status !== 200 || !res.data.token) {
        throw new Error("Login failed to return token");
      }
      return `JWT issued successfully (${res.data.token.slice(0, 20)}...)`;
    });

    await runner.runStep("Login Security: Incorrect Password Rejection", async () => {
      try {
        await axios.post(`${BASE_URL}/api/auth/login`, {
          email: users.alice.email,
          password: "WrongPassword999!",
        });
        throw new Error("Login succeeded with incorrect password");
      } catch (err) {
        if (err.response?.status === 401) {
          return "Correctly rejected (401 Unauthorized)";
        }
        throw err;
      }
    });

    await runner.runStep("User 2 Signup & Login (Bob - Collaborator)", async () => {
      const res = await axios.post(`${BASE_URL}/api/auth/signup`, {
        name: users.bob.name,
        email: users.bob.email,
        password: users.bob.password,
      });
      users.bob.token = res.data.token;
      users.bob.id = res.data.user.id;
      return `User ID: ${users.bob.id}, Email: ${users.bob.email}`;
    });

    await runner.runStep("User 3 Signup & Login (Charlie - Observer/Late Joiner)", async () => {
      const res = await axios.post(`${BASE_URL}/api/auth/signup`, {
        name: users.charlie.name,
        email: users.charlie.email,
        password: users.charlie.password,
      });
      users.charlie.token = res.data.token;
      users.charlie.id = res.data.user.id;
      return `User ID: ${users.charlie.id}, Email: ${users.charlie.email}`;
    });

    await runner.runStep("Auth Guard: Protected Route Rejection Without Token", async () => {
      try {
        await axios.get(`${BASE_URL}/api/rooms`);
        throw new Error("Protected route allowed unauthenticated request");
      } catch (err) {
        if (err.response?.status === 401) {
          return "Correctly blocked (401 Unauthorized)";
        }
        throw err;
      }
    });

    /* ========================================================================= */
    /* 3. DASHBOARD ACTIVITY & ROOM LIFECYCLE (MULTI-USER)                       */
    /* ========================================================================= */
    runner.section("3. Dashboard Activity & Room Operations");

    await runner.runStep("Room Creation by Host (Alice)", async () => {
      const res = await axios.post(
        `${BASE_URL}/api/rooms`,
        {
          roomName: testRoom.roomName,
          description: testRoom.description,
        },
        {
          headers: { Authorization: `Bearer ${users.alice.token}` },
        }
      );
      if (res.status !== 201 || !res.data.room?.roomCode) {
        throw new Error("Failed to create room");
      }
      testRoom.id = res.data.room.id;
      testRoom.roomCode = res.data.room.roomCode;

      if (!/^[A-Z0-9]{6}$/.test(testRoom.roomCode)) {
        throw new Error(`Room code '${testRoom.roomCode}' does not match 6-character format`);
      }
      return `Room Code: ${testRoom.roomCode}, ID: ${testRoom.id}`;
    });

    await runner.runStep("Alice Dashboard: Verify Created Room Appears", async () => {
      const res = await axios.get(`${BASE_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${users.alice.token}` },
      });
      const found = res.data.rooms?.find((r) => r.roomCode === testRoom.roomCode);
      if (!found) throw new Error("Created room not found in Alice's dashboard list");
      return `Alice has ${res.data.rooms.length} active room(s)`;
    });

    await runner.runStep("Bob Dashboard: Verify Room Does Not Appear Before Joining", async () => {
      const res = await axios.get(`${BASE_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${users.bob.token}` },
      });
      const found = res.data.rooms?.find((r) => r.roomCode === testRoom.roomCode);
      if (found) throw new Error("Room prematurely appeared in Bob's dashboard");
      return "Room correctly isolated prior to joining";
    });

    await runner.runStep("Bob Joins Room via 6-Character Room Code", async () => {
      const res = await axios.post(
        `${BASE_URL}/api/rooms/${testRoom.roomCode}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${users.bob.token}` },
        }
      );
      if (res.status !== 200 || !res.data.room?.participants) {
        throw new Error("Failed to join room");
      }
      const isParticipant = res.data.room.participants.some(
        (p) => String(p) === String(users.bob.id) || p.id === users.bob.id
      );
      if (!isParticipant) throw new Error("Bob's ID not present in room participants list");
      return `Bob added to participants (Total: ${res.data.room.participants.length})`;
    });

    await runner.runStep("Bob Dashboard: Verify Room Now Appears After Joining", async () => {
      const res = await axios.get(`${BASE_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${users.bob.token}` },
      });
      const found = res.data.rooms?.find((r) => r.roomCode === testRoom.roomCode);
      if (!found) throw new Error("Room missing from Bob's dashboard after joining");
      return `Room '${found.roomName}' present in Bob's dashboard`;
    });

    await runner.runStep("Charlie Joins Room via Invite Code", async () => {
      const res = await axios.post(
        `${BASE_URL}/api/rooms/${testRoom.roomCode}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${users.charlie.token}` },
        }
      );
      if (res.status !== 200) throw new Error("Charlie failed to join room");
      return "Charlie successfully registered as participant";
    });

    await runner.runStep("Fetch Room Details as Participant (GET /api/rooms/:roomId)", async () => {
      const res = await axios.get(`${BASE_URL}/api/rooms/${testRoom.id}`, {
        headers: { Authorization: `Bearer ${users.bob.token}` },
      });
      if (res.data.room.roomCode !== testRoom.roomCode) {
        throw new Error("Room details mismatch");
      }
      return `Room fetched: ${res.data.room.roomName}`;
    });

    await runner.runStep("Host Updates Room Metadata (PATCH /api/rooms/:roomId)", async () => {
      const updatedName = "Distributed Systems Lab [Updated]";
      const res = await axios.patch(
        `${BASE_URL}/api/rooms/${testRoom.id}`,
        { roomName: updatedName },
        { headers: { Authorization: `Bearer ${users.alice.token}` } }
      );
      if (res.data.room.roomName !== updatedName) {
        throw new Error("Room name was not updated");
      }
      return `New Title: "${res.data.room.roomName}"`;
    });

    await runner.runStep("Security: Non-Host Participant Cannot Edit Room Settings", async () => {
      try {
        await axios.patch(
          `${BASE_URL}/api/rooms/${testRoom.id}`,
          { roomName: "Malicious Tamper" },
          { headers: { Authorization: `Bearer ${users.bob.token}` } }
        );
        throw new Error("Non-host was permitted to alter room settings");
      } catch (err) {
        if (err.response?.status === 403) {
          return "Correctly blocked with 403 Forbidden";
        }
        throw err;
      }
    });

    /* ========================================================================= */
    /* 4. REAL-TIME WEBSOCKET MULTI-USER SYNCHRONIZATION                         */
    /* ========================================================================= */
    runner.section("4. WebSocket Multi-User Synchronization");

    await runner.runStep("Socket Auth Security: Reject Connection Without Token", async () => {
      const unauthSocket = io(SOCKET_URL, {
        auth: {},
        transports: ["websocket"],
        forceNew: true,
      });

      try {
        await new Promise((resolve, reject) => {
          unauthSocket.on("connect_error", (err) => {
            if (err.message.includes("Authentication required")) {
              resolve();
            } else {
              reject(new Error(`Unexpected connect_error message: ${err.message}`));
            }
          });
          unauthSocket.on("connect", () => {
            reject(new Error("Unauthenticated socket connected unexpectedly"));
          });
        });
        return "Connection rejected: 'Authentication required.'";
      } finally {
        unauthSocket.disconnect();
      }
    });

    await runner.runStep("Connect All Users (Alice, Bob, Charlie) via WebSocket", async () => {
      const connectUserSocket = (user) => {
        return new Promise((resolve, reject) => {
          const s = io(SOCKET_URL, {
            auth: { token: user.token },
            transports: ["websocket"],
            forceNew: true,
          });
          s.on("connect", () => resolve(s));
          s.on("connect_error", (err) => reject(err));
        });
      };

      users.alice.socket = await connectUserSocket(users.alice);
      users.bob.socket = await connectUserSocket(users.bob);
      users.charlie.socket = await connectUserSocket(users.charlie);

      return `3 sockets connected: Alice(${users.alice.socket.id}), Bob(${users.bob.socket.id}), Charlie(${users.charlie.socket.id})`;
    });

    await runner.runStep("Room Join & Presence Protocol (Alice as Host)", async () => {
      const joinAck = await new Promise((resolve) => {
        users.alice.socket.emit("join-room", testRoom.roomCode, (ack) => resolve(ack));
      });
      if (!joinAck.ok || !joinAck.isHost || !joinAck.canEdit) {
        throw new Error(`Alice join ACK unexpected: ${JSON.stringify(joinAck)}`);
      }
      return `Alice isHost: ${joinAck.isHost}, canEdit: ${joinAck.canEdit}`;
    });

    await runner.runStep("Room Join & Peer Broadcast (Bob Joins)", async () => {
      const userJoinedPromise = waitForEvent(users.alice.socket, "user-joined");
      const roomUsersPromise = waitForEvent(users.alice.socket, "room-users");

      const joinAck = await new Promise((resolve) => {
        users.bob.socket.emit("join-room", testRoom.roomCode, (ack) => resolve(ack));
      });

      if (!joinAck.ok || joinAck.isHost || joinAck.canEdit) {
        throw new Error(`Bob join ACK unexpected: ${JSON.stringify(joinAck)}`);
      }

      const userJoinedPayload = await userJoinedPromise;
      const roomUsersPayload = await roomUsersPromise;

      if (userJoinedPayload.socketId !== users.bob.socket.id) {
        throw new Error("user-joined socket ID mismatch");
      }
      if (roomUsersPayload.length < 2) {
        throw new Error("room-users payload did not contain both users");
      }

      return `Bob joined room; Presence list updated with ${roomUsersPayload.length} peers`;
    });

    /* ---------------- Whiteboard Synchronization ---------------- */
    runner.section("5. Whiteboard Real-Time Synchronization");

    const testElement = {
      id: `rect_${Date.now()}`,
      type: "rectangle",
      x: 150,
      y: 220,
      width: 300,
      height: 180,
      stroke: "#06b6d4",
      strokeWidth: 3,
      fill: "transparent",
    };

    await runner.runStep("Draw Element Sync (Alice draws -> Bob receives)", async () => {
      const receivePromise = waitForEvent(users.bob.socket, "draw-element");

      users.alice.socket.emit("draw-element", {
        room: testRoom.roomCode,
        element: testElement,
      });

      const received = await receivePromise;
      if (received.id !== testElement.id || received.x !== testElement.x) {
        throw new Error(`Received element mismatch: ${JSON.stringify(received)}`);
      }
      return `Element ${received.id} synced with type=${received.type}, (x=${received.x}, y=${received.y})`;
    });

    await runner.runStep("Update Element Sync (Alice drags -> Bob receives)", async () => {
      const updatedElement = { ...testElement, x: 280, y: 350 };
      const receivePromise = waitForEvent(users.bob.socket, "update-element");

      users.alice.socket.emit("update-element", {
        room: testRoom.roomCode,
        element: updatedElement,
      });

      const received = await receivePromise;
      if (received.id !== testElement.id || received.x !== 280 || received.y !== 350) {
        throw new Error(`Updated element mismatch: ${JSON.stringify(received)}`);
      }
      return `Position updated to (x=${received.x}, y=${received.y})`;
    });

    await runner.runStep("Live Stroke Streaming (Alice strokes -> Bob receives)", async () => {
      const liveStroke = {
        type: "pencil",
        points: [100, 100, 105, 110, 115, 125],
        stroke: "#ec4899",
      };
      const receivePromise = waitForEvent(users.bob.socket, "draw-in-progress");

      users.alice.socket.emit("draw-in-progress", {
        room: testRoom.roomCode,
        element: liveStroke,
      });

      const received = await receivePromise;
      if (received.socketId !== users.alice.socket.id || !received.element?.points) {
        throw new Error("Live stroke streaming payload invalid");
      }
      return `Streamed stroke with ${received.element.points.length} coords from socket ${received.socketId}`;
    });

    await runner.runStep("Multiplayer Cursor Presence (Alice moves -> Bob receives)", async () => {
      const cursorCoord = { x: 420.5, y: 680.25, color: "#8b5cf6" };
      const receivePromise = waitForEvent(users.bob.socket, "cursor-move");

      users.alice.socket.emit("cursor-move", {
        room: testRoom.roomCode,
        ...cursorCoord,
      });

      const received = await receivePromise;
      if (received.socketId !== users.alice.socket.id || received.x !== cursorCoord.x || received.y !== cursorCoord.y) {
        throw new Error(`Cursor payload mismatch: ${JSON.stringify(received)}`);
      }
      return `Cursor track: ${received.name} at (${received.x}, ${received.y}) in ${received.color}`;
    });

    await runner.runStep("Delete Elements Sync (Alice deletes -> Bob receives)", async () => {
      const receivePromise = waitForEvent(users.bob.socket, "delete-elements");

      users.alice.socket.emit("delete-elements", {
        room: testRoom.roomCode,
        ids: [testElement.id],
      });

      const receivedIds = await receivePromise;
      if (!Array.isArray(receivedIds) || !receivedIds.includes(testElement.id)) {
        throw new Error(`Deleted IDs mismatch: ${JSON.stringify(receivedIds)}`);
      }
      return `Deleted IDs synced: [${receivedIds.join(", ")}]`;
    });

    await runner.runStep("Full Canvas State Sync (sync-canvas / canvas-state)", async () => {
      const bulkElements = [
        { id: "circle_1", type: "circle", x: 200, y: 200, radius: 40, stroke: "#3b82f6" },
        { id: "arrow_1", type: "arrow", points: [100, 100, 200, 200], stroke: "#10b981" },
        { id: "sticky_1", type: "sticky", x: 400, y: 300, text: "System Architecture", fill: "#fef08a" },
      ];

      const receivePromise = waitForEvent(users.bob.socket, "canvas-state");

      users.alice.socket.emit("sync-canvas", {
        room: testRoom.roomCode,
        elements: bulkElements,
      });

      const received = await receivePromise;
      if (!Array.isArray(received) || received.length !== 3) {
        throw new Error("Full canvas sync failed to match elements count");
      }
      return `Full canvas state synced (${received.length} elements: circle, arrow, sticky)`;
    });

    await runner.runStep("Late Joiner Canvas State Recovery (Charlie joins -> gets canvas-state)", async () => {
      const canvasStatePromise = waitForEvent(users.charlie.socket, "canvas-state");

      const joinAck = await new Promise((resolve) => {
        users.charlie.socket.emit("join-room", testRoom.roomCode, (ack) => resolve(ack));
      });

      if (!joinAck.ok) throw new Error("Charlie failed to join room");

      const restoredCanvas = await canvasStatePromise;
      if (!Array.isArray(restoredCanvas) || restoredCanvas.length !== 3) {
        throw new Error(`Late joiner did not receive expected canvas state: length ${restoredCanvas?.length}`);
      }
      return `Charlie received restored session canvas (${restoredCanvas.length} shapes preserved)`;
    });

    /* ---------------- Real-time In-Room Chat ---------------- */
    runner.section("6. In-Room Chat Real-Time Synchronization");

    await runner.runStep("Chat: Alice sends message -> Bob and Charlie receive", async () => {
      const bobMsgPromise = waitForEvent(users.bob.socket, "receive-message");
      const charlieMsgPromise = waitForEvent(users.charlie.socket, "receive-message");

      const messageText = "Welcome to the real-time sync session team!";
      users.alice.socket.emit("send-message", {
        room: testRoom.roomCode,
        text: messageText,
      });

      const [bobMsg, charlieMsg] = await Promise.all([bobMsgPromise, charlieMsgPromise]);

      if (bobMsg.text !== messageText || bobMsg.senderName !== users.alice.name) {
        throw new Error(`Bob received invalid chat payload: ${JSON.stringify(bobMsg)}`);
      }
      if (charlieMsg.text !== messageText) {
        throw new Error(`Charlie received invalid chat payload: ${JSON.stringify(charlieMsg)}`);
      }

      return `Message received by 2 peers: "${bobMsg.text}" at ${bobMsg.timestamp}`;
    });

    await runner.runStep("Chat: Bob replies -> Alice receives", async () => {
      const aliceMsgPromise = waitForEvent(users.alice.socket, "receive-message");

      const replyText = "Ready! Whiteboard and code editor are synced on my end.";
      users.bob.socket.emit("send-message", {
        room: testRoom.roomCode,
        text: replyText,
      });

      const aliceMsg = await aliceMsgPromise;
      if (aliceMsg.text !== replyText || aliceMsg.senderName !== users.bob.name) {
        throw new Error(`Alice received invalid chat payload: ${JSON.stringify(aliceMsg)}`);
      }
      return `Alice received reply: "${aliceMsg.text}" from ${aliceMsg.senderName}`;
    });

    /* ---------------- Collaborative Monaco / Yjs Editor ---------------- */
    runner.section("7. Monaco Collaborative Code Editor (Yjs CRDT & Events)");

    await runner.runStep("Yjs Session Initialization (yjs-join & yjs-init)", async () => {
      const aliceInitPromise = waitForEvent(users.alice.socket, "yjs-init");
      const bobInitPromise = waitForEvent(users.bob.socket, "yjs-init");

      users.alice.socket.emit("yjs-join", { roomId: testRoom.roomCode });
      users.bob.socket.emit("yjs-join", { roomId: testRoom.roomCode });

      const [aliceInit, bobInit] = await Promise.all([aliceInitPromise, bobInitPromise]);

      if (!aliceInit || !bobInit) {
        throw new Error("Failed to receive binary yjs-init from server");
      }
      return `Yjs doc initialized on server for room ${testRoom.roomCode}`;
    });

    await runner.runStep("Yjs Conflict-Free Text Synchronization (Alice writes -> Bob receives)", async () => {
      const yDocAlice = new Y.Doc();
      const yDocBob = new Y.Doc();

      const yTextAlice = yDocAlice.getText("code");
      const yTextBob = yDocBob.getText("code");

      const updatePromise = waitForEvent(users.bob.socket, "yjs-update");

      // Alice makes an edit
      const initialCode = "const cluster = require('cluster');\nconsole.log('Worker started');";
      yDocAlice.on("update", (update) => {
        users.alice.socket.emit("yjs-update", {
          roomId: testRoom.roomCode,
          update: Buffer.from(update),
        });
      });

      yTextAlice.insert(0, initialCode);

      const receivedUpdate = await updatePromise;
      Y.applyUpdate(yDocBob, new Uint8Array(receivedUpdate));

      if (yTextBob.toString() !== initialCode) {
        throw new Error(`CRDT text mismatch! Expected:\n${initialCode}\nReceived:\n${yTextBob.toString()}`);
      }

      return `CRDT text matched byte-for-byte:\n         "${yTextBob.toString().replace(/\n/g, "\\n")}"`;
    });

    await runner.runStep("Legacy Code Synchronization (code-change event)", async () => {
      const receivePromise = waitForEvent(users.bob.socket, "code-change");

      const payload = {
        room: testRoom.roomCode,
        code: "function test() { return 100; }",
        language: "javascript",
      };

      users.alice.socket.emit("code-change", payload);

      const received = await receivePromise;
      if (received.code !== payload.code) {
        throw new Error(`Received code mismatch: ${JSON.stringify(received)}`);
      }
      return `Legacy code-change broadcast verified (${received.language})`;
    });

    /* ---------------- Access Control & Role Permissions Flow ---------------- */
    runner.section("8. Real-Time Permissions & Role Access Workflow");

    await runner.runStep("Access Control: Unauthorized User Drawing Ignored", async () => {
      // Bob is currently NOT an editor. Attempting to emit draw-element should NOT be broadcast.
      let receivedByAlice = false;
      const listener = () => { receivedByAlice = true; };
      users.alice.socket.on("draw-element", listener);

      users.bob.socket.emit("draw-element", {
        room: testRoom.roomCode,
        element: { id: "unauthorized_shape", type: "rectangle", x: 0, y: 0 },
      });

      await delay(500);
      users.alice.socket.off("draw-element", listener);

      if (receivedByAlice) {
        throw new Error("Server relayed drawing from user without edit access!");
      }
      return "Drawing correctly blocked by server canEdit check";
    });

    await runner.runStep("Request Edit Access Flow (Bob requests -> Alice host receives)", async () => {
      const reqPromise = waitForEvent(users.alice.socket, "edit-access-requested");

      const ack = await new Promise((resolve) => {
        users.bob.socket.emit("request-edit-access", { room: testRoom.roomCode }, (res) => resolve(res));
      });

      if (!ack.ok) throw new Error(`Request edit access ACK failed: ${ack.error}`);

      const requestEvent = await reqPromise;
      if (requestEvent.userId !== users.bob.id || requestEvent.name !== users.bob.name) {
        throw new Error(`Request event payload mismatch: ${JSON.stringify(requestEvent)}`);
      }
      return `Host received request from ${requestEvent.name} (${requestEvent.userId})`;
    });

    await runner.runStep("Grant Edit Access Flow (Alice approves -> Bob upgraded to editor)", async () => {
      const accessUpdatedPromise = waitForEvent(users.bob.socket, "access-updated");
      const roomUsersPromise = waitForEvent(users.bob.socket, "room-users");

      const grantAck = await new Promise((resolve) => {
        users.alice.socket.emit(
          "grant-edit-access",
          { room: testRoom.roomCode, userId: users.bob.id, allow: true },
          (res) => resolve(res)
        );
      });

      if (!grantAck.ok) throw new Error(`Grant edit access ACK failed: ${grantAck.error}`);

      const accessUpdate = await accessUpdatedPromise;
      const roomUsers = await roomUsersPromise;

      if (!accessUpdate.canEdit) {
        throw new Error("access-updated did not have canEdit: true");
      }

      const bobEntry = roomUsers.find((u) => u.userId === users.bob.id);
      if (!bobEntry?.canEdit) {
        throw new Error("room-users presence did not reflect Bob's canEdit=true");
      }

      return `Bob granted edit access! Presence list shows canEdit: ${bobEntry.canEdit}`;
    });

    await runner.runStep("Authorized Drawing by Newly Promoted Editor (Bob draws -> Alice receives)", async () => {
      const receivePromise = waitForEvent(users.alice.socket, "draw-element");

      const bobShape = {
        id: "bob_promoted_shape",
        type: "rectangle",
        x: 500,
        y: 400,
        width: 150,
        height: 100,
        stroke: "#10b981",
      };

      users.bob.socket.emit("draw-element", {
        room: testRoom.roomCode,
        element: bobShape,
      });

      const received = await receivePromise;
      if (received.id !== bobShape.id) {
        throw new Error("Alice did not receive Bob's authorized element");
      }
      return `Alice received drawing from newly promoted editor Bob (ID: ${received.id})`;
    });

    /* ---------------- Multi-Language Code Execution Engine ---------------- */
    runner.section("9. Integrated Multi-Language Code Execution Engine");

    await runner.runStep("Code Runner (POST /api/execute): JavaScript Execution", async () => {
      const jsCode = `
        const data = [10, 20, 30, 40];
        const sum = data.reduce((a, b) => a + b, 0);
        console.log("Diagnostic Sum:", sum);
      `;

      const res = await axios.post(
        `${BASE_URL}/api/execute`,
        {
          language: "javascript",
          code: jsCode,
          stdin: "",
        },
        {
          headers: { Authorization: `Bearer ${users.alice.token}` },
        }
      );

      if (res.status !== 200 || !res.data.run) {
        throw new Error(`Execute endpoint failed: ${JSON.stringify(res.data)}`);
      }

      const { stdout, code, time } = res.data.run;
      if (!stdout.includes("Diagnostic Sum: 100") || code !== 0) {
        throw new Error(`Unexpected execution result: stdout="${stdout}", exitCode=${code}`);
      }
      return `stdout: "${stdout.trim()}", exitCode: ${code}, time: ${time}s`;
    });

    await runner.runStep("Code Runner: Standard Input (stdin) Evaluation", async () => {
      const jsStdinCode = `
        let input = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', chunk => { input += chunk; });
        process.stdin.on('end', () => {
          console.log("Processed Stdin:", input.trim().toUpperCase());
        });
      `;

      const res = await axios.post(
        `${BASE_URL}/api/execute`,
        {
          language: "javascript",
          code: jsStdinCode,
          stdin: "multivariate sync engine",
        },
        {
          headers: { Authorization: `Bearer ${users.alice.token}` },
        }
      );

      const { stdout, code } = res.data.run;
      if (!stdout.includes("MULTIVARIATE SYNC ENGINE")) {
        throw new Error(`Stdin processing failed: stdout="${stdout}"`);
      }
      return `stdout: "${stdout.trim()}", exitCode: ${code}`;
    });

    await runner.runStep("Code Runner: Syntax Error Diagnostics Capture", async () => {
      const faultyCode = `
        const x = ; // Syntax error
      `;

      const res = await axios.post(
        `${BASE_URL}/api/execute`,
        {
          language: "javascript",
          code: faultyCode,
          stdin: "",
        },
        {
          headers: { Authorization: `Bearer ${users.alice.token}` },
        }
      );

      const { stderr, code } = res.data.run;
      if (code === 0 || !stderr.toLowerCase().includes("syntaxerror")) {
        throw new Error(`Failed to capture syntax error: code=${code}, stderr=${stderr}`);
      }
      return `Correctly captured SyntaxError (exitCode: ${code})`;
    });

    /* ---------------- Disconnection & Teardown ---------------- */
    runner.section("10. Disconnection & Lifecycle Teardown");

    await runner.runStep("Member Leaves Room (Bob emits leave-room)", async () => {
      const userLeftPromise = waitForEvent(users.alice.socket, "user-left");
      const roomUsersPromise = waitForEvent(users.alice.socket, "room-users");

      users.bob.socket.emit("leave-room", testRoom.roomCode);

      const userLeft = await userLeftPromise;
      const roomUsers = await roomUsersPromise;

      if (userLeft.socketId !== users.bob.socket.id) {
        throw new Error("user-left socketId mismatch");
      }
      const hasBob = roomUsers.some((u) => u.userId === users.bob.id);
      if (hasBob) {
        throw new Error("Bob still present in room-users after leaving");
      }
      return `Bob left; Alice received user-left notification; ${roomUsers.length} users remaining`;
    });

    await runner.runStep("Host Deletes Room (DELETE /api/rooms/:roomId)", async () => {
      const res = await axios.delete(`${BASE_URL}/api/rooms/${testRoom.id}`, {
        headers: { Authorization: `Bearer ${users.alice.token}` },
      });
      if (res.status !== 200) throw new Error("Failed to delete room");
      return "Room marked inactive and archived successfully";
    });

  } finally {
    // Teardown connections
    if (users.alice.socket) users.alice.socket.disconnect();
    if (users.bob.socket) users.bob.socket.disconnect();
    if (users.charlie.socket) users.charlie.socket.disconnect();

    if (ioServer) ioServer.close();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (closeDB) {
      await closeDB();
    } else if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }

  // Print summary report
  const totalElapsed = ((Date.now() - runner.startTime) / 1000).toFixed(2);
  console.log(`\n${c.bold}${c.cyan}=============================================================`);
  console.log(`                 DIAGNOSTIC TEST SUMMARY                     `);
  console.log(`=============================================================${c.reset}`);
  console.log(`  Total Tests Run : ${c.bold}${runner.totalTests}${c.reset}`);
  console.log(`  Passed Tests    : ${c.green}${c.bold}${runner.passedTests}${c.reset}`);
  console.log(`  Failed Tests    : ${runner.failedTests > 0 ? c.red : c.green}${c.bold}${runner.failedTests}${c.reset}`);
  console.log(`  Total Duration  : ${c.white}${totalElapsed}s${c.reset}`);
  console.log(`  System Health   : ${runner.failedTests === 0 ? `${c.green}${c.bold}100% HEALTHY & SYNCHRONIZED` : `${c.red}${c.bold}FAILURES DETECTED`}${c.reset}`);
  console.log(`${c.bold}${c.cyan}=============================================================${c.reset}\n`);

  if (runner.failedTests > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runFullDiagnostic().catch((err) => {
  console.error("\nFATAL DIAGNOSTIC RUNNER ERROR:", err);
  process.exit(1);
});
