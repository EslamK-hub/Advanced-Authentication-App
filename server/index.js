import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}))

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

const Port = process.env.PORT || 5000;
app.listen(Port, () => {
    connectDB();
    console.log(`Server is running on port ${Port}`);
});
