import { spawn } from "child_process";
import { logger } from "./logger.js";

export const runPythonScript = (data) => {
    return new Promise((resolve, reject) => {

        const pythonProcess = spawn("python", [
            "ai_model/predict.py",
            JSON.stringify(data)
        ]);

        let result = "";

        pythonProcess.stdout.on("data", (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            logger.error("PythonRunner", null, data.toString().trim());
        });

        pythonProcess.on("close", (code) => {
            if (code !== 0) {
                return reject(new Error(`Python process exited with code ${code}`));
            }
            resolve(result.trim());
        });

        pythonProcess.on("error", (err) => {
            logger.error("PythonRunner", null, err.message);
            reject(err);
        });

    });
};