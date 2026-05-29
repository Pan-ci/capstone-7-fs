# api/model.py

import tensorflow as tf
import pickle
import numpy as np

MODEL_PATH = "job_classifier.keras"
ENCODER_PATH = "label_encoder.pkl"
TOP_K = 3
LOW_CONFIDENCE_THRESHOLD = 0.60

# load model
model = tf.keras.models.load_model(MODEL_PATH)

# load label encoder
with open(ENCODER_PATH, "rb") as f:
    label_encoder = pickle.load(f)


def build_text(summary: str, experience_desc: str) -> str:
    return f"{summary} {experience_desc}"


def predict(text: str, years_experience: float):

    text_tensor = tf.constant([[text]], dtype=tf.string)
    num_tensor = tf.constant([[years_experience]], dtype=tf.float32)

    preds = model.predict(
        {
            "text_input": text_tensor,
            "num_input": num_tensor
        },
        verbose=0
    )

    pred_class = np.argmax(preds, axis=1)[0]
    confidence = round(
        float(np.max(preds)),
        4
    )

    label = label_encoder.inverse_transform([pred_class])[0]

    # build probabilities
    probabilities = {
        label_encoder.classes_[i]: round(
            float(preds[0][i]),
            4
        )
        for i in range(
            len(label_encoder.classes_)
        )
    }

    # sort descending
    probabilities = dict(
        sorted(
            probabilities.items(),
            key=lambda item: item[1],
            reverse=True
        )
    )

    # top-k predictions
    top_predictions = [
        {
            "label": label,
            "score": score
        }
        for label, score in list(
            probabilities.items()
        )[:TOP_K]
    ]

    # confidence gap between top-1 and top-2
    prediction_gap = 0.0

    if len(top_predictions) >= 2:

        prediction_gap = round(
            top_predictions[0]["score"]
            - top_predictions[1]["score"],
            4
        )

    low_confidence = (
        confidence < LOW_CONFIDENCE_THRESHOLD
    )

    return {
        "predicted_job": label,
        "confidence": confidence,
        "low_confidence": low_confidence,
        "prediction_gap": prediction_gap,
        "top_predictions": top_predictions,
        "probabilities": probabilities
    }
