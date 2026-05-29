// utils/batchExport.js
// Export hasil batch ke CSV atau XLSX

import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LABEL_PATH = path.join(__dirname, "../../../models/label_mapping.json");

let labelList = ["admin", "data_analyst", "software_engineer", "teacher"];

try {
    const raw = fs.readFileSync(LABEL_PATH, "utf-8");
    const map = JSON.parse(raw);
    labelList = Object.values(map);
} catch {
    // fallback default
}

const splitInputText = (text) => {
    const parts = String(text || "").split("\n\n");
    if (parts.length >= 2) {
        return {
            experienceDesc: parts[0].trim(),
            cvSummary: parts.slice(1).join("\n\n").trim(),
        };
    }
    return { experienceDesc: text || "", cvSummary: "" };
};

export const getLabelList = () => [...labelList];

const getProbabilityLabels = (job) => {
    const labels = new Set(labelList);
    for (const result of job.results || []) {
        for (const label of Object.keys(result.probabilities || {})) {
            labels.add(label);
        }
    }
    return [...labels];
};

/**
 * Ubah hasil job menjadi baris flat untuk export
 */
export const jobResultsToExportRows = (job) => {
    const probabilityLabels = getProbabilityLabels(job);

    return (job.results || []).map((r) => {
        const fromStored =
            r.experienceDesc !== undefined
                ? { experienceDesc: r.experienceDesc, cvSummary: r.cvSummary }
                : splitInputText(r.input?.text);

        const row = {
            row: r.row,

            summary: fromStored.cvSummary ?? "",

            experience_desc: fromStored.experienceDesc ?? "",

            years_experience: r.input?.num ?? "",

            predicted_job: r.predicted_job ?? "",

            confidence: r.confidence ?? "",

            low_confidence: r.low_confidence ?? "",

            prediction_gap: r.prediction_gap ?? "",

            top_predictions: Array.isArray(r.top_predictions)
                ? r.top_predictions
                    .map((item) => `${item.label}:${item.score}`)
                    .join("; ")
                : "",
        };

        for (const label of probabilityLabels) {
            row[`prob_${label}`] =
                r.probabilities?.[label] !== undefined ? r.probabilities[label] : "";
        }

        return row;
    });
};

export const buildCsvBuffer = (job) => {
    const rows = jobResultsToExportRows(job);
    if (!rows.length) {
        const headers = [
            "row",
            "summary",
            "experience_desc",
            "years_experience",
            "predicted_job",
            "confidence",
            "low_confidence",
            "prediction_gap",
            "top_predictions",
            ...getProbabilityLabels(job).map((label) => `prob_${label}`),
        ];
        return Buffer.from(`${headers.join(",")}\n`, "utf-8");
    }

    const headers = Object.keys(rows[0]);
    const escape = (v) => {
        const s = String(v ?? "");
        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    const lines = [
        headers.join(","),
        ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
    ];
    return Buffer.from(lines.join("\n"), "utf-8");
};

export const buildXlsxBuffer = async (job) => {
    const rows = jobResultsToExportRows(job);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Predictions");
    const exportRows = rows.length
        ? rows
        : [
            {
                row: "",
                summary: "",
                experience_desc: "",
                years_experience: "",
                predicted_job: "",
                confidence: "",
                low_confidence: "",
                prediction_gap: "",
                top_predictions: "",
                ...Object.fromEntries(
                    getProbabilityLabels(job).map((label) => [`prob_${label}`, ""])
                ),
            },
        ];

    worksheet.columns = Object.keys(exportRows[0]).map((key) => ({
        header: key,
        key,
    }));

    if (rows.length) {
        worksheet.addRows(rows);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
};
