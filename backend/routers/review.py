"""数据复盘路由。基于本地模拟数据 + DeepSeek 复盘分析。"""
import random
from fastapi import APIRouter

from schemas import ReviewRequest
from services import deepseek_client, prompts
from services.fallback import review_fallback

router = APIRouter()


def _gen_mock_metrics(profile):
    """生成贴合账号规模的模拟发布数据。"""
    base = max(profile.avgViews, 500)
    views = int(base * random.uniform(1.2, 2.5))
    likes = int(views * random.uniform(0.06, 0.11))
    collects = int(views * random.uniform(0.02, 0.05))
    comments = int(views * random.uniform(0.008, 0.02))
    new_fans = int(views * random.uniform(0.01, 0.025))
    completion = round(random.uniform(28, 52), 1)
    ctr_up = round(random.uniform(0.8, 3.5), 1)
    # 7 天趋势
    trend = [int(views * random.uniform(0.05, 0.12) * (1 + i * 0.15)) for i in range(7)]
    return {
        "views": views, "likes": likes, "collects": collects, "comments": comments,
        "newFans": new_fans, "completion": completion, "ctrUp": ctr_up,
        "avgViews": profile.avgViews, "trend": trend,
        "dailyLabels": ["第1天", "第2天", "第3天", "第4天", "第5天", "第6天", "第7天"],
    }


@router.post("/api/review")
def review(req: ReviewRequest):
    p = req.profile
    metrics = _gen_mock_metrics(p)
    user_prompt = (
        f"请对以下已发布内容做数据复盘。\n\n"
        f"【账号现状】\n平台:{p.platform}\n内容方向:{p.contentDirection}\n账号当前粉丝:{p.currentFans}\n"
        f"内容标题:{req.contentTitle or '(示例内容)'}\n"
        f"播放量:{metrics['views']}\n点赞:{metrics['likes']}\n收藏:{metrics['collects']}\n"
        f"评论:{metrics['comments']}\n新增转粉:{metrics['newFans']}\n完播率:{metrics['completion']}%\n"
        f"CTR提升:{metrics['ctrUp']}%\n账号历史平均播放:{metrics['avgViews']}\n\n"
        f"【个人习惯】(复盘建议要结合这些习惯,用昵称呼用户,像朋友一样给鼓励)\n{p.habits_text()}\n\n"
        f"{prompts.REVIEW_FMT}"
    )
    try:
        analysis = deepseek_client.chat_json(prompts.REVIEW_ROLE, user_prompt, temperature=0.7)
        analysis["source"] = "ai"
    except Exception as e:
        analysis = review_fallback(p)
        analysis["source"] = "fallback"
        analysis["error"] = str(e)
    analysis["metrics"] = metrics
    return analysis
