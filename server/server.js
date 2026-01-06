import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import linkCheckerRoutes from "./routes/linkChecker.js";


dotenv.config();
console.log("HAS OPENAI KEY?", !!process.env.OPENAI_API_KEY);

const app = express();

app.use(express.json());

app.use(cors({
  origin: process.env.CLIENT_URL
}));
app.use('/api/link', linkCheckerRoutes);

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
