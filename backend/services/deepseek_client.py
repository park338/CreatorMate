"""DeepSeek API 客户端封装(OpenAI 兼容协议)。

特性:
- 统一的结构化 JSON 调用入口
- 自动读取环境变量 DEEPSEEK_API_KEY
- 失败时抛出可读异常,由路由层降级处理
"""
import os
import json
from typing import Any

from openai import OpenAI

# 从环境变量读取配置
API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
DIAGNOSE_MODEL = os.environ.get("DEEPSEEK_DIAGNOSE_MODEL", "deepseek-reasoner")

_client: OpenAI | None = None


def get_client() -> OpenAI:
    """获取(惰性创建)OpenAI 兼容客户端。"""
    global _client
    if _client is None:
        if not API_KEY:
            raise RuntimeError("环境变量 DEEPSEEK_API_KEY 未配置")
        _client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
    return _client


def chat_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.8,
    model: str | None = None,
) -> dict[str, Any]:
    """调用 DeepSeek 并返回解析后的 JSON 字典。

    使用 json_object 响应格式,确保输出可解析为 JSON。
    """
    client = get_client()
    resp = client.chat.completions.create(
        model=model or MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )
    content = resp.choices[0].message.content or "{}"
    return json.loads(content)


def is_available() -> bool:
    """检查 DeepSeek 是否可用(已配置 Key)。"""
    return bool(API_KEY)


def chat_text(system_prompt: str, user_prompt: str, temperature: float = 0.8) -> str:
    """调用 DeepSeek 并返回纯文本(用于对话场景)。"""
    client = get_client()
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=1024,
    )
    return resp.choices[0].message.content or ""
