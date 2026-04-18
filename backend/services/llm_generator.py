from models.llm_model import LLMModel

# Initialize LLM
llm = LLMModel()


# 🔹 Build RAG Prompt
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


# 🔹 Main Response Generator (Multi-LLM + ML Fallback)
def generate_response(symptoms, retrieved_docs):

    prompt = build_prompt(symptoms, retrieved_docs)

    print("🔄 Trying GROQ...")

    # 1️⃣ Try GROQ
    response = llm.call_groq(prompt)
    if response and len(response.strip()) > 0:
        print("✅ Using GROQ")
        return response

    print("⚠️ GROQ failed, trying GEMINI...")

    # 2️⃣ Try GEMINI
    response = llm.call_gemini(prompt)
    if response and len(response.strip()) > 0:
        print("✅ Using GEMINI")
        return response

    print("❌ Both LLMs failed, using ML fallback...")

    # 3️⃣ ML-style fallback
    return fallback_response(symptoms, retrieved_docs)


# 🔹 Intelligent ML-style fallback (NO STATIC MESSAGE)
def fallback_response(symptoms, retrieved_docs):

    if not retrieved_docs:
        return {
            "possible_causes": ["Insufficient data"],
            "risk_level": "unknown",
            "next_steps": ["Consult a healthcare professional"]
        }

    combined_text = " ".join(retrieved_docs).lower()

    possible_causes = []

    # 🔹 Cause detection (rule-based intelligence)
    if "viral" in combined_text:
        possible_causes.append("Viral infection")

    if "bacterial" in combined_text:
        possible_causes.append("Bacterial infection")

    if "dengue" in combined_text:
        possible_causes.append("Dengue fever")

    if "influenza" in combined_text or "flu" in combined_text:
        possible_causes.append("Influenza (Flu)")

    if "infection" in combined_text:
        possible_causes.append("General infection")

    # 🔹 Risk estimation
    if "high fever" in combined_text or "severe" in combined_text:
        risk = "high"
    elif "persistent" in combined_text:
        risk = "medium"
    else:
        risk = "low"

    # 🔹 Recommendations
    steps = [
        "Stay hydrated",
        "Take adequate rest",
        "Monitor symptoms regularly"
    ]

    if risk == "high":
        steps.append("Seek immediate medical attention")

    return {
        "possible_causes": list(set(possible_causes)),
        "risk_level": risk,
        "next_steps": steps
    }
