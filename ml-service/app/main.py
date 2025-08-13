import os,json,joblib
import numpy as np
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


APP_DIR = Path(__file__).resolve().parent
MODEL_PATH = APP_DIR / "model.pkl"
ENCODER_PATH = APP_DIR / "label_encoder.pkl"
FEATURE_ORDER_PATH = APP_DIR / "feature_order.json"

if not MODEL_PATH.exists() or not ENCODER_PATH.exists() or not FEATURE_ORDER_PATH.exists():
    raise FileNotFoundError("Model, encoder, or feature order file not found. "
                            "Run training script first.")


model=joblib.load(MODEL_PATH)
label_encoder= joblib.load(ENCODER_PATH)

with open(FEATURE_ORDER_PATH) as f:
    feature_order=json.load(f)


app=FastAPI(title="Crop Recommendation API",version="1.0")

origins=os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,https://acroecology-project-r8rz.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class Features(BaseModel):
    N: float = Field(...,example=90),
    P: float = Field(...,example=42),
    K: float = Field(...,example=43),
    temperature:float=Field(...,example=22.4),
    humidity:float=Field(...,example=82.0)
    ph: float=Field(...,example=6.5)
    rainfall:float=Field(...,example=180.0)



@app.post("/predict")
def predict_crop(features:Features):
    try:
        input_data=[getattr(features,col) for col in feature_order]
        input_array=np.array(input_data).reshape(1,-1)

        probs=model.predict_proba(input_array)[0]
        top3_idx=np.argsort(probs)[::-1][:3]

        top3=[
            {"crop":label_encoder.inverse_transform([idx])[0],"prob":round(float(probs[idx]),4)}
            for idx in top3_idx
        ]

        return {
            "crop":top3[0]["crop"],
            "top3":top3,
            "probs":{label_encoder.inverse_transform([i])[0]: round(float(p),4) for i , p in enumerate(probs)},"model_version":"1.0"
        }
    
    except Exception as e:
        return {"error":str(e)}
    


@app.get("/health")
def health():
    return {"status":"ok","model_loaded":MODEL_PATH.exists()}


