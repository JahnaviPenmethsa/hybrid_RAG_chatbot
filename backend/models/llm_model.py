import os
import requests
import google.generativeai as genai


class LLMModel:

    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")

        print("Loaded GROQ KEY:", self.groq_key)
        print("Loaded GEMINI KEY:", self.gemini_key)

        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)

    # GROQ
    def call_groq(self, prompt):
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"

            headers = {
                "Authorization": f"Bearer {self.groq_key}",
                "Content-Type": "application/json"
            }

            data = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }

            response = requests.post(url, json=data, headers=headers)

            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content']
            else:
                print("Groq Error:", response.text)
                return None

        except Exception as e:
            print("Groq Exception:", e)
            return None

    # GEMINI
    def call_gemini(self, prompt):
        try:
            model = genai.GenerativeModel("gemini-flash-latest")

            response = model.generate_content(prompt)

            return response.text

        except Exception as e:
            print("Gemini Exception:", e)
            return None
