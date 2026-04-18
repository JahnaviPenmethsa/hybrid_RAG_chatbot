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
    symptoms_lower = symptoms.lower()  # check symptoms, not docs
    combined_text = " ".join(retrieved_docs).lower()  # only use for risk level

    possible_causes = []
    if any(w in symptoms_lower for w in ["stress", "anxiety", "pressure", "tension"]):
        possible_causes.append("Stress or anxiety")
    if any(w in symptoms_lower for w in ["fever", "temperature", "chills"]):
        possible_causes.append("Viral or bacterial infection")
    if any(w in symptoms_lower for w in ["headache", "head", "migraine"]):
        possible_causes.append("Tension headache or migraine")
    if any(w in symptoms_lower for w in ["cough", "cold", "throat"]):
        possible_causes.append("Respiratory infection")
    if any(w in symptoms_lower for w in ["stomach", "nausea", "vomit", "diarrhea"]):
        possible_causes.append("Gastrointestinal issue")
    if any(w in symptoms_lower for w in ["chest", "heart", "breathing"]):
        possible_causes.append("Cardiac or respiratory concern")
    if any(w in symptoms_lower for w in ["joint", "muscle", "body", "pain", "ache"]):
        possible_causes.append("Musculoskeletal issue")

    if not possible_causes:
        possible_causes = ["General discomfort — further assessment needed"]

    # Risk from symptoms, not docs
    if any(w in symptoms_lower for w in ["severe", "extreme", "chest pain", "can't breathe"]):
        risk = "high"
    elif any(w in symptoms_lower for w in ["persistent", "days", "weeks", "worsening"]):
        risk = "medium"
    else:
        risk = "low"

    steps = [
        "Stay hydrated and get adequate rest",
        "Monitor your symptoms regularly",
        "Avoid self-medicating without professional advice"
    ]
    if risk == "high":
        steps.append("⚠️ Seek immediate medical attention")

    # Return as formatted STRING not dict
    causes_text = "\n".join(f"- {c}" for c in set(possible_causes))
    steps_text = "\n".join(f"- {s}" for s in steps)

    return f"""**Possible Causes:**
{causes_text}

**Risk Level:** {risk.upper()}

**Recommended Next Steps:**
{steps_text}

*Note: This is a rule-based assessment. Please consult a qualified healthcare professional for accurate diagnosis.*"""