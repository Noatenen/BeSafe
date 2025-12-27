import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import instagramRoutes from "./routes/instagram.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[Server] Request received: ${req.method} ${req.url}`);
  next();
});
app.use('/images', express.static(path.join(__dirname, 'images'))); // Serve static images

app.use(cors({
  origin: '*'
}));

// Use the routes file for all `/ducks` routes
app.use("/api/instagram", instagramRoutes);

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
