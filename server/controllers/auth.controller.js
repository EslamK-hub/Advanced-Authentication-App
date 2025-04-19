import { User } from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        if (!email || !password || !name) {
            throw new Error("All fields are required");
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationToken = Math.floor(
            100000 + Math.random() * 900000
        ).toString();
        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
        });

        await user.save();

        generateTokenAndSetCookie(res, user._id);

        sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({success: true, message: "User created Successfully", user: {...user._doc, password: undefined}})
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const login = async (req, res) => {
    res.send("Login route");
};

export const logout = async (req, res) => {
    res.send("Logout route");
};
