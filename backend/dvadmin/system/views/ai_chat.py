import json
import re
import time
from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
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
            {"name": d["name"], "owner": d["owner"] or "—", "status": bool(d["status"])}
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
            {"name": r["name"], "key": r["key"], "status": bool(r["status"])}
            for r in roles
        ],
    }


# Tool registry: keyword triggers → handler
_TOOLS = [
    {
        "name": "get_user_stats",
        "description": "用户统计：总数、活跃数、新增数",
        "keywords": [
            "用户", "账号", "注册", "人数", "多少人", "用户数", "新增用户",
            "user", "users", "account", "accounts", "how many user", "registered",
            "ユーザー", "アカウント", "何人",
        ],
        "func": _query_user_stats,
    },
    {
        "name": "get_login_stats",
        "description": "登录统计：总登录次数、最近7天、活跃用户",
        "keywords": [
            "登录", "登陆", "上线", "活跃", "login",
            "logins", "log in", "sign in", "active user",
            "ログイン", "サインイン",
        ],
        "func": _query_login_stats,
    },
    {
        "name": "get_dept_stats",
        "description": "部门统计：部门列表、数量",
        "keywords": [
            "部门", "组织", "dept",
            "department", "departments", "org",
            "部署", "組織",
        ],
        "func": _query_dept_stats,
    },
    {
        "name": "get_role_stats",
        "description": "角色统计：角色列表、数量",
        "keywords": [
            "角色", "权限", "role",
            "roles", "permission", "permissions",
            "ロール", "権限",
        ],
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


def _detect_reply_lang(message: str, lang: str) -> str:
    if lang in {"en", "zh", "ja"}:
        return lang
    if re.search(r"[\u3040-\u30ff]", message):
        return "ja"
    if re.search(r"[\u4e00-\u9fff]", message):
        return "zh"
    return "en"


def _format_status(status: bool, lang: str) -> str:
    labels = {
        "en": ("enabled", "disabled"),
        "zh": ("启用", "禁用"),
        "ja": ("有効", "無効"),
    }
    enabled, disabled = labels.get(lang, labels["en"])
    return enabled if status else disabled


def _format_user_stats(data: dict, lang: str) -> str:
    if lang == "zh":
        return (
            f"当前系统共有 {data['total_users']} 个用户，其中 {data['active_users']} 个启用，"
            f"{data['disabled_users']} 个禁用。\n最近 7 天新增 {data['new_users_last_7_days']} 个，"
            f"最近 30 天新增 {data['new_users_last_30_days']} 个。"
        )
    if lang == "ja":
        return (
            f"現在、システムには {data['total_users']} 人のユーザーがいます。"
            f"有効 {data['active_users']} 人、無効 {data['disabled_users']} 人です。\n"
            f"直近7日間の新規ユーザーは {data['new_users_last_7_days']} 人、"
            f"直近30日間では {data['new_users_last_30_days']} 人です。"
        )
    return (
        f"There are {data['total_users']} users in the system: "
        f"{data['active_users']} active and {data['disabled_users']} disabled.\n"
        f"New users: {data['new_users_last_7_days']} in the last 7 days and "
        f"{data['new_users_last_30_days']} in the last 30 days."
    )


def _format_login_stats(data: dict, lang: str) -> str:
    top_users = data.get("top_active_users_last_7_days") or []
    if top_users:
        if lang == "zh":
            top_text = "；最近 7 天最活跃用户：" + "、".join(
                f"{item['username']}（{item['login_count']} 次）" for item in top_users
            )
        elif lang == "ja":
            top_text = "。直近7日間の上位ユーザー: " + "、".join(
                f"{item['username']}（{item['login_count']}回）" for item in top_users
            )
        else:
            top_text = ". Top users in the last 7 days: " + ", ".join(
                f"{item['username']} ({item['login_count']})" for item in top_users
            )
    else:
        top_text = ""

    if lang == "zh":
        return (
            f"累计登录 {data['total_logins']} 次，最近 7 天登录 {data['logins_last_7_days']} 次"
            f"{top_text}。"
        )
    if lang == "ja":
        return (
            f"累計ログイン回数は {data['total_logins']} 回、直近7日間は "
            f"{data['logins_last_7_days']} 回です{top_text}。"
        )
    return (
        f"Total logins: {data['total_logins']}. "
        f"Logins in the last 7 days: {data['logins_last_7_days']}{top_text}."
    )


def _format_dept_stats(data: dict, lang: str) -> str:
    departments = data.get("departments") or []
    samples = departments[:5]
    if samples:
        if lang == "zh":
            sample_text = "；示例：" + "；".join(
                f"{item['name']}（负责人：{item['owner']}，状态：{_format_status(item['status'], lang)}）"
                for item in samples
            )
        elif lang == "ja":
            sample_text = "。例: " + "、".join(
                f"{item['name']}（責任者: {item['owner']}、状態: {_format_status(item['status'], lang)}）"
                for item in samples
            )
        else:
            sample_text = ". Examples: " + "; ".join(
                f"{item['name']} (owner: {item['owner']}, status: {_format_status(item['status'], lang)})"
                for item in samples
            )
    else:
        sample_text = ""

    if lang == "zh":
        return f"当前共有 {data['total_departments']} 个部门{sample_text}。"
    if lang == "ja":
        return f"現在、部門は {data['total_departments']} 件あります{sample_text}。"
    return f"There are {data['total_departments']} departments{sample_text}."


def _format_role_stats(data: dict, lang: str) -> str:
    roles = data.get("roles") or []
    samples = roles[:5]
    if samples:
        if lang == "zh":
            sample_text = "；示例：" + "；".join(
                f"{item['name']}（标识：{item['key']}，状态：{_format_status(item['status'], lang)}）"
                for item in samples
            )
        elif lang == "ja":
            sample_text = "。例: " + "、".join(
                f"{item['name']}（キー: {item['key']}、状態: {_format_status(item['status'], lang)}）"
                for item in samples
            )
        else:
            sample_text = ". Examples: " + "; ".join(
                f"{item['name']} (key: {item['key']}, status: {_format_status(item['status'], lang)})"
                for item in samples
            )
    else:
        sample_text = ""

    if lang == "zh":
        return f"当前共有 {data['total_roles']} 个角色{sample_text}。"
    if lang == "ja":
        return f"現在、ロールは {data['total_roles']} 件あります{sample_text}。"
    return f"There are {data['total_roles']} roles{sample_text}."


_TOOL_REPLY_BUILDERS = {
    "get_user_stats": _format_user_stats,
    "get_login_stats": _format_login_stats,
    "get_dept_stats": _format_dept_stats,
    "get_role_stats": _format_role_stats,
}


def _format_tool_error(tool_name: str, error: str, lang: str) -> str:
    labels = {
        "get_user_stats": {"en": "user statistics", "zh": "用户统计", "ja": "ユーザー統計"},
        "get_login_stats": {"en": "login statistics", "zh": "登录统计", "ja": "ログイン統計"},
        "get_dept_stats": {"en": "department statistics", "zh": "部门统计", "ja": "部門統計"},
        "get_role_stats": {"en": "role statistics", "zh": "角色统计", "ja": "ロール統計"},
    }
    label = labels.get(tool_name, {}).get(lang, tool_name)
    if lang == "zh":
        return f"{label}查询失败：{error}"
    if lang == "ja":
        return f"{label}の取得に失敗しました: {error}"
    return f"Failed to load {label}: {error}"


def _build_tool_reply(tool_names: list, tool_data: dict, lang: str, message: str) -> str:
    if not tool_names:
        return ""

    reply_lang = _detect_reply_lang(message, lang)
    sections = []
    for tool_name in tool_names:
        data = tool_data.get(tool_name) or {}
        if "error" in data:
            sections.append(_format_tool_error(tool_name, data["error"], reply_lang))
            continue
        formatter = _TOOL_REPLY_BUILDERS.get(tool_name)
        if formatter:
            sections.append(formatter(data, reply_lang))
    return "\n\n".join(section for section in sections if section)


def _parse_bool(value, default=True):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "on"}
    return bool(value)


def _build_agent_no_match_reply(lang: str, message: str) -> str:
    reply_lang = _detect_reply_lang(message, lang)
    if reply_lang == "zh":
        return (
            "AGENT 模式已开启，我会直接查数据库后返回结果。\n"
            "当前支持：用户统计、登录统计、部门统计、角色统计。\n"
            "请明确你要查哪一类，例如：系统里有多少用户？"
        )
    if reply_lang == "ja":
        return (
            "AGENTモードは有効です。DBを直接参照して結果を返します。\n"
            "現在対応: ユーザー統計、ログイン統計、部門統計、ロール統計。\n"
            "どの種類を確認したいか具体的に指定してください。"
        )
    return (
        "AGENT mode is enabled and I will query the database directly.\n"
        "Currently supported: user stats, login stats, department stats, role stats.\n"
        "Please specify which one you want, for example: How many users are in the system?"
    )


# ---------------------------------------------------------------------------
# View
# ---------------------------------------------------------------------------

class AIChatView(APIView):
    """AI Agent chat endpoint: detects intent, queries real DB data, answers."""

    permission_classes = [IsAuthenticated]

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
        agent_mode = _parse_bool(request.data.get("agent_mode"), default=True)

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

        direct_reply = _build_tool_reply(tool_names, tool_data, lang, message)
        if direct_reply:
            return DetailResponse(
                data={
                    "reply": direct_reply,
                    "used_model": "server-agent",
                    "elapsed_ms": 0,
                    "tools_used": tool_names,
                    "agent_mode": agent_mode,
                }
            )

        if agent_mode:
            return DetailResponse(
                data={
                    "reply": _build_agent_no_match_reply(lang, message),
                    "used_model": "server-agent",
                    "elapsed_ms": 0,
                    "tools_used": [],
                    "agent_mode": True,
                }
            )

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
            f"{lang_instruction} Keep answers concise and practical. "
            f"Aggregated operational data from built-in server tools is safe to share with authenticated admins, "
            f"so do not refuse user-count or login-summary requests when that data is provided."
        )
        if tool_data:
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
                "agent_mode": agent_mode,
            }
        )
