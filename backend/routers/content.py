"""内容生成路由。"""
from fastapi import APIRouter

from schemas import ContentRequest
from services import deepseek_client, prompts
from services.fallback import content_fallback

router = APIRouter()


@router.post("/api/generate-content")
def generate_content(req: ContentRequest):
    p = req.profile
    user_prompt = (
        f"请为以下选题生成完整内容包。\n\n"
        f"【账号现状】\n{p.base_text()}\n选定选题:{req.topic}\n\n"
        f"【个人习惯】(这是个性化服务的关键:文案口吻要匹配说话风格,脚本难度要匹配拍摄条件,标题调性要匹配内容风格偏好,用昵称呼用户)\n{p.habits_text()}\n\n"
        f"{prompts.CONTENT_FMT}"
    )
    try:
        result = deepseek_client.chat_json(prompts.CONTENT_ROLE, user_prompt, temperature=0.9)
        result["source"] = "ai"
        return result
    except Exception as e:
        result = content_fallback(req.topic, p)
        result["source"] = "fallback"
        result["error"] = str(e)
        return result
