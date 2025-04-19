import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("Error Connection to MongoDB: ", err.message);
        process.exit(1);
    }
};
