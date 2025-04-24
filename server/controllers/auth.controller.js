import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { User } from "../models/user.model.js";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
    sendPasswordResetEmail,
    sendResetSuccessEmail,
    sendVerificationEmail,
    sendWelcomeEmail,
} from "../mailtrap/emails.js";
import { send } from "process";

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

        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: "User created Successfully",
            user: { ...user._doc, password: undefined },
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const verifyEmail = async (req, res) => {
    const { code } = req.body;
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: { ...user._doc, password: undefined },
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email",
            });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid password",
            });
        }

        generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: { ...user._doc, password: undefined },
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        const resetPasswordToken = crypto.randomBytes(20).toString("hex");
        const resetPasswordExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpiresAt = resetPasswordExpiresAt;
        await user.save();

        // Send the reset token to the user's email
        await sendPasswordResetEmail(
            user.email,
            `${process.env.CLIENT_URL}/reset-password/${resetPasswordToken}`
        );

        res.status(200).json({
            success: true,
            message: "Password reset email sent successfully",
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        await sendResetSuccessEmail(user.email);

        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - User not found",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
