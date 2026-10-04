"""
triage_model.py
---------------
XGBoost classifier trained on the DDXPlus dataset (Mila / Quebec AI Institute).
223 evidence features → 49 disease classes.

Dataset: https://figshare.com/articles/dataset/DDXPlus_Dataset/20043374
Paper:   https://arxiv.org/abs/2205.09148
"""

import json
import ast
import pickle
import numpy as np
import pandas as pd
from pathlib import Path

# Paths
BASE_DIR        = Path(__file__).resolve().parent.parent
DDXPLUS_DIR     = BASE_DIR / "data" / "ddxplus"
TRAIN_CSV       = DDXPLUS_DIR / "release_train_patients"
VALIDATE_CSV    = DDXPLUS_DIR / "release_validate_patients"
TEST_CSV        = DDXPLUS_DIR / "release_test_patients"
CONDITIONS_JSON = DDXPLUS_DIR / "release_conditions.json"
EVIDENCES_JSON  = DDXPLUS_DIR / "release_evidences.json"

MODEL_PATH      = BASE_DIR / "models" / "ddx_classifier.pkl"
FEATURES_PATH   = BASE_DIR / "models" / "ddx_features.json"
CLASSES_PATH    = BASE_DIR / "models" / "ddx_classes.json"
EVIDENCE_MAP_PATH = BASE_DIR / "models" / "ddx_evidence_map.json"
CONDITION_MAP_PATH = BASE_DIR / "models" / "ddx_condition_map.json"


# Symptom → Evidence mapping 
# Maps your extraction.py symptom keys → DDXPlus evidence codes
# Built from reading release_evidences.json question_en fields
SYMPTOM_TO_EVIDENCE = {
    # General / systemic
    "fever":               ["E_91"],   # fever felt or measured
    "high_fever":          ["E_91"],
    "chills":              ["E_21"],   # chills/rigors
    "sweating":            ["E_63"],   # sweating
    "fatigue":             ["E_103"],  # fatigue/tiredness
    "weakness":            ["E_103", "E_149"],
    "weight_loss":         ["E_146"],  # weight loss
    "loss_of_appetite":    ["E_132"],  # loss of appetite
    "night_sweats":        ["E_63"],

    # Head / neuro
    "headache":            ["E_55"],   # headache
    "dizziness":           ["E_86"],   # dizziness/vertigo
    "confusion":           ["E_162"],  # confusion/altered consciousness
    "seizure":             ["E_114"],  # seizure
    "fainting":            ["E_86"],
    "blurred_vision":      ["E_159"],  # visual disturbance
    "numbness":            ["E_149"],  # numbness/tingling
    "neck_pain":           ["E_58"],   # neck stiffness/pain

    # Respiratory
    "cough":               ["E_8"],    # cough
    "shortness_of_breath": ["E_167"],  # dyspnoea/breathlessness
    "difficulty_breathing":["E_167"],
    "wheezing":            ["E_167", "E_8"],
    "sore_throat":         ["E_143"],  # sore throat
    "runny_nose":          ["E_14"],   # runny nose / nasal symptoms
    "chest_pain":          ["E_29"],   # chest pain

    # Cardiac
    "palpitations":        ["E_110"],  # palpitations
    "rapid_heartbeat":     ["E_110"],
    "swelling":            ["E_95"],   # oedema/swelling

    # Gastrointestinal
    "nausea":              ["E_42"],   # nausea
    "vomiting":            ["E_101"],  # vomiting
    "diarrhea":            ["E_32"],   # diarrhea
    "abdominal_pain":      ["E_5"],    # abdominal pain
    "constipation":        ["E_25"],   # constipation
    "bloating":            ["E_5"],
    "heartburn":           ["E_5"],
    "blood_in_stool":      ["E_32"],
    "jaundice":            ["E_160"],  # jaundice

    # Musculoskeletal
    "joint_pain":          ["E_57"],   # joint pain
    "muscle_pain":         ["E_66"],   # muscle pain/myalgia
    "back_pain":           ["E_2"],    # back pain

    # Skin
    "rash":                ["E_77"],   # skin rash
    "skin_rash":           ["E_77"],
    "itching":             ["E_77"],

    # Urinary
    "urinary_symptoms":    ["E_120"],  # urinary symptoms

    # Mental health
    "anxiety":             ["E_103"],
    "stress":              ["E_103"],
    "depression":          ["E_103"],
    "insomnia":            ["E_103"],
}


def load_meta():
    """Load evidence and condition metadata from DDXPlus JSON files."""
    with open(CONDITIONS_JSON, "r", encoding="utf-8") as f:
        conditions_raw = json.load(f)

    with open(EVIDENCES_JSON, "r", encoding="utf-8") as f:
        evidences_raw = json.load(f)

    # Map: pathology code → English name
    # DDXPlus PATHOLOGY column uses English condition names directly
    condition_map = {}
    for key, val in conditions_raw.items():
        eng_name = val.get("cond-name-eng", key)
        condition_map[key] = eng_name
        # Also map by English name (some rows use English directly)
        condition_map[eng_name] = eng_name

    # Map: evidence code → English question (short label)
    evidence_map = {}
    for code, val in evidences_raw.items():
        q_en = val.get("question_en", code)
        # Create short label from question
        short = q_en[:60].strip()
        evidence_map[code] = short

    return condition_map, evidence_map


def parse_evidences(evidences_str: str) -> list:
    """Parse EVIDENCES column — stored as string representation of a list."""
    try:
        items = ast.literal_eval(evidences_str)
        # Strip value suffixes like E_54_@_V_161 → E_54
        codes = []
        for item in items:
            base = item.split("_@_")[0]
            codes.append(base)
        return codes
    except Exception:
        return []


def build_feature_matrix(df: pd.DataFrame, all_evidence_codes: list,
                         code_to_idx: dict, sample_size: int = None) -> tuple:
    """
    Convert raw DDXPlus dataframe to binary feature matrix.

    Returns:
        X: np.ndarray shape (n_samples, n_features)
        y: np.ndarray of pathology labels
    """
    if sample_size and len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)

    n = len(df)
    n_feat = len(all_evidence_codes)
    X = np.zeros((n, n_feat), dtype=np.float32)
    y = df["PATHOLOGY"].values

    print(f"  Building matrix: {n} samples × {n_feat} features...")

    for i, (_, row) in enumerate(df.iterrows()):
        if i % 50000 == 0 and i > 0:
            print(f"    {i:,} / {n:,} rows processed...")
        codes = parse_evidences(str(row["EVIDENCES"]))
        for code in codes:
            if code in code_to_idx:
                X[i, code_to_idx[code]] = 1

    return X, y

# triage model class     

class TriageModel:
    """
    Wraps the trained XGBoost classifier on DDXPlus.
    Lazy-loads on first prediction call.
    """

    def __init__(self):
        self._model = None
        self._features = None      # list of evidence codes
        self._classes = None       # list of disease English names
        self._evidence_map = None  # code → short English label
        self._condition_map = None # pathology code → English name

    def _load(self):
        if self._model is not None:
            return

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"DDXPlus model not found at {MODEL_PATH}.\n"
                "Run: python models/triage_model.py"
            )

        with open(MODEL_PATH, "rb") as f:
            self._model = pickle.load(f)
        with open(FEATURES_PATH, "r") as f:
            self._features = json.load(f)
        with open(CLASSES_PATH, "r") as f:
            self._classes = json.load(f)
        with open(EVIDENCE_MAP_PATH, "r") as f:
            self._evidence_map = json.load(f)
        with open(CONDITION_MAP_PATH, "r") as f:
            self._condition_map = json.load(f)

        print(f"[TriageModel] Loaded DDXPlus model — "
              f"{len(self._features)} evidence features, "
              f"{len(self._classes)} disease classes")

    def predict(self, extracted_symptoms: list) -> dict:
        """
        Predict top-3 diseases from extracted symptom keys.

        Args:
            extracted_symptoms: list of symptom strings from extraction.py
                e.g. ['fever', 'cough', 'chest_pain']

        Returns:
            {
                "top_predictions": [
                    {"disease": "Pneumonia", "confidence": 0.71},
                    ...
                ],
                "primary_disease": "Pneumonia",
                "primary_confidence": 0.71,
                "matched_evidences": ["E_91", "E_8", "E_29"],
            }
        """
        self._load()

        feature_vector = np.zeros(len(self._features))
        matched_evidences = []

        for symptom in extracted_symptoms:
            symptom_key = symptom.lower().replace(" ", "_").replace("-", "_")

            # Get evidence codes for this symptom
            evidence_codes = SYMPTOM_TO_EVIDENCE.get(symptom_key, [])

            # Fuzzy fallback if no direct mapping
            if not evidence_codes:
                for key, codes in SYMPTOM_TO_EVIDENCE.items():
                    if symptom_key in key or key in symptom_key:
                        evidence_codes = codes
                        break

            for code in evidence_codes:
                if code in self._features:
                    idx = self._features.index(code)
                    feature_vector[idx] = 1
                    if code not in matched_evidences:
                        matched_evidences.append(code)

        if not any(feature_vector):
            return {
                "top_predictions": [],
                "primary_disease": None,
                "primary_confidence": 0.0,
                "matched_evidences": [],
                "note": "No matching evidence codes found"
            }

        # Predict
        proba = self._model.predict_proba([feature_vector])[0]
        top_indices = np.argsort(proba)[::-1][:3]

        top_predictions = []
        for idx in top_indices:
            confidence = float(proba[idx])
            if confidence > 0.01:
                raw_label = self._classes[idx]
                english_name = self._condition_map.get(raw_label, raw_label)
                top_predictions.append({
                    "disease": english_name,
                    "confidence": round(confidence, 3)
                })

        primary = top_predictions[0] if top_predictions else None

        # Human-readable evidence labels
        matched_labels = [
            self._evidence_map.get(e, e) for e in matched_evidences
        ]

        return {
            "top_predictions": top_predictions,
            "primary_disease": primary["disease"] if primary else None,
            "primary_confidence": primary["confidence"] if primary else 0.0,
            "matched_evidences": matched_evidences,
            "matched_labels": matched_labels,
        }


# Training 

def train():
    try:
        from xgboost import XGBClassifier
        from sklearn.preprocessing import LabelEncoder
        from sklearn.metrics import accuracy_score, classification_report
    except ImportError:
        print("Run: pip install xgboost scikit-learn pandas numpy joblib")
        return

    if not TRAIN_CSV.exists():
        print(f"Training file not found: {TRAIN_CSV}")
        print("Download DDXPlus from: https://figshare.com/articles/dataset/DDXPlus_Dataset/20043374")
        return

    print("=" * 60)
    print("DDXPlus XGBoost Training Pipeline")
    print("=" * 60)

    # Load metadata
    print("\n[1/7] Loading metadata...")
    condition_map, evidence_map = load_meta()
    print(f"  Conditions : {len(condition_map)}")
    print(f"  Evidences  : {len(evidence_map)}")

    # Get all evidence codes (feature names)
    all_evidence_codes = sorted(evidence_map.keys())
    code_to_idx = {code: i for i, code in enumerate(all_evidence_codes)}
    print(f"  Feature dim: {len(all_evidence_codes)}")

    # Load training data
    # DDXPlus has ~1M training samples — use 300k for CPU training speed
    # Full dataset would take 30-60 mins on CPU; 300k takes ~5-8 mins
    TRAIN_SAMPLES = 300_000
    VALIDATE_SAMPLES = 50_000

    print(f"\n[2/7] Loading training data (sample: {TRAIN_SAMPLES:,})...")
    train_df = pd.read_csv(TRAIN_CSV, nrows=TRAIN_SAMPLES)
    print(f"  Loaded {len(train_df):,} training rows")
    print(f"  Diseases: {train_df['PATHOLOGY'].nunique()}")

    print(f"\n[3/7] Loading validation data (sample: {VALIDATE_SAMPLES:,})...")
    val_df = pd.read_csv(VALIDATE_CSV, nrows=VALIDATE_SAMPLES)
    print(f"  Loaded {len(val_df):,} validation rows")

    # Build feature matrices
    print("\n[4/7] Building feature matrices...")
    X_train, y_train_raw = build_feature_matrix(
        train_df, all_evidence_codes, code_to_idx
    )
    X_val, y_val_raw = build_feature_matrix(
        val_df, all_evidence_codes, code_to_idx
    )

    # Encode labels
    print("\n[5/7] Encoding labels...")
    le = LabelEncoder()
    le.fit(list(y_train_raw) + list(y_val_raw))
    y_train = le.transform(y_train_raw)
    y_val = le.transform(y_val_raw)

    classes = list(le.classes_)
    print(f"  Classes: {len(classes)}")
    print(f"  Sample classes: {classes[:5]}")

    # Train XGBoost
    print(f"\n[6/7] Training XGBoost classifier...")
    print("  This will take 5-15 minutes on CPU. Please wait...")
    print("  (Using 300k samples out of ~1M for CPU efficiency)")

    clf = XGBClassifier(
        n_estimators=300,
        max_depth=8,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
        tree_method="hist",   # fastest CPU method
        verbosity=1,
    )

    clf.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=50,
    )

    # Evaluate
    print("\n[7/7] Evaluating on validation set...")
    y_pred = clf.predict(X_val)
    acc = accuracy_score(y_val, y_pred)
    print(f"  Validation accuracy: {acc:.4f} ({acc*100:.1f}%)")

    # Top-3 accuracy
    y_proba = clf.predict_proba(X_val)
    top3_correct = 0
    for true_label, probs in zip(y_val, y_proba):
        top3 = np.argsort(probs)[::-1][:3]
        if true_label in top3:
            top3_correct += 1
    top3_acc = top3_correct / len(y_val)
    print(f"  Top-3 accuracy     : {top3_acc:.4f} ({top3_acc*100:.1f}%)")

    # Save everything
    print("\n  Saving artifacts...")
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(clf, f)
    print(f"  Model      → {MODEL_PATH}")

    with open(FEATURES_PATH, "w") as f:
        json.dump(all_evidence_codes, f, indent=2)
    print(f"  Features   → {FEATURES_PATH}")

    with open(CLASSES_PATH, "w") as f:
        json.dump(classes, f, indent=2)
    print(f"  Classes    → {CLASSES_PATH}")

    with open(EVIDENCE_MAP_PATH, "w") as f:
        json.dump(evidence_map, f, indent=2)
    print(f"  Evidences  → {EVIDENCE_MAP_PATH}")

    with open(CONDITION_MAP_PATH, "w") as f:
        json.dump(condition_map, f, indent=2)
    print(f"  Conditions → {CONDITION_MAP_PATH}")

    # Sanity tests
    print("\n=== Sanity Tests ===")
    model = TriageModel()

    tests = [
        (["fever", "cough", "shortness_of_breath", "chest_pain"],
         "Expected: Pneumonia / Bronchitis"),
        (["fever", "headache", "joint_pain", "rash", "nausea"],
         "Expected: Dengue / Viral syndrome"),
        (["chest_pain", "shortness_of_breath", "sweating", "palpitations"],
         "Expected: Cardiac / PE"),
        (["headache", "fever", "neck_pain", "confusion"],
         "Expected: Meningitis"),
        (["cough", "fatigue", "weight_loss", "night_sweats"],
         "Expected: Tuberculosis"),
        (["vomiting", "diarrhea", "abdominal_pain", "fever"],
         "Expected: Gastroenteritis"),
    ]

    for symptoms, note in tests:
        result = model.predict(symptoms)
        print(f"\nInput   : {symptoms}")
        print(f"Note    : {note}")
        print(f"Matched : {result.get('matched_evidences', [])}")
        for p in result["top_predictions"]:
            bar = "█" * int(p["confidence"] * 30)
            print(f"  {p['disease']:<40} {bar} {p['confidence']*100:.1f}%")

    print("\nTraining complete!")
    print(f"   Accuracy : {acc*100:.1f}%")
    print(f"   Top-3    : {top3_acc*100:.1f}%")
    print(f"   Diseases : {len(classes)}")
    print(f"   Features : {len(all_evidence_codes)}")


if __name__ == "__main__":
    train()