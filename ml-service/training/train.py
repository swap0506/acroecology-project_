import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score,f1_score,classification_report
from sklearn.preprocessing import LabelEncoder

ROOT = Path(__file__).resolve().parent.parent  # /ml-service
DATA_PATH = ROOT / "training" / "data" / "Crop_recommendation.csv"
MODEL_PATH = ROOT / "app" / "model.pkl"
ENCODER_PATH = ROOT / "app" / "label_encoder.pkl"
FEATURE_ORDER_PATH = ROOT / "app" / "feature_order.json"

print(f"📥 Loading dataset from: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)

required_cols=['N','P','K','temperature','humidity','ph','rainfall','label']
missing_cols=set(required_cols)-set(df.columns)
if missing_cols:
    raise ValueError(f"Dataset missing columns{missing_cols}")


X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
y = df['label']

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

X_train,X_val,y_train,y_val=train_test_split(X,y_encoded,test_size=0.2,stratify=y_encoded,random_state=42)


print("Training RandomForestClassifier ..")

model=RandomForestClassifier(
    n_estimators=300,
    max_depth=None,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train,y_train)


y_pred=model.predict(X_val)
acc=accuracy_score(y_val,y_pred)

f1=f1_score(y_val,y_pred,average='macro')


print(f"\n✅ Validation Accuracy: {acc*100:.2f}%")
print(f"✅ Validation Macro-F1: {f1:.4f}")
print("\n📊 Classification Report:")
print(classification_report(y_val, y_pred, target_names=label_encoder.classes_))

MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(model, MODEL_PATH)
joblib.dump(label_encoder, ENCODER_PATH)

with open(FEATURE_ORDER_PATH, "w") as f:
    json.dump(list(X.columns), f)

print(f"\n💾 Model saved to: {MODEL_PATH}")
print(f"💾 Label encoder saved to: {ENCODER_PATH}")
print(f"💾 Feature order saved to: {FEATURE_ORDER_PATH}")

sample = X.iloc[[0]]
probs = model.predict_proba(sample)[0]
pred_idx = np.argmax(probs)
pred_crop = label_encoder.inverse_transform([pred_idx])[0]
print("\n🔍 Quick test prediction:")
print(f"Input: {sample.to_dict(orient='records')[0]}")
print(f"Predicted crop: {pred_crop} (prob: {probs[pred_idx]:.2f})")
