"""小悠助理路由 —— 自由对话,帮用户理清账号现状。"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services import deepseek_client, prompts
from services.fallback import assistant_fallback

router = APIRouter()


class AssistantRequest(BaseModel):
    message: str
    profile: Optional[dict] = None  # 可选,用户可能还没完成画像


class AssistantResponse(BaseModel):
    reply: str
    source: str  # 'ai' | 'fallback'


@router.post("/api/assistant")
def assistant(req: AssistantRequest):
    # 拼接上下文:如果用户已有画像,注入到 system prompt
    context = ""
    if req.profile:
        p = req.profile
        context = f"\n\n【用户账号现状】\n平台:{p.get('platform','')}\n账号名称:{p.get('accountName','')}\n内容方向:{p.get('contentDirection','')}\n当前粉丝:{p.get('currentFans',0)}\n目标粉丝:{p.get('targetFans',0)}"
        habits = p.get('habits', {})
        if habits:
            context += f"\n【个人习惯】\n昵称:{habits.get('nickname','小伙伴')}\n内容风格:{habits.get('contentStyle','')}\n口吻:{habits.get('tone','')}\n拍摄条件:{habits.get('shootCondition','')}\n活跃时段:{habits.get('activeTime','')}\n性格:{habits.get('personality','')}\n兴趣:{habits.get('interests','')}"

    system_prompt = prompts.ASSISTANT_ROLE + context

    try:
        reply = deepseek_client.chat_text(system_prompt, req.message, temperature=0.85)
        return AssistantResponse(reply=reply, source="ai")
    except Exception as e:
        reply = assistant_fallback(req.message, req.profile)
        return AssistantResponse(reply=reply, source="fallback")
