// utils/batchFileParser.js
// Parser file CSV/XLSX untuk prediksi batch

import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { BATCH_MAX_ROWS } from "../services/batchPredictionService.js";

const EXPERIENCE_ALIASES = [
    "experience_desc",
    "deskripsi_pengalaman",
    "pengalaman",
    "experience",
];
const CV_ALIASES = ["cv_summary", "rangkuman_cv", "summary", "cv"];
const NUM_ALIASES = ["num", "years_experience", "tahun_pengalaman", "years"];

const normalizeHeader = (h) =>
    String(h || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

const findColumn = (headers, aliases) => {
    const normalized = headers.map(normalizeHeader);
    for (const alias of aliases) {
        const idx = normalized.indexOf(alias);
        if (idx !== -1) return headers[idx];
    }
    return null;
};

const getCell = (row, colName) => {
    if (!colName) return "";
    const val = row[colName];
    if (val === undefined || val === null) return "";
    return String(val).trim();
};

/**
 * Parse baris mentah menjadi input prediksi
 */
export const rowToPredictionInput = (row, headers) => {
    const textCol = findColumn(headers, ["text"]);
    const expCol = findColumn(headers, EXPERIENCE_ALIASES);
    const cvCol = findColumn(headers, CV_ALIASES);
    const numCol = findColumn(headers, NUM_ALIASES);

    let text = "";
    let experienceDesc = "";
    let cvSummary = "";

    if (textCol) {
        text = getCell(row, textCol);
        experienceDesc = "";
        cvSummary = "";
    } else {
        experienceDesc = expCol ? getCell(row, expCol) : "";
        cvSummary = cvCol ? getCell(row, cvCol) : "";
        text = [experienceDesc, cvSummary].filter(Boolean).join("\n\n").trim();
    }

    const numRaw = numCol ? getCell(row, numCol) : "";
    const num = numRaw === "" ? NaN : Number(numRaw);

    return {
        text,
        num,
        experienceDesc: experienceDesc || (textCol ? "" : experienceDesc),
        cvSummary: cvSummary || (textCol ? "" : cvSummary),
        raw: { experienceDesc, cvSummary, numRaw },
    };
};

const rowsFromSheet = async (buffer, originalName) => {
    const ext = (originalName || "").toLowerCase();
    if (ext.endsWith(".csv")) {
        const content = buffer.toString("utf-8");
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        });
        if (!records.length) {
            throw new Error("File CSV kosong atau tidak memiliki header.");
        }
        const headers = Object.keys(records[0]);
        return { headers, records };
    }

    if (ext.endsWith(".xlsx")) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            throw new Error("File Excel tidak memiliki sheet.");
        }

        const headers = [];
        const records = [];

        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || "").trim();
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

            const obj = {};

            headers.forEach((header, colNumber) => {
                obj[header] = row.getCell(colNumber).value ?? "";
            });

            records.push(obj);
        });
        return { headers, records };
    }

    throw new Error("Format file tidak didukung. Gunakan .csv atau .xlsx.");
};

/**
 * Parse buffer upload menjadi array baris siap prediksi
 */
export const parseBatchFile = async (buffer, originalName) => {
    const { headers, records } = await rowsFromSheet(buffer, originalName);

    const numCol = findColumn(headers, NUM_ALIASES);
    const textCol = findColumn(headers, ["text"]);
    const expCol = findColumn(headers, EXPERIENCE_ALIASES);
    const cvCol = findColumn(headers, CV_ALIASES);

    if (!numCol) {
        throw new Error(
            "Kolom tahun pengalaman wajib ada (num, years_experience, atau tahun_pengalaman)."
        );
    }

    if (!textCol && (!expCol || !cvCol)) {
        throw new Error(
            "File harus memiliki kolom text, atau kolom experience_desc + cv_summary (dengan alias yang didukung)."
        );
    }

    if (records.length > BATCH_MAX_ROWS) {
        throw new Error(`Maksimal ${BATCH_MAX_ROWS} baris per file batch.`);
    }

    const rows = records.map((record, index) => {
        const input = rowToPredictionInput(record, headers);
        return {
            rowIndex: index + 1,
            ...input,
        };
    });

    return { headers, rows, totalRows: rows.length };
};

/**
 * Validasi satu baris sebelum prediksi
 */
export const validateBatchRow = (row) => {
    if (!row.text || row.text.trim() === "") {
        return "Deskripsi pengalaman / rangkuman CV kosong.";
    }
    if (row.num === undefined || row.num === null || isNaN(Number(row.num))) {
        return "Tahun pengalaman tidak valid.";
    }
    return null;
};
