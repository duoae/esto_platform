import os
import re
from typing import List, Dict, Optional
import uvicorn
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
API_SECRET_KEY = os.getenv("API_SECRET_KEY")

client = Groq(api_key=GROQ_API_KEY)
ACTIVE_MODEL = "qwen/qwen3.6-27b"

app = FastAPI(title="ESTO Visitor AI Chatbot")

class ChatRequest(BaseModel):
    query: str
    context: str = ""
    history: Optional[List[Dict[str, str]]] = []

@app.post("/chat")
async def chat_endpoint(request: ChatRequest, x_api_key: str = Header(None)):
    if API_SECRET_KEY and x_api_key != API_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Non autorisé")

    clean_query = request.query.strip().lower()
    
    greetings = ["bonjour", "salut", "salam", "bonsoir", "coucou", "sbah lkhir", "salam alaykoum", "hello", "hi"]
    if clean_query in greetings or clean_query.rstrip("!?. ") in greetings:
        return {"reply": "Bonjour ! Comment puis-je vous aider ?"}

    system_prompt = f"""Tu es l'assistant virtuel officiel de la plateforme ESTO / CEDoc.

RÈGLES IMPORTANTES :
1. Ne commence pas ta réponse par "Bonjour" ou "Salut". Réponds directement à la question.
2. Pour les questions sur l'ESTO, utilise les informations ci-dessous. Les candidatures se font en ligne et le contact direct avec les enseignants est interdit aux candidats avant admission.
3. Pour les questions générales (écoles, orientation, etc.), donne une réponse exacte, claire et structurée avec des listes à puces.

INFORMATIONS DE LA PLATEFORME :
{request.context}
"""

    try:
        messages = [{"role": "system", "content": system_prompt}]
        
        if request.history:
            for h in request.history:
                if h.get("content"):
                    messages.append(h)
            
        messages.append({"role": "user", "content": request.query})

        chat_completion = client.chat.completions.create(
            messages=messages,
            model=ACTIVE_MODEL,
            temperature=0.2,
            max_tokens=2048,
        )

        reply = chat_completion.choices[0].message.content or ""

        # Remove complete <think>...</think> blocks
        reply = re.sub(r'<think>.*?</think>', '', reply, flags=re.DOTALL)
        # Remove any unclosed <think> block
        reply = re.sub(r'<think>.*', '', reply, flags=re.DOTALL)
        reply = reply.strip()

        reply = re.sub(r'^(bonjour|bonsoir|salut)[!,\.\s]*', '', reply, flags=re.IGNORECASE).strip()

        if not reply:
            reply = "Désolé, je n'ai pas pu générer une réponse. Veuillez reformuler votre question."

        return {"reply": reply}

    except Exception as e:
        error_msg = str(e)
        print(f"\n[ERREUR GROQ] : {error_msg}\n")
        
        if "429" in error_msg or "rate limit" in error_msg.lower():
            return {"reply": "Le service est temporairement surchargé. Veuillez patienter quelques secondes avant de réessayer."}
            
        return {"reply": "Désolé, une erreur de communication avec le serveur est survenue. Veuillez réessayer plus tard."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
