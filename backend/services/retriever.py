"""
retriever.py
------------
Loads the pre-built FAISS index and retrieves the top-K most
relevant document chunks for a given symptom query.
"""

import json
import os
import numpy as np
from typing import List, Dict

import faiss
from sentence_transformers import SentenceTransformer

from app.config import (
    FAISS_INDEX_PATH,
    CHUNKS_METADATA_PATH,
    EMBEDDING_MODEL_NAME,
    TOP_K_DOCS,
)

# ---------------------------------------------------------------------------
# Lazy singleton — load once, reuse across requests
# ---------------------------------------------------------------------------
_index = None
_metadata: List[Dict] = []
_model: SentenceTransformer = None


def _load_resources():
    global _index, _metadata, _model

    if _model is None:
        print(f"[Retriever] Loading embedding model: {EMBEDDING_MODEL_NAME}")
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    if _index is None:
        if not os.path.exists(FAISS_INDEX_PATH):
            raise FileNotFoundError(
                f"FAISS index not found at {FAISS_INDEX_PATH}. "
                "Run scripts/build_faiss_index.py first."
            )
        print(f"[Retriever] Loading FAISS index from: {FAISS_INDEX_PATH}")
        _index = faiss.read_index(FAISS_INDEX_PATH)

        with open(CHUNKS_METADATA_PATH, "r", encoding="utf-8") as f:
            _metadata = json.load(f)

        print(f"[Retriever] Index loaded — {_index.ntotal} vectors.")


def retrieve_documents(query: str, top_k: int = TOP_K_DOCS) -> List[Dict]:
    """
    Retrieve top-K relevant chunks from the knowledge base.

    Args:
        query: Cleaned symptom text.
        top_k: Number of results to return.

    Returns:
        List of dicts with keys: source, chunk_index, text, score.
    """
    _load_resources()

    # Encode and normalize
    query_vec = _model.encode([query], convert_to_numpy=True).astype(np.float32)
    faiss.normalize_L2(query_vec)

    scores, indices = _index.search(query_vec, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        entry = dict(_metadata[idx])
        entry["score"] = float(score)
        results.append(entry)

    return results


# ------- Quick self-test -------
if __name__ == "__main__":
    query = "fever headache cough for 2 days"
    print(f"Query: {query}\n")
    try:
        docs = retrieve_documents(query)
        for i, doc in enumerate(docs, 1):
            print(f"--- Result {i} (score={doc['score']:.4f}) ---")
            print(f"Source: {doc['source']}")
            print(f"Text  : {doc['text'][:300]}...\n")
    except FileNotFoundError as e:
        print(f"[ERROR] {e}")