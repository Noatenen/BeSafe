import 'dotenv/config'; // שורה זו מבטיחה שהמפתח נטען לפני ה-Routes
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import moderationRoutes from './routes/moderationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// הסרנו את dotenv.config() כי השורה הראשונה עושה זאת טוב יותר

const app = express();

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

console.log("--- Server Start ---");
console.log("CLIENT_URL =", process.env.CLIENT_URL);
// בדיקה שהמפתח קיים (מדפיס רק YES או NO כדי לא לחשוף את המפתח ביומן)
console.log("OpenAI Key Status:", process.env.OPENAI_API_KEY ? "Loaded ✅" : "Missing ❌");

app.use('/api', moderationRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});