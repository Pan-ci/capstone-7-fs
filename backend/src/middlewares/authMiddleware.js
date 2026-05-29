// Middleware untuk verifikasi JWT token

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const SECRET = JWT_SECRET || "dev-secret";

/**
 * Middleware: verifikasi JWT dari header Authorization
 * Jika valid, set req.user = payload token
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "error",
            message: "Akses ditolak. Token tidak ditemukan.",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded; // { id, name, email, iat, exp }
        next();
    } catch (err) {
        return res.status(401).json({
            status: "error",
            message: "Token tidak valid atau sudah kadaluarsa. Silakan login kembali.",
        });
    }
};

export default authMiddleware;
