"""
build_faiss_index.py
--------------------
Reads all .txt files from data/knowledge_base/processed/,
chunks them, encodes with Sentence Transformers, and saves
a FAISS index + metadata file.

Run from project root:
    python scripts/build_faiss_index.py
"""

import os
import sys
import json
import numpy as np

# Allow imports from backend/app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import faiss
from sentence_transformers import SentenceTransformer

# ---- Config (inline so script is self-contained) ----
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

KNOWLEDGE_BASE_DIR = os.path.join(
    BASE_DIR, "data", "knowledge_base"
)

FAISS_INDEX_PATH = os.path.join(
    BASE_DIR, "vector_db", "faiss_index.faiss"
)

CHUNKS_METADATA_PATH = os.path.join(
    BASE_DIR, "vector_db", "chunks_metadata.json"
)
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
CHUNK_SIZE = 300       # words per chunk
CHUNK_OVERLAP = 50     # word overlap between chunks


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP):
    """Split text into overlapping word-based chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def load_documents(directory: str):
    """Load all .txt files from directory. Returns list of (filename, content)."""
    docs = []
    if not os.path.exists(directory):
        print(f"[WARNING] Knowledge base directory not found: {directory}")
        return docs
    for fname in os.listdir(directory):
        if fname.endswith(".txt"):
            fpath = os.path.join(directory, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read().strip()
            if content:
                docs.append((fname, content))
    return docs


def build_index():
    print(f"[1/5] Loading documents from: {KNOWLEDGE_BASE_DIR}")
    docs = load_documents(KNOWLEDGE_BASE_DIR)
    if not docs:
        print("[ERROR] No documents found. Add .txt files to the knowledge base first.")
        sys.exit(1)
    print(f"       Found {len(docs)} document(s).")

    print("[2/5] Chunking documents...")
    all_chunks = []       # list of str
    all_metadata = []     # list of dict

    for fname, content in docs:
        chunks = chunk_text(content)
        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_metadata.append({
                "source": fname,
                "chunk_index": i,
                "text": chunk
            })

    print(f"       Total chunks: {len(all_chunks)}")

    print(f"[3/5] Loading embedding model: {EMBEDDING_MODEL_NAME}")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    print("[4/5] Encoding chunks (this may take a moment)...")
    embeddings = model.encode(all_chunks, show_progress_bar=True, convert_to_numpy=True)
    embeddings = embeddings.astype(np.float32)

    # Normalize for cosine similarity via inner product
    faiss.normalize_L2(embeddings)

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)   # Inner product = cosine after L2 norm
    index.add(embeddings)

    print("[5/5] Saving FAISS index and metadata...")
    os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
    faiss.write_index(index, FAISS_INDEX_PATH)

    with open(CHUNKS_METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(all_metadata, f, indent=2)

    print(f"\n✅ Done!")
    print(f"   Index  : {FAISS_INDEX_PATH}")
    print(f"   Metadata: {CHUNKS_METADATA_PATH}")
    print(f"   Vectors : {index.ntotal}")


if __name__ == "__main__":
    build_index()