import os
from groq import Groq

_client = None



def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client



FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]

def chat(system_prompt: str, user_message: str, model: str = "llama-3.3-70b-versatile") -> str:
    models = [model] + [m for m in FALLBACK_MODELS if m != model]
    last_error = None
    for m in models:
        try:
            response = get_client().chat.completions.create(
                model=m,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                max_tokens=1024,
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception as e:
            last_error = e
            continue
    raise last_error
