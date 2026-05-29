# api/schemas.py

from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Any

class PredictRequest(BaseModel):

    summary: str = Field(..., min_length=1)
    experience_desc: str = Field(..., min_length=1)
    years_experience: float = Field(..., ge=0)

    @field_validator("summary")
    @classmethod
    def validate_summary(cls, value):

        value = value.strip()

        if not value:
            raise ValueError(
                "summary cannot be empty"
            )

        return value

    @field_validator("experience_desc")
    @classmethod
    def validate_experience(cls, value):

        value = value.strip()

        if not value:
            raise ValueError(
                "experience_desc cannot be empty"
            )

        return value


class TopPrediction(BaseModel):
    label: str
    score: float


class PredictResponse(BaseModel):
    predicted_job: str
    confidence: float
    low_confidence: bool
    prediction_gap: float

    top_predictions: List[TopPrediction]
    probabilities: Dict[str, float]
    