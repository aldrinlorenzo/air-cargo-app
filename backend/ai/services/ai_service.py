import os
import json
import re

from ..core.gemini import genai
from .prompt_builder import PromptBuilder
from .prompts import SYSTEM_PROMPT
from .embeddings import get_embedding
from .cache import search_cache, store_cache
from .intent_normalizer import normalize_intent


model = genai.GenerativeModel("gemini-2.5-flash")
builder = PromptBuilder(SYSTEM_PROMPT)


def extract_json(text: str):
    match = re.search(r"\{.*\}", text, re.DOTALL)

    if not match:
        return {
            "status": "error",
            "message": "No JSON returned"
        }

    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return {
            "status": "error",
            "message": "Invalid JSON",
            "raw_output": text
        }

def run_ai(user_text: str, context: str = None):
    intent = normalize_intent(user_text)

    normalized_input = f"{intent}:{user_text.strip().lower()}"

    # Try embedding + cache, but don't let failures block the AI response
    embedding = None
    try:
        embedding = get_embedding(normalized_input)

        # Skip cache when context data is provided (responses are shipment-specific)
        if not context and embedding is not None:
            cached = search_cache(embedding)
            if cached:
                return {
                    "cached": True,
                    "data": cached
                }
    except Exception as e:
        print(f"[WARN] Embedding/cache lookup failed (non-fatal): {e}")

    prompt = builder.build(user_text, context=context)

    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2
            }
        )

        result = extract_json(response.text)
    except Exception as e:
        print(f"[ERROR] Gemini generate_content failed: {e}")
        return {
            "cached": False,
            "data": {
                "status": "error",
                "answer": f"I'm having trouble connecting to the AI service. Please try again later. (Error: {str(e)[:100]})"
            }
        }

    # Only cache non-context responses when embedding succeeded
    if not context and embedding is not None:
        try:
            store_cache(embedding, result)
        except Exception as e:
            print(f"[WARN] Cache store failed (non-fatal): {e}")

    return {
        "cached": False,
        "data": result
    }