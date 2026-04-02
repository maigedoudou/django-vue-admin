import time

import requests
from django.conf import settings
from rest_framework.views import APIView

from dvadmin.utils.json_response import DetailResponse, ErrorResponse


class AIChatView(APIView):
    """Minimal local-AI chat endpoint backed by Ollama."""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        message = (request.data.get("message") or "").strip()
        if not message:
            return ErrorResponse(msg="message is required", code=4000)

        base_url = getattr(settings, "AI_OLLAMA_BASE_URL", "http://host.docker.internal:11434").rstrip("/")
        model = (request.data.get("model") or getattr(settings, "AI_OLLAMA_MODEL", "qwen2.5:1.5b")).strip()
        timeout = int(getattr(settings, "AI_OLLAMA_TIMEOUT", 60))
        temperature = request.data.get("temperature")
        num_predict = int(getattr(settings, "AI_OLLAMA_NUM_PREDICT", 160))
        num_ctx = int(getattr(settings, "AI_OLLAMA_NUM_CTX", 1024))

        if not model:
            return ErrorResponse(msg="model is required", code=4000)

        if temperature is not None:
            try:
                temperature = float(temperature)
            except (TypeError, ValueError):
                return ErrorResponse(msg="temperature must be a number between 0 and 1", code=4000)
            if temperature < 0 or temperature > 1:
                return ErrorResponse(msg="temperature must be between 0 and 1", code=4000)

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an assistant for the django-vue-admin management system. Keep answers concise and practical.",
                },
                {"role": "user", "content": message},
            ],
            "stream": False,
            "options": {
                "num_predict": num_predict,
                "num_ctx": num_ctx,
            },
        }
        if temperature is not None:
            payload["options"]["temperature"] = temperature

        start_time = time.time()
        try:
            response = requests.post(f"{base_url}/api/chat", json=payload, timeout=timeout)
            response.raise_for_status()
            result = response.json()
        except requests.RequestException as exc:
            return ErrorResponse(
                msg="Failed to call local Ollama service",
                code=4000,
                data={"error": str(exc), "base_url": base_url},
            )
        elapsed_ms = int((time.time() - start_time) * 1000)

        reply = ((result.get("message") or {}).get("content") or "").strip()
        if not reply:
            return ErrorResponse(msg="Empty response from Ollama", code=4000, data=result)

        return DetailResponse(
            data={
                "reply": reply,
                "used_model": result.get("model", model),
                "elapsed_ms": elapsed_ms,
            }
        )
