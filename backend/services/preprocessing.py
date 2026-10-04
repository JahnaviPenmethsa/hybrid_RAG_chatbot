"""
preprocessing.py
----------------
Cleans and normalizes raw symptom text input.
Steps:
  1. Lowercase
  2. Remove punctuation / special characters
  3. Normalize whitespace
  4. (Optional) Simple stop-word strip
"""

import re
import string


STOP_WORDS = {
    "i", "me", "my", "am", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "a", "an", "the", "and", "or", "but", "in", "on", "at",
    "to", "for", "of", "with", "by", "from", "that", "this", "it",
    "feeling", "feel", "feels", "since", "about", "also", "some",
    "been", "very", "really", "kind", "having", "getting"
}


def lowercase(text: str) -> str:
    return text.lower()


def remove_punctuation(text: str) -> str:
    # Keep alphanumeric and spaces; remove everything else
    text = re.sub(r"[^\w\s]", " ", text)
    return text


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def remove_stop_words(text: str) -> str:
    tokens = text.split()
    filtered = [t for t in tokens if t not in STOP_WORDS]
    return " ".join(filtered)


def preprocess(text: str, remove_stops: bool = False) -> str:
    """
    Full preprocessing pipeline.
    Args:
        text: Raw symptom string from user.
        remove_stops: Whether to remove common stop words (default False
                      so that phrases like 'chest pain' remain intact).
    Returns:
        Cleaned string.
    """
    text = lowercase(text)
    text = remove_punctuation(text)
    text = normalize_whitespace(text)
    if remove_stops:
        text = remove_stop_words(text)
    return text


# Quick self-test
if __name__ == "__main__":
    samples = [
        "I've been having Fever and a bad Headache for 2 days!!!",
        "Chest pain, shortness of breath... feeling dizzy.",
        "Nausea & vomiting since yesterday. Also some fatigue.",
    ]
    for s in samples:
        print(f"Original : {s}")
        print(f"Processed: {preprocess(s)}\n")