# api/main.py

import uuid

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi import Query, Request
from api.model import predict, build_text
from api.schemas import PredictRequest, PredictResponse
from api.batch import run_batch
from fastapi.middleware.cors import CORSMiddleware
import io

# DEBUGGING
import time
import os
import traceback
import logging
from pprint import pformat

app = FastAPI(
    title="Job Classification API",
    version="1.0"
)

# =========================================================
# DEBUGGING (Development Only)
# Disable/remove in production if needed


DEBUG = os.getenv("ENV", "development") == "development"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("job-classification-api")


def debug_log(request: Request, message):
    request_id = request.headers.get(
        "x-request-id",
        str(uuid.uuid4())
    )
    
    if DEBUG:
        # Kalau bukan string, otomatis diformat dengan pprint
        if not isinstance(message, str):
            message = pformat(message)
        logger.info(
            f"[FASTAPI] requestId={request_id} {message}"
        )


frontend_urls = os.getenv("BACKEND_URL", "*")

if frontend_urls == "*":
    origins = ["*"]
    allow_credentials = False
else:
    origins = [
        url.strip()
        for url in frontend_urls.split(",")
        if url.strip()
    ]
    allow_credentials = True

logger.info(f"CORS origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🧠 Catatan (bukan urgent)

# 🟡 Nanti kalau production:

# allow_origins=["*"] HARUS diganti domain frontend saja

# =========================================================

@app.get("/")
def home():
    return {"message": "API is running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": True
    }


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("x-request-id", "unknown")

    start = time.time()

    response = await call_next(request)

    process_time = (time.time() - start) * 1000

    print(
        f"[FASTAPI] requestId={request_id} "
        f"path={request.url.path} "
        f"time={process_time:.2f}ms"
    )

    response.headers["x-request-id"] = request_id

    return response


# =========================
# SINGLE PREDICTION
# =========================
@app.post("/predict", response_model=PredictResponse)
def predict_job(
    payload: PredictRequest,
    request: Request
):

    debug_log(
        request,
        f"[PREDICT] years_experience={payload.years_experience}"
    )

    # combine text fields internally
    text = build_text(
        payload.summary,
        payload.experience_desc
    )

    debug_log(
        request,
        f"[PREDICT] text_length={len(text)}"
    )

    try:
        result = predict(
            text=text,
            years_experience=payload.years_experience
        )

        debug_log(
            request,
            f"[PREDICT] predicted_job={result.get('predicted_job')}"
        )

        return result

    except Exception as e:

        logger.exception(
            "[PREDICT ERROR] prediction failed"
        )

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "traceback":
                    traceback.format_exc() if DEBUG else None
            }
        )


# =========================
# BATCH PREDICTION
# =========================
@app.post("/predict/batch")
async def predict_batch(
    request: Request,
    file: UploadFile = File(...),
    download: bool = Query(False)
):

    debug_log(
        request,
        f"[BATCH] filename={file.filename}"
    )

    debug_log(
        request,
        f"[BATCH] download={download}"
    )

    try:

        result_df, errors = run_batch(file)

        debug_log(
            request,
            f"[BATCH] success_rows={len(result_df)}"
        )

        debug_log(
            request,
            f"[BATCH] error_rows={len(errors)}"
        )

        # OPTION 1 → JSON response
        if not download:

            return JSONResponse(
                content={
                    "rows": len(result_df),
                    "success_rows": len(result_df),
                    "error_rows": len(errors),
                    "results": result_df.to_dict(
                        orient="records"
                    ),
                    "errors": errors
                }
            )

        # OPTION 2 → downloadable CSV
        stream = io.StringIO()

        result_df.to_csv(stream, index=False)

        stream.seek(0)

        return StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition":
                    "attachment; filename=prediction_results.csv"
            }
        )

    except Exception as e:

        logger.exception(
            "[BATCH ERROR] batch prediction failed"
        )

        return JSONResponse(
            status_code=400,
            content={
                "error": str(e),
                "traceback":
                    traceback.format_exc() if DEBUG else None
            }
        )


# @app.post("/predict/explain")
# def predict_with_explanation(request: PredictRequest):

#     # 1. ML prediction
#     result = predict(
#         text=request.text,
#         years_experience=request.years_experience
#     )

#     # 2. GenAI explanation (single input ONLY)
#     try:
#         explanation = generate_explanation(
#             text=request.text,
#             prediction=result
#         )
#     except Exception as e:
#         explanation = f"Explanation unavailable: {str(e)}"


#     # 3. merge response
#     return {
#         **result,
#         "explanation": explanation
#     }
