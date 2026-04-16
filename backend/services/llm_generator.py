from models.llm_model import LLMModel

# Initialize LLM
llm = LLMModel()


# 🔹 Build RAG Prompt (Step 4A)
def build_prompt(symptoms, retrieved_docs):
    context = "\n".join(retrieved_docs)

    prompt = f"""
You are a medical AI assistant.

Patient symptoms:
{symptoms}

Relevant medical knowledge:
{context}

Instructions:
- Give possible causes
- Suggest next steps
- Mention risk level (low/medium/high)
- Do NOT hallucinate
- Use only the provided context

Answer:
"""
    return prompt


# 🔹 Main Response Generator (Step 3 + Step 4B)
def generate_response(symptoms, retrieved_docs):
    
    # Build RAG prompt
    prompt = build_prompt(symptoms, retrieved_docs)

    print("🔄 Trying GROQ...")

    # 1️⃣ Try GROQ
    response = llm.call_groq(prompt)
    if response:
        print("✅ Using GROQ")
        return response

    print("⚠️ GROQ failed, trying GEMINI...")

    # 2️⃣ Try GEMINI
    response = llm.call_gemini(prompt)
    if response:
        print("✅ Using GEMINI")
        return response

    print("❌ Both LLMs failed")

    # 3️⃣ Final fallback
    return fallback_response(symptoms)


# 🔹 Fallback (if all models fail)
def fallback_response(symptoms):
    return f"""
⚠️ Unable to generate AI response for: {symptoms}

Please consult a qualified healthcare professional.
"""
