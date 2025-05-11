import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";

dotenv.config();

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.error(error));

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "DELETE", "PUT"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Cache-Control",
            "Expires",
            "Pragma",
        ],
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

const Port = process.env.PORT || 5000;
app.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
});
