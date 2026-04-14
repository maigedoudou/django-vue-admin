import time
from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView

from dvadmin.utils.json_response import DetailResponse, ErrorResponse

# ---------------------------------------------------------------------------
# Agent tools — each function queries real DB data and returns a plain dict
# ---------------------------------------------------------------------------

def _query_user_stats():
    from dvadmin.system.models import Users
    now = timezone.now()
    total = Users.objects.count()
    active = Users.objects.filter(is_active=True).count()
    new_7d = Users.objects.filter(create_datetime__gte=now - timedelta(days=7)).count()
    new_30d = Users.objects.filter(create_datetime__gte=now - timedelta(days=30)).count()
    return {
        "total_users": total,
        "active_users": active,
        "disabled_users": total - active,
        "new_users_last_7_days": new_7d,
        "new_users_last_30_days": new_30d,
    }


def _query_login_stats():
    from dvadmin.system.models import LoginLog
    now = timezone.now()
    total = LoginLog.objects.count()
    last_7d = LoginLog.objects.filter(create_datetime__gte=now - timedelta(days=7)).count()
    # Top 5 most active users in last 7 days
    from django.db.models import Count
    top_users = (
        LoginLog.objects.filter(create_datetime__gte=now - timedelta(days=7))
        .values("username")
        .annotate(cnt=Count("id"))
        .order_by("-cnt")[:5]
    )
    return {
        "total_logins": total,
        "logins_last_7_days": last_7d,
        "top_active_users_last_7_days": [
            {"username": r["username"], "login_count": r["cnt"]} for r in top_users
        ],
    }


def _query_dept_stats():
    from dvadmin.system.models import Dept
    total = Dept.objects.count()
    depts = list(Dept.objects.values("name", "owner", "status").order_by("sort")[:20])
    return {
        "total_departments": total,
        "departments": [
            {"name": d["name"], "owner": d["owner"] or "—", "status": "启用" if d["status"] else "禁用"}
            for d in depts
        ],
    }


def _query_role_stats():
    from dvadmin.system.models import Role
    total = Role.objects.count()
    roles = list(Role.objects.values("name", "key", "status").order_by("sort")[:20])
    return {
        "total_roles": total,
        "roles": [
            {"name": r["name"], "key": r["key"], "status": "启用" if r["status"] else "禁用"}
            for r in roles
        ],
    }


# Tool registry: keyword triggers → handler
_TOOLS = [
    {
        "name": "get_user_stats",
        "description": "用户统计：总数、活跃数、新增数",
        "keywords": ["用户", "账号", "注册", "人数", "多少人", "用户数", "新增用户"],
        "func": _query_user_stats,
    },
    {
        "name": "get_login_stats",
        "description": "登录统计：总登录次数、最近7天、活跃用户",
        "keywords": ["登录", "登陆", "上线", "活跃", "login"],
        "func": _query_login_stats,
    },
    {
        "name": "get_dept_stats",
        "description": "部门统计：部门列表、数量",
        "keywords": ["部门", "组织", "dept"],
        "func": _query_dept_stats,
    },
    {
        "name": "get_role_stats",
        "description": "角色统计：角色列表、数量",
        "keywords": ["角色", "权限", "role"],
        "func": _query_role_stats,
    },
]


def _detect_tools(message: str) -> list:
    """Return list of tool names whose keywords match the message."""
    msg_lower = message.lower()
    matched = []
    for tool in _TOOLS:
        if any(kw in msg_lower for kw in tool["keywords"]):
            matched.append(tool)
    return matched


def _run_tools(tools: list) -> dict:
    """Execute matched tools and return combined data dict."""
    data = {}
    for tool in tools:
        try:
            data[tool["name"]] = tool["func"]()
        except Exception as exc:
            data[tool["name"]] = {"error": str(exc)}
    return data


# ---------------------------------------------------------------------------
# View
# ---------------------------------------------------------------------------

class AIChatView(APIView):
    """AI Agent chat endpoint: detects intent, queries real DB data, answers."""

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
        lang = (request.data.get("lang") or "auto").strip()

        if not model:
            return ErrorResponse(msg="model is required", code=4000)

        if temperature is not None:
            try:
                temperature = float(temperature)
            except (TypeError, ValueError):
                return ErrorResponse(msg="temperature must be a number between 0 and 1", code=4000)
            if temperature < 0 or temperature > 1:
                return ErrorResponse(msg="temperature must be between 0 and 1", code=4000)

        # --- Agent step: detect intent and fetch real data ---
        matched_tools = _detect_tools(message)
        tool_data = _run_tools(matched_tools) if matched_tools else {}
        tool_names = [t["name"] for t in matched_tools]

        # Build system prompt, injecting real data if available
        _lang_instructions = {
            "en": "Always reply in English.",
            "zh": "请用中文回复。",
            "ja": "必ず日本語で返答してください。",
            "auto": "Answer in the same language as the user.",
        }
        lang_instruction = _lang_instructions.get(lang, _lang_instructions["auto"])

        system_content = (
            f"You are an intelligent assistant for the django-vue-admin management system. "
            f"{lang_instruction} Keep answers concise and practical."
        )
        if tool_data:
            import json
            data_str = json.dumps(tool_data, ensure_ascii=False, indent=2)
            system_content += (
                f"\n\nThe following real-time data has been retrieved from the database for this query:\n"
                f"```json\n{data_str}\n```\n"
                f"Use this data to answer the user's question accurately."
            )

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_content},
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
                "tools_used": tool_names,
            }
        )
