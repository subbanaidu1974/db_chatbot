import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  app.post("/api/validate-connection", (req, res) => {
    const { connectionString, type } = req.body;
    
    // Simulate validation logic
    // In a real app, this would attempt to connect using the appropriate driver
    if (!connectionString || connectionString.length < 10) {
      return res.status(400).json({ 
        valid: false, 
        message: "Invalid connection string format. String too short." 
      });
    }

    const protocols = type === 'SQL' ? ['postgresql:', 'mysql:', 'sqlserver:'] : ['mongodb', 'https:', 'redis:'];
    const hasValidProtocol = protocols.some(p => connectionString.toLowerCase().startsWith(p));

    if (!hasValidProtocol) {
      return res.status(400).json({ 
        valid: false, 
        message: `Invalid protocol for ${type} connection.` 
      });
    }

    // Artificial delay to simulate network check
    setTimeout(() => {
      res.json({ 
        valid: true, 
        message: `Successfully reached ${type} endpoint. Handshake complete.` 
      });
    }, 1200);
  });

  app.post("/api/execute-query", (req, res) => {
    const { query, dialect, connectionString } = req.body;

    if (!connectionString || connectionString.includes('unset')) {
       return res.status(400).json({ 
         success: false,
         error: "Database configuration error",
         message: "No valid connection string selected. Please check your settings." 
       });
    }

    // Simulate random potential errors for demonstration
    const random = Math.random();
    if (random < 0.15) {
      return res.status(500).json({
        success: false,
        error: "Execution Timeout",
        message: "The query took too long to respond. Check if your connection string is reachable from this environment."
      });
    } else if (random < 0.25) {
      return res.status(400).json({
        success: false,
        error: `${dialect} Syntax Error`,
        message: `The generated query contains an invalid or unsupported keyword for the current ${dialect} version.`
      });
    }

    // Simulate successful query execution
    setTimeout(() => {
      res.json({
        success: true,
        rowCount: Math.floor(Math.random() * 5) + 1,
        executionTime: `${(Math.random() * 100 + 10).toFixed(2)}ms`,
        results: [
          { id: "PROD-001", name: "ErgoFlow Office Chair", price: 299.99, stock: 45 },
          { id: "PROD-002", name: "LuminoDesk Pro", price: 549.50, stock: 20 }
        ].slice(0, Math.floor(Math.random() * 2) + 1)
      });
    }, 1200);
  });

  // Vite middleware for development
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
