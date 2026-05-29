// Middleware upload file batch (memory storage)

import multer from "multer";

const MAX_FILE_SIZE = Number(process.env.BATCH_MAX_FILE_BYTES) || 5 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const allowed =
        name.endsWith(".csv") ||
        name.endsWith(".xlsx") ||
        name.endsWith(".xls") ||
        file.mimetype === "text/csv" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.mimetype === "application/vnd.ms-excel";

    if (allowed) {
        cb(null, true);
    } else {
        cb(new Error("Hanya file .csv atau .xlsx yang diperbolehkan."), false);
    }
};

export const batchUpload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
}).single("file");

export const handleMulterError = (err, req, res, next) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            status: "error",
            message: "Ukuran file melebihi batas 5 MB.",
        });
    }
    return res.status(400).json({
        status: "error",
        message: err.message || "Gagal mengunggah file.",
    });
};
