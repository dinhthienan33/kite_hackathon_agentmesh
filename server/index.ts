import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { aaSdk, getAAWallet, sendOperation, getSignFunction } from "./aa_service";
import { ethers } from "ethers";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Mock Kite Chain Infrastructure ---
// The backend now acts as a state relay for the AgentMesh economy.
let transactions: any[] = [];
let logs: any[] = [];

io.on("connection", (socket) => {
  // Sync current state to new clients
  socket.emit("init", { logs, transactions });

  socket.on("addLog", (log: any) => {
    logs.push(log);
    socket.broadcast.emit("log", log);
  });

  socket.on("addTransaction", (tx: any) => {
    transactions.push(tx);
    socket.broadcast.emit("transaction", tx);
  });

  socket.on("reset", () => {
    logs = [];
    transactions = [];
    io.emit("reset");
  });
});

// --- API Routes ---
app.get("/api/state", (req, res) => {
  res.json({ logs, transactions });
});

// --- Kite Integration Endpoints ---
app.post("/api/kite/aa/wallet", (req, res) => {
  try {
    const { signerAddress } = req.body;
    if (!signerAddress) return res.status(400).json({ error: "Missing signerAddress" });
    const walletAddress = getAAWallet(signerAddress);
    res.json({ aaWalletAddress: walletAddress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/kite/aa/execute", async (req, res) => {
  try {
    const { privateKey, eoa, targetAddress, callData, value } = req.body;
    const result = await sendOperation(privateKey, eoa, targetAddress, callData, value || "0");
    if (result.status.status === 'success') {
      res.json({ success: true, transactionHash: result.status.transactionHash });
    } else {
      res.status(400).json({ success: false, reason: result.status.reason });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Gasless Transfer Endpoint Wrapper
app.post("/api/kite/gasless/transfer", async (req, res) => {
  try {
    // Expected to receive EIP-3009 signed payload from Python or construct it here
    const gaslessApi = process.env.GASLESS_API || "https://gasless.gokite.ai/testnet";
    const response = await fetch(gaslessApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Vite Integration & Static Serving ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
