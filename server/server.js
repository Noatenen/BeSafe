
import instagramRoutes from "./routes/instagram.routes.js";
import scoringRoutes from "./routes/scoring.routes.js";
import { connectMongo } from "./src/db/mongoose.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Body parser
app.use(express.json());


// CORS (אם אין CLIENT_URL ב-.env, נפתח הכל לדמו)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Optional request log (אפשר למחוק אם מציק)
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
});

// Debug (לא חושף מפתחות)
console.log("--- Server Start ---");
console.log("CLIENT_URL =", process.env.CLIENT_URL || "(not set)");
console.log("Has OPENAI_API_KEY?", Boolean(process.env.OPENAI_API_KEY));
console.log("Has RAPIDAPI_KEY?", Boolean(process.env.RAPIDAPI_KEY));
console.log("Has MONGODB_URI?", Boolean(process.env.MONGODB_URI));

// Routes
app.use("/api", moderationRoutes); // שלך
app.use("/api/instagram", instagramRoutes); // של מאי
app.use("/api/scoring", scoringRoutes); // של מאי

// Start server (Mongo אופציונלי כדי שלא יפיל לך את השרת)
try {
  await connectMongo();
  console.log("Mongo connect attempt finished");
} catch (err) {
  console.log("Mongo connection failed (continuing without DB):", err?.message);
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});