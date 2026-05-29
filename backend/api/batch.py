# api/batch.py

import io
import pandas as pd
from api.model import predict, build_text


REQUIRED_COLS = ["summary", "experience_desc", "years_experience"]


def safe_float(value):

    try:
        return float(value)
    except:
        raise ValueError(
            f"Invalid numeric value: {value}"
        )


def flatten_prediction_output(pred):

    flat = {
        "predicted_job": pred["predicted_job"],
        "confidence": pred["confidence"],
        "low_confidence": pred[
            "low_confidence"
        ],
        "prediction_gap": pred[
            "prediction_gap"
        ]
    }

    # top predictions
    for idx, item in enumerate(
        pred["top_predictions"],
        start=1
    ):

        flat[f"top_{idx}_label"] = item[
            "label"
        ]

        flat[f"top_{idx}_score"] = item[
            "score"
        ]

    # probabilities
    for label, score in pred[
        "probabilities"
    ].items():

        safe_label = (
            label.lower()
            .replace(" ", "_")
            .replace("/", "_")
        )

        flat[
            f"prob_{safe_label}"
        ] = score

    return flat


def run_batch(file):

    contents = file.file.read()

    print("FILE NAME:", file.filename)
    print("CONTENT TYPE:", file.content_type)

    # detect file type
    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))

    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(contents))

    else:
        raise ValueError("Unsupported file format")

    # basic validation
    for col in REQUIRED_COLS:
        if col not in df.columns:
            raise ValueError(f"Missing column: {col}")

    results = []
    errors = []

    for idx, row in df.iterrows():

        try:

            summary = str(row["summary"]).strip()
            experience_desc = str(
                row["experience_desc"]
            ).strip()

            if not summary:
                raise ValueError(
                    "summary is empty"
                )

            if not experience_desc:
                raise ValueError(
                    "experience_desc is empty"
                )

            years = safe_float(
                row["years_experience"]
            )

            if years < 0:
                raise ValueError(
                    "years_experience cannot be negative"
                )

            text = build_text(
                summary,
                experience_desc
            )

            pred = predict(text, years)

            results.append({
                **row.to_dict(),
                **flatten_prediction_output(pred),
                "status": "success"
            })

        except Exception as e:

            errors.append({
                "row": int(idx) + 1,
                "error": str(e)
            })

    result_df = pd.DataFrame(results)

    return result_df, errors
