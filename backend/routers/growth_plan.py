"""增长规划路由。"""
from fastapi import APIRouter

from schemas import GrowthPlanRequest
from services import deepseek_client, prompts
from services.fallback import growth_fallback

router = APIRouter()


@router.post("/api/growth-plan")
def growth_plan(req: GrowthPlanRequest):
    p = req.profile
    user_prompt = (
        f"请为以下账号制定增长规划。\n\n"
        f"【账号现状】\n{p.base_text()}\n\n"
        f"【个人习惯】(规划要贴合这些习惯:发布时间匹配活跃时段、栏目匹配风格偏好、选题匹配兴趣领域)\n{p.habits_text()}\n\n"
        f"{prompts.GROWTH_FMT}"
    )
    try:
        result = deepseek_client.chat_json(prompts.GROWTH_ROLE, user_prompt, temperature=0.8)
        result["source"] = "ai"
        return result
    except Exception as e:
        result = growth_fallback(p)
        result["source"] = "fallback"
        result["error"] = str(e)
        return result
