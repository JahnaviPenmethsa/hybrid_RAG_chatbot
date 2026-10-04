r"""
run_evaluation.py
-----------------
Full evaluation suite for SymptoTrackAI.

Generates:
  1. ML Classifier metrics — accuracy, precision, recall, F1, confusion matrix
  2. RAG pipeline metrics — RAG vs no-RAG comparison across 20 test cases
  3. Emergency detection accuracy
  4. Triage level accuracy
  5. Citation confidence statistics
  6. Full printed report + saved JSON

Run from backend folder:
    cd C:\Users\DELL\Desktop\project\backend
    python scripts/run_evaluation.py

Output files:
    evaluation_report.json   — full results
    confusion_matrix.png     — visual confusion matrix (top 15 diseases)
"""

import sys
import os
import json
import time
import numpy as np
import requests
from pathlib import Path
from datetime import datetime

# ── Path setup ─────────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# ── Constants ──────────────────────────────────────────────────────────────────
API_BASE = "http://127.0.0.1:8000"
REPORT_PATH = BACKEND_DIR / "evaluation_report.json"
MATRIX_PATH = BACKEND_DIR / "confusion_matrix.png"

# ── Test cases ─────────────────────────────────────────────────────────────────
# (symptoms, expected_triage_level, is_emergency, label)
TEST_CASES = [
    # Emergency cases
    ("chest pain and difficulty breathing",          4, True,  "cardiac_emergency"),
    ("i had a seizure yesterday",                    4, True,  "seizure"),
    ("severe chest pain radiating to left arm",      4, True,  "heart_attack"),
    ("sudden face drooping arm weakness slurred speech", 4, True, "stroke"),
    ("anaphylaxis throat swelling difficulty breathing", 4, True, "anaphylaxis"),

    # High severity
    ("fever headache joint pain rash nausea for 3 days", 3, False, "dengue"),
    ("high fever chills severe headache sweating",   3, False, "malaria"),
    ("persistent cough blood in sputum weight loss night sweats", 3, False, "tuberculosis"),
    ("jaundice dark urine fatigue abdominal pain",   3, False, "hepatitis"),
    ("severe abdominal pain vomiting blood",         3, False, "gi_emergency"),

    # Moderate severity
    ("fever and headache for 2 days",                2, False, "viral_fever"),
    ("cough sore throat runny nose mild fever",      2, False, "common_cold"),
    ("nausea vomiting diarrhea stomach ache",        2, False, "gastroenteritis"),
    ("joint pain swelling morning stiffness",        2, False, "arthritis"),
    ("burning urination frequent urination",         2, False, "uti"),

    # Low severity
    ("mild headache and fatigue",                    1, False, "tension_headache"),
    ("lots of stress and no sleep",                  1, False, "stress"),
    ("skin rash itching on arms",                    1, False, "skin_allergy"),
    ("bloating and gas after meals",                 1, False, "ibs"),
    ("runny nose sneezing no fever",                 1, False, "cold"),
]


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — ML Classifier Evaluation
# ══════════════════════════════════════════════════════════════════════════════

def evaluate_ml_classifier():
    """
    Re-evaluate the trained DDXPlus/Kaggle classifier on validation data.
    Computes accuracy, precision, recall, F1, confusion matrix.
    """
    print("\n" + "═" * 60)
    print("SECTION 1 — ML Classifier Evaluation")
    print("═" * 60)

    try:
        import pickle
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score,
            f1_score, classification_report, confusion_matrix
        )
        import pandas as pd
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Run: pip install scikit-learn matplotlib seaborn pandas")
        return None

    # Try DDXPlus model first, fall back to Kaggle
    ddx_model_path = BACKEND_DIR / "models" / "ddx_classifier.pkl"
    rf_model_path  = BACKEND_DIR / "models" / "rf_classifier.pkl"
    ddx_features   = BACKEND_DIR / "models" / "ddx_features.json"
    rf_features    = BACKEND_DIR / "models" / "symptom_features.json"
    ddx_classes    = BACKEND_DIR / "models" / "ddx_classes.json"
    rf_classes     = BACKEND_DIR / "models" / "disease_classes.json"

    # ── DDXPlus path ──
    if ddx_model_path.exists():
        print("\nUsing DDXPlus XGBoost model")
        model_name = "XGBoost (DDXPlus)"

        with open(ddx_model_path, "rb") as f:
            clf = pickle.load(f)
        with open(ddx_features, "r") as f:
            features = json.load(f)
        with open(ddx_classes, "r") as f:
            classes = json.load(f)

        # Load validation data
        val_csv = BACKEND_DIR / "data" / "ddxplus" / "release_validate_patients"
        if not val_csv.exists():
            print("Validation CSV not found — skipping ML evaluation")
            return None

        print("Loading validation data (50,000 samples)...")
        import ast
        val_df = pd.read_csv(val_csv, nrows=50_000)

        code_to_idx = {code: i for i, code in enumerate(features)}
        n = len(val_df)
        X_val = np.zeros((n, len(features)), dtype=np.float32)
        y_val_raw = val_df["PATHOLOGY"].values

        for i, (_, row) in enumerate(val_df.iterrows()):
            try:
                items = ast.literal_eval(str(row["EVIDENCES"]))
                for item in items:
                    code = item.split("_@_")[0]
                    if code in code_to_idx:
                        X_val[i, code_to_idx[code]] = 1
            except Exception:
                pass

        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        le.fit(classes)

        # Filter rows whose label is in training classes
        mask = np.isin(y_val_raw, classes)
        X_val = X_val[mask]
        y_val_raw = y_val_raw[mask]
        y_val = le.transform(y_val_raw)

        print(f"Evaluating on {len(y_val):,} samples...")

    # ── Kaggle Random Forest path ──
    elif rf_model_path.exists():
        print("\nUsing Kaggle Random Forest model")
        model_name = "Random Forest (Kaggle)"

        with open(rf_model_path, "rb") as f:
            clf = pickle.load(f)
        with open(rf_features, "r") as f:
            features = json.load(f)
        with open(rf_classes, "r") as f:
            classes = json.load(f)

        dataset_path = BACKEND_DIR / "data" / "symptom_disease_dataset.csv"
        if not dataset_path.exists():
            print("Dataset not found — skipping ML evaluation")
            return None

        df = pd.read_csv(dataset_path)
        df = df.loc[:, ~df.columns.str.contains("^Unnamed")]
        df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
        feature_cols = [c for c in df.columns if c != "prognosis"]
        X = df[feature_cols].fillna(0).values.astype(np.float32)
        y_raw = df["prognosis"].values

        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import LabelEncoder
        _, X_val, _, y_val_raw = train_test_split(
            X, y_raw, test_size=0.2, random_state=42, stratify=y_raw
        )
        le = LabelEncoder()
        le.fit(classes)
        y_val = le.transform(y_val_raw)
        print(f"Evaluating on {len(y_val):,} samples...")

    else:
        print("No trained model found. Run python models/triage_model.py first.")
        return None

    # ── Compute metrics ──
    y_pred = clf.predict(X_val)
    y_proba = clf.predict_proba(X_val)

    acc = accuracy_score(y_val, y_pred)

    # Top-3 accuracy
    top3_correct = sum(
        1 for true, probs in zip(y_val, y_proba)
        if true in np.argsort(probs)[::-1][:3]
    )
    top3_acc = top3_correct / len(y_val)

    # Per-class metrics
    prec_macro = precision_score(y_val, y_pred, average="macro",
                                 zero_division=0)
    rec_macro  = recall_score(y_val, y_pred, average="macro",
                              zero_division=0)
    f1_macro   = f1_score(y_val, y_pred, average="macro",
                          zero_division=0)
    prec_weighted = precision_score(y_val, y_pred, average="weighted",
                                    zero_division=0)
    rec_weighted  = recall_score(y_val, y_pred, average="weighted",
                                 zero_division=0)
    f1_weighted   = f1_score(y_val, y_pred, average="weighted",
                             zero_division=0)

    print(f"\n{'─'*40}")
    print(f"  Model              : {model_name}")
    print(f"  Validation samples : {len(y_val):,}")
    print(f"  Disease classes    : {len(classes)}")
    print(f"  Feature dimensions : {len(features)}")
    print(f"{'─'*40}")
    print(f"  Top-1 Accuracy     : {acc*100:.2f}%")
    print(f"  Top-3 Accuracy     : {top3_acc*100:.2f}%")
    print(f"{'─'*40}")
    print(f"  Precision (macro)  : {prec_macro*100:.2f}%")
    print(f"  Recall    (macro)  : {rec_macro*100:.2f}%")
    print(f"  F1        (macro)  : {f1_macro*100:.2f}%")
    print(f"{'─'*40}")
    print(f"  Precision (weighted): {prec_weighted*100:.2f}%")
    print(f"  Recall    (weighted): {rec_weighted*100:.2f}%")
    print(f"  F1        (weighted): {f1_weighted*100:.2f}%")
    print(f"{'─'*40}")

    # Full classification report
    print("\nPer-class Report (top 15 by support):")
    report = classification_report(
        y_val, y_pred,
        target_names=classes,
        output_dict=True,
        zero_division=0
    )

    # Sort by support descending
    per_class = {
        k: v for k, v in report.items()
        if k not in ("accuracy", "macro avg", "weighted avg")
        and isinstance(v, dict)
    }
    sorted_classes = sorted(
        per_class.items(),
        key=lambda x: x[1].get("support", 0),
        reverse=True
    )[:15]

    print(f"  {'Disease':<35} {'Prec':>6} {'Rec':>6} {'F1':>6} {'Supp':>6}")
    print(f"  {'─'*35} {'─'*6} {'─'*6} {'─'*6} {'─'*6}")
    for cls_name, metrics in sorted_classes:
        print(f"  {cls_name:<35} "
              f"{metrics['precision']*100:>5.1f}% "
              f"{metrics['recall']*100:>5.1f}% "
              f"{metrics['f1-score']*100:>5.1f}% "
              f"{int(metrics['support']):>6}")

    # ── Confusion Matrix ──
    print("\nGenerating confusion matrix...")
    cm = confusion_matrix(y_val, y_pred)

    # Use top 15 most frequent classes for readability
    top15_idx = np.argsort(np.sum(cm, axis=1))[::-1][:15]
    cm_top15 = cm[np.ix_(top15_idx, top15_idx)]
    top15_labels = [classes[i] for i in top15_idx]
    # Shorten labels
    short_labels = [l[:20] for l in top15_labels]

    fig, ax = plt.subplots(figsize=(14, 11))
    sns.heatmap(
        cm_top15,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=short_labels,
        yticklabels=short_labels,
        ax=ax,
        linewidths=0.5,
    )
    ax.set_xlabel("Predicted Disease", fontsize=12)
    ax.set_ylabel("True Disease", fontsize=12)
    ax.set_title(
        f"Confusion Matrix — {model_name}\n"
        f"(Top 15 diseases by frequency, Accuracy={acc*100:.1f}%)",
        fontsize=13, pad=15
    )
    plt.xticks(rotation=45, ha="right", fontsize=9)
    plt.yticks(rotation=0, fontsize=9)
    plt.tight_layout()
    plt.savefig(str(MATRIX_PATH), dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Confusion matrix saved → {MATRIX_PATH}")

    return {
        "model": model_name,
        "validation_samples": len(y_val),
        "disease_classes": len(classes),
        "feature_dimensions": len(features),
        "top1_accuracy": round(acc, 4),
        "top3_accuracy": round(top3_acc, 4),
        "precision_macro": round(prec_macro, 4),
        "recall_macro": round(rec_macro, 4),
        "f1_macro": round(f1_macro, 4),
        "precision_weighted": round(prec_weighted, 4),
        "recall_weighted": round(rec_weighted, 4),
        "f1_weighted": round(f1_weighted, 4),
        "per_class_report": {
            k: {
                "precision": round(v["precision"], 3),
                "recall": round(v["recall"], 3),
                "f1": round(v["f1-score"], 3),
                "support": int(v["support"])
            }
            for k, v in per_class.items()
        }
    }


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — RAG Pipeline Evaluation
# ══════════════════════════════════════════════════════════════════════════════

def evaluate_rag_pipeline():
    """Run all 20 test cases through the /evaluate endpoint."""
    print("\n" + "═" * 60)
    print("SECTION 2 — RAG Pipeline Evaluation (20 test cases)")
    print("═" * 60)

    # Check server is running
    try:
        r = requests.get(f"{API_BASE}/health", timeout=5)
        if r.status_code != 200:
            raise Exception("Server not healthy")
    except Exception:
        print("\n⚠️  Backend server not running!")
        print("Start it with: uvicorn app.main:app --reload --port 8000")
        return None

    results = []
    rag_scores = []
    no_rag_scores = []
    improvements = []

    print(f"\n  Running {len(TEST_CASES)} test cases...\n")

    for symptoms, expected_triage, expected_emergency, label in TEST_CASES:
        try:
            r = requests.post(
                f"{API_BASE}/evaluate",
                json={"symptoms": symptoms},
                timeout=60
            )
            if r.status_code != 200:
                print(f"  ✗ {label}: HTTP {r.status_code}")
                continue

            data = r.json()["data"]
            rag_score   = data["with_rag"]["scores"]["overall_score"]
            no_rag_score = data["without_rag"]["scores"]["overall_score"]
            improvement  = data["comparison"]["rag_improvement"]

            rag_scores.append(rag_score)
            no_rag_scores.append(no_rag_score)
            improvements.append(improvement)

            sign = "+" if improvement > 0 else ""
            print(f"  ✓ {label:<25} "
                  f"RAG={rag_score*100:.0f}%  "
                  f"No-RAG={no_rag_score*100:.0f}%  "
                  f"Δ={sign}{improvement*100:.0f}%")

            results.append({
                "label": label,
                "symptoms": symptoms,
                "rag_score": round(rag_score, 3),
                "no_rag_score": round(no_rag_score, 3),
                "improvement": round(improvement, 3),
            })

            time.sleep(0.5)  # avoid rate limiting

        except Exception as e:
            print(f"  ✗ {label}: {e}")

    if not rag_scores:
        return None

    avg_rag     = np.mean(rag_scores)
    avg_no_rag  = np.mean(no_rag_scores)
    avg_improve = np.mean(improvements)
    pct_rag_wins = sum(1 for i in improvements if i > 0) / len(improvements)

    print(f"\n  {'─'*50}")
    print(f"  Cases evaluated      : {len(rag_scores)}/{len(TEST_CASES)}")
    print(f"  Avg RAG score        : {avg_rag*100:.1f}%")
    print(f"  Avg No-RAG score     : {avg_no_rag*100:.1f}%")
    print(f"  Avg improvement      : +{avg_improve*100:.1f}%")
    print(f"  RAG wins             : {pct_rag_wins*100:.0f}% of cases")
    print(f"  {'─'*50}")

    return {
        "cases_evaluated": len(rag_scores),
        "avg_rag_score": round(avg_rag, 4),
        "avg_no_rag_score": round(avg_no_rag, 4),
        "avg_improvement": round(avg_improve, 4),
        "rag_wins_pct": round(pct_rag_wins, 4),
        "per_case": results,
    }


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — Emergency Detection & Triage Accuracy
# ══════════════════════════════════════════════════════════════════════════════

def evaluate_pipeline_accuracy():
    """Test emergency detection and triage accuracy via /analyze endpoint."""
    print("\n" + "═" * 60)
    print("SECTION 3 — Emergency Detection & Triage Accuracy")
    print("═" * 60)

    try:
        requests.get(f"{API_BASE}/health", timeout=5)
    except Exception:
        print("\n⚠️  Backend server not running — skipping section 3")
        return None

    emergency_correct = 0
    triage_correct    = 0
    triage_within_1   = 0
    citation_scores   = []
    total             = 0

    print(f"\n  {'Label':<25} {'Emerg':>6} {'Triage':>7} {'Conf':>6}")
    print(f"  {'─'*25} {'─'*6} {'─'*7} {'─'*6}")

    for symptoms, expected_triage, expected_emergency, label in TEST_CASES:
        try:
            r = requests.post(
                f"{API_BASE}/analyze",
                json={"symptoms": symptoms},
                timeout=60
            )
            if r.status_code != 200:
                continue

            data = r.json()["data"]
            total += 1

            # Emergency detection
            got_emergency = bool(data.get("emergency_alert", False))
            emerg_ok = got_emergency == expected_emergency
            if emerg_ok:
                emergency_correct += 1
            emerg_str = "✓" if emerg_ok else "✗"

            # Triage level
            got_triage = data.get("triage", {}).get("level", 0)
            triage_ok = got_triage == expected_triage
            triage_close = abs(got_triage - expected_triage) <= 1
            if triage_ok:
                triage_correct += 1
            if triage_close:
                triage_within_1 += 1
            triage_str = f"✓ {got_triage}" if triage_ok else f"✗ {got_triage}(exp {expected_triage})"

            # Citations
            citations = data.get("citations", [])
            if citations:
                avg_conf = np.mean([c.get("relevance_score", 0) for c in citations])
                citation_scores.append(avg_conf)
                conf_str = f"{avg_conf*100:.0f}%"
            else:
                conf_str = "n/a"

            print(f"  {label:<25} {emerg_str:>6} {triage_str:>7} {conf_str:>6}")
            time.sleep(0.3)

        except Exception as e:
            print(f"  ✗ {label}: {e}")

    if total == 0:
        return None

    emerg_acc   = emergency_correct / total
    triage_acc  = triage_correct / total
    triage_acc1 = triage_within_1 / total
    avg_conf    = np.mean(citation_scores) if citation_scores else 0

    print(f"\n  {'─'*50}")
    print(f"  Cases evaluated        : {total}")
    print(f"  Emergency accuracy     : {emerg_acc*100:.1f}%  ({emergency_correct}/{total})")
    print(f"  Triage exact accuracy  : {triage_acc*100:.1f}%  ({triage_correct}/{total})")
    print(f"  Triage ±1 accuracy     : {triage_acc1*100:.1f}%  ({triage_within_1}/{total})")
    print(f"  Avg citation confidence: {avg_conf*100:.1f}%")
    print(f"  {'─'*50}")

    return {
        "total_cases": total,
        "emergency_accuracy": round(emerg_acc, 4),
        "triage_exact_accuracy": round(triage_acc, 4),
        "triage_within_1_accuracy": round(triage_acc1, 4),
        "avg_citation_confidence": round(avg_conf, 4),
    }


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("\n" + "╔" + "═"*58 + "╗")
    print("║" + "  SymptoTrackAI — Full Evaluation Suite".center(58) + "║")
    print("║" + f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}".center(58) + "║")
    print("╚" + "═"*58 + "╝")

    report = {
        "timestamp": datetime.now().isoformat(),
        "sections": {}
    }

    # Section 1 — ML
    ml_results = evaluate_ml_classifier()
    if ml_results:
        report["sections"]["ml_classifier"] = ml_results

    # Section 2 — RAG
    rag_results = evaluate_rag_pipeline()
    if rag_results:
        report["sections"]["rag_pipeline"] = rag_results

    # Section 3 — Pipeline
    pipeline_results = evaluate_pipeline_accuracy()
    if pipeline_results:
        report["sections"]["pipeline_accuracy"] = pipeline_results

    # ── Final summary ──
    print("\n" + "═" * 60)
    print("FINAL SUMMARY")
    print("═" * 60)

    if ml_results:
        print(f"\n  ML Classifier ({ml_results['model']})")
        print(f"    Top-1 Accuracy  : {ml_results['top1_accuracy']*100:.2f}%")
        print(f"    Top-3 Accuracy  : {ml_results['top3_accuracy']*100:.2f}%")
        print(f"    F1 (weighted)   : {ml_results['f1_weighted']*100:.2f}%")
        print(f"    Precision       : {ml_results['precision_weighted']*100:.2f}%")
        print(f"    Recall          : {ml_results['recall_weighted']*100:.2f}%")

    if rag_results:
        print(f"\n  RAG Pipeline")
        print(f"    Avg RAG score   : {rag_results['avg_rag_score']*100:.1f}%")
        print(f"    Avg No-RAG score: {rag_results['avg_no_rag_score']*100:.1f}%")
        print(f"    Avg improvement : +{rag_results['avg_improvement']*100:.1f}%")
        print(f"    RAG wins        : {rag_results['rag_wins_pct']*100:.0f}% of cases")

    if pipeline_results:
        print(f"\n  Pipeline Accuracy")
        print(f"    Emergency detect: {pipeline_results['emergency_accuracy']*100:.1f}%")
        print(f"    Triage exact    : {pipeline_results['triage_exact_accuracy']*100:.1f}%")
        print(f"    Triage ±1       : {pipeline_results['triage_within_1_accuracy']*100:.1f}%")
        print(f"    Avg citation    : {pipeline_results['avg_citation_confidence']*100:.1f}%")

    # Save report
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n  Report saved → {REPORT_PATH}")
    if MATRIX_PATH.exists():
        print(f"  Matrix saved → {MATRIX_PATH}")

    print("\n" + "═" * 60)
    print("  Evaluation complete.")
    print("═" * 60 + "\n")


if __name__ == "__main__":
    main()