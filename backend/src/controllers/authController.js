// Controller untuk autentikasi user

import jwt from "jsonwebtoken";
import { registerUser, loginUser } from "../services/authService.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/appError.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production" && !JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production environment");
}

const SECRET = JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Validasi input
        if (!name || name.trim() === "") {
            throw new AppError("Nama harus diisi.", 400, "INVALID_INPUT");
        }
        if (!email || !email.includes("@")) {
            throw new AppError("Email tidak valid.", 400, "INVALID_INPUT");
        }
        if (!password || password.length < 6) {
            throw new AppError("Password minimal 6 karakter.", 400, "INVALID_INPUT");
        }

        const user = await registerUser(name.trim(), email.trim().toLowerCase(), password);

        // Buat JWT token
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
                SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            status: "success",
            message: "Registrasi berhasil!",
            data: { token, user },
        });
    } catch (error) {
        logger.error(
            `[AuthController] Registration failed:`,
            req.requestId,
            error.message
        );
        if (error.message.includes("Email sudah terdaftar")) {
            throw new AppError("Email sudah terdaftar.", 409, "EMAIL_EXISTS");
        }
        next(error);
    }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError("Email dan password harus diisi.", 400, "INVALID_INPUT");
        }

        const user = await loginUser(email.trim().toLowerCase(), password);

        // Buat JWT token
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
            status: "success",
            message: "Login berhasil!",
            data: { token, user },
        });
    } catch (error) {
        logger.error(
            `[AuthController] Login failed:`,
            req.requestId,
            error.message
        );
        if (error.message.includes("Email atau password salah")) {
            throw new AppError("Email atau password salah.", 401, "INVALID_CREDENTIALS");
        }
        next(error);
    }
};

/**
 * GET /api/auth/me
 * Ambil profil user yang sedang login (dari token)
 */
export const getMe = async (req, res) => {
    res.json({
        status: "success",
        data: req.user,
    });
};
