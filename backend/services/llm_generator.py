"""
llm_generator.py
----------------
Generates a structured medical-guidance response using an open-source LLM
and the retrieved RAG context.

Default model: TinyLlama/TinyLlama-1.1B-Chat-v1.0  (CPU-friendly for 8GB RAM)
"""

from typing import List, Dict
from app.config import LLM_MODEL_NAME, MAX_NEW_TOKENS
import re
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

# ---------------------------------------------------------------------------
# Lazy singleton
# ---------------------------------------------------------------------------
_tokenizer = None
_model = None


def _load_model():
    global _tokenizer, _model

    if _model is None:
        print(f"[LLM] Loading model: {LLM_MODEL_NAME} (first call may be slow)")

        _tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL_NAME)

        _model = AutoModelForCausalLM.from_pretrained(
            LLM_MODEL_NAME,
            torch_dtype=torch.float32  # safer for CPU
        )

        _model.to("cpu")
        _model.eval()

        print("[LLM] Model ready.")

    return _tokenizer, _model


def _build_prompt(cleaned_symptoms: str, extracted: List[str], docs: List[Dict]) -> str:
    """
    Construct the RAG prompt to send to the LLM.
    """

    MAX_CHUNK_CHARS = 600

    context_blocks = []
    for doc in docs:
        raw_text = doc.get("text", "")[:MAX_CHUNK_CHARS]

        cleaned_text = re.sub(r"-{2,}.*?-{2,}", "", raw_text)
        cleaned_text = cleaned_text.replace("---", "")
        cleaned_text = re.sub(r"\s+", " ", cleaned_text).strip()

        context_blocks.append(cleaned_text)

    context = "\n\n".join(context_blocks) if context_blocks else "No relevant documents found."

    prompt = f"""
You are a professional medical assistant.

Patient symptoms:
{cleaned_symptoms}

Medical reference information:
{context}

Using only the information above, write a clear and complete medical guidance response in paragraph form.

Include:
- possible causes
- common symptoms
- self-care advice
- when to seek medical attention

Be thorough and informative.
Do not copy text verbatim.
Answer:
"""

    return prompt


def generate_response(cleaned_symptoms: str, extracted: List[str], docs: List[Dict]) -> str:
    """
    Run the LLM over the prompt and return raw generated text.
    """
    tokenizer, model = _load_model()
    prompt = _build_prompt(cleaned_symptoms, extracted, docs)

    inputs = tokenizer(prompt, return_tensors="pt")

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=150,   # reduced for 8GB stability
            temperature=0.3,
            do_sample=True,
        )

    generated = tokenizer.decode(outputs[0], skip_special_tokens=True)

    answer = generated[len(prompt):]

    return answer.strip()


# ------- Quick self-test -------
if __name__ == "__main__":
    fake_docs = [
        {
            "source": "who_fever_guidelines.txt",
            "text": (
                "Fever is defined as body temperature above 38°C (100.4°F). "
                "Common causes include viral infections such as influenza and COVID-19. "
                "Management includes rest, hydration, and antipyretics like paracetamol. "
                "Seek medical attention if fever exceeds 39.5°C or lasts more than 3 days."
            ),
            "score": 0.91,
        }
    ]

    result = generate_response(
        "fever headache for 2 days",
        ["fever", "headache"],
        fake_docs,
    )

    print(result)