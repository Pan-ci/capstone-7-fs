// Controller untuk CRUD riwayat prediksi (PostgreSQL)

import {
    getAllPredictions,
    getPredictionById,
    deletePredictionById,
    deleteAllPredictions,
} from "../services/predictionHistoryService.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/appError.js";

/**
 * GET /api/predictions
 * Ambil riwayat prediksi (per-user jika sudah login)
 */
export const getAll = async (req, res, next) => {
    const start = Date.now();
    try {
        const userId = req.user ? req.user.id : null;
        const data = await getAllPredictions(userId);
        res.json({
            status: "success",
            count: data.length,
            data,
        });
    } catch (error) {
        logger.error(
            "[PREDICTION HISTORY]",
            req.requestId,
            error.message,
            "total duration",
            `${Date.now() - start}ms`
        );
        next(error);
    }
};

/**
 * GET /api/predictions/:id
 * Ambil satu prediksi berdasarkan ID
 */
export const getById = async (req, res, next) => {
    const start = Date.now();
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;
        const record = await getPredictionById(id, userId);

        if (!record) {
            throw new AppError(`Prediksi dengan ID '${id}' tidak ditemukan.`, 404, "PREDICTION_NOT_FOUND");
        }

        res.json({ status: "success", data: record });
    } catch (error) {
        logger.error(
            "[PREDICTION HISTORY]",
            req.requestId,
            error.message,
            "total duration",
            `${Date.now() - start}ms`
        );
        next(error);
    }
};

/**
 * DELETE /api/predictions/:id
 * Hapus satu prediksi berdasarkan ID
 */
export const deleteById = async (req, res, next) => {
    const start = Date.now();
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;
        const deleted = await deletePredictionById(id, userId);

        if (!deleted) {
            throw new AppError(`Prediksi dengan ID '${id}' tidak ditemukan.`, 404, "PREDICTION_NOT_FOUND");
        }

        res.json({
            status: "success",
            message: `Prediksi '${id}' berhasil dihapus.`,
        });
    } catch (error) {
        logger.error(
            "[PREDICTION HISTORY]",
            req.requestId,
            error.message,
            "total duration",
            `${Date.now() - start}ms`
        );
        next(error);
    }
};

/**
 * DELETE /api/predictions
 * Hapus semua riwayat prediksi (milik user yang login)
 */
export const deleteAll = async (req, res, next) => {
    const start = Date.now();
    try {
        const userId = req.user ? req.user.id : null;
        const count = await deleteAllPredictions(userId);
        res.json({
            status: "success",
            message: `${count} prediksi berhasil dihapus.`,
        });
    } catch (error) {
        logger.error(
            "[PREDICTION HISTORY]",
            req.requestId,
            error.message,
            "total duration",
            `${Date.now() - start}ms`
        );
        next(error);
    }
};
