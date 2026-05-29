/**
 * Batch prediction API test
 * Prerequisites: backend on :5000, FastAPI model on :8000
 *
 * Run: node test/batch.test.js
 */

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = "localhost";
const PORT = 5000;
const BASE = `http://${HOST}:${PORT}`;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function request(method, urlPath, { body, headers = {}, isMultipart, buffer } = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, BASE);
        const opts = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: { ...headers },
        };

        const req = http.request(opts, (res) => {
            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () => {
                const raw = Buffer.concat(chunks);
                let json = null;
                const ct = res.headers["content-type"] || "";
                if (ct.includes("application/json")) {
                    try {
                        json = JSON.parse(raw.toString());
                    } catch {
                        /* ignore */
                    }
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: raw,
                    json,
                });
            });
        });

        req.on("error", reject);
        if (buffer) req.write(buffer);
        else if (body) req.write(body);
        req.end();
    });
}

function buildMultipart(filePath) {
    const boundary = "----BatchTestBoundary" + Date.now();
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const parts = [
        `--${boundary}\r\n`,
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`,
        `Content-Type: text/csv\r\n\r\n`,
        fileContent,
        `\r\n--${boundary}--\r\n`,
    ];
    const buffer = Buffer.concat(parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p))));
    return {
        buffer,
        headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": buffer.length,
        },
    };
}

async function pollJob(jobId, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
        const res = await request("GET", `/api/batch/predictions/${jobId}`);
        if (res.status === 410) {
            throw new Error("Job expired unexpectedly during poll");
        }
        if (res.status !== 200) {
            throw new Error(`Poll failed: ${res.status} ${JSON.stringify(res.json)}`);
        }
        const job = res.json?.data;
        console.log(`  [poll ${i + 1}] status=${job?.status} ${job?.processedRows}/${job?.totalRows}`);
        if (job?.status === "completed" || job?.status === "failed") {
            return job;
        }
        await delay(2000);
    }
    throw new Error("Job did not complete in time");
}

async function run() {
    console.log("=== Batch API Test ===\n");

    // 1. Template
    console.log("1. GET /api/batch/template");
    const tpl = await request("GET", "/api/batch/template");
    if (tpl.status !== 200) throw new Error(`Template failed: ${tpl.status}`);
    console.log(`   OK (${tpl.body.length} bytes)\n`);

    // 2. Upload
    const templatePath = path.join(__dirname, "../src/data/batch_template.csv");
    console.log("2. POST /api/batch/predictions");
    const { buffer, headers } = buildMultipart(templatePath);
    const upload = await request("POST", "/api/batch/predictions", {
        buffer,
        headers,
    });
    if (upload.status !== 202) {
        throw new Error(`Upload failed: ${upload.status} ${upload.body.toString()}`);
    }
    const jobId = upload.json?.data?.id;
    console.log(`   Job created: ${jobId}\n`);

    // 3. Poll
    console.log("3. Poll until completed");
    const job = await pollJob(jobId);
    if (job.status !== "completed") {
        throw new Error(`Job failed: ${job.error || "unknown"}`);
    }
    console.log(`   Completed with ${job.results?.length} result(s)\n`);

    // 4. Download CSV
    console.log("4. GET download CSV");
    const csv = await request("GET", `/api/batch/predictions/${jobId}/download?format=csv`);
    if (csv.status !== 200) throw new Error(`CSV download failed: ${csv.status}`);
    console.log(`   OK (${csv.body.length} bytes)\n`);

    // 5. Download XLSX
    console.log("5. GET download XLSX");
    const xlsx = await request("GET", `/api/batch/predictions/${jobId}/download?format=xlsx`);
    if (xlsx.status !== 200) throw new Error(`XLSX download failed: ${xlsx.status}`);
    console.log(`   OK (${xlsx.body.length} bytes)\n`);

    // 6. List active jobs
    console.log("6. GET /api/batch/predictions (list)");
    const list = await request("GET", "/api/batch/predictions");
    if (list.status !== 200) throw new Error(`List failed: ${list.status}`);
    console.log(`   Active jobs: ${list.json?.count}\n`);

    // 7. Delete
    console.log("7. DELETE job");
    const del = await request("DELETE", `/api/batch/predictions/${jobId}`);
    if (del.status !== 200) throw new Error(`Delete failed: ${del.status}`);
    console.log("   OK\n");

    console.log("=== All batch tests passed ===");
}

run().catch((err) => {
    console.error("\nTest failed:", err.message);
    process.exit(1);
});
