"""创作工坊路由 —— 用户输入标题,AI 生成完整内容包 + 封面配图 + 风格 DNA 分析。"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services import deepseek_client, prompts, volcengine_client
from services.fallback import workshop_gen_fallback, style_analyze_fallback

router = APIRouter()

STYLE_DIMENSIONS = ("幽默", "情绪", "专业", "亲和", "犀利", "网感")


class WorkshopGenRequest(BaseModel):
    title: str
    platform: str = "小红书"
    profile: Optional[dict] = None


@router.post("/api/workshop/generate")
def generate(req: WorkshopGenRequest):
    # 1. 构造 DeepSeek prompt(含风格 DNA)
    p = req.profile or {}
    habits = p.get("habits", {}) if isinstance(p, dict) else {}
    style_dna = habits.get("styleDNA", {}) if isinstance(habits, dict) else {}

    profile_ctx = ""
    if habits and isinstance(habits, dict):
        profile_ctx = (
            f"\n【个人习惯】(隐含条件,口吻要匹配)\n"
            f"昵称:{habits.get('nickname', '')}\n"
            f"内容风格:{habits.get('contentStyle', '')}\n"
            f"口吻:{habits.get('tone', '')}\n"
            f"性格:{habits.get('personality', '')}\n"
            f"兴趣:{habits.get('interests', '')}\n"
            f"目标受众:{p.get('targetAudience', '')}\n"
        )
        sample_count = int(style_dna.get("sampleCount", 0) or 0) if isinstance(style_dna, dict) else 0
        if sample_count > 0 and style_dna.get("dimensions"):
            dims = style_dna.get("dimensions", {})
            profile_ctx += (
                f"\n【写作风格 DNA】(基于{sample_count}篇用户确认定稿)\n"
                f"维度分数:{'/'.join(f'{k}{v}' for k, v in dims.items())}\n"
                f"写作风格描述:{style_dna.get('writingStyle', '')}\n"
            )
            generation_dims = style_dna.get("generationDimensions", {})
            if generation_dims:
                profile_ctx += (
                    "生成调性目标(只影响本次创作,不代表样本画像):"
                    f"{'/'.join(f'{k}{v}' for k, v in generation_dims.items())}\n"
                )
        else:
            profile_ctx += "\n【风格状态】尚未形成样本画像,不要自行推测六维分数。\n"

    user_prompt = (
        f"用户在创作工坊中输入了标题,请基于这个标题生成完整内容包。\n\n"
        f"发布平台:{req.platform}\n"
        f"用户输入的标题:{req.title}\n"
        f"{profile_ctx}\n"
        f"{prompts.WORKSHOP_GEN_FMT}"
    )

    # 2. 调 DeepSeek 生成内容
    try:
        result = deepseek_client.chat_json(
            prompts.WORKSHOP_GEN_ROLE,
            user_prompt,
            temperature=0.9,
        )
        result["source"] = "ai"
    except Exception as e:
        result = workshop_gen_fallback(req.title, req.platform, req.profile)
        result["source"] = "fallback"
        result["error"] = str(e)

    # 3. 调豆包 Seedream 生成 3 张封面图
    cover = result.get("cover", {})
    image_prompts = volcengine_client.build_cover_prompts(cover, req.platform)
    image_urls = volcengine_client.generate_images(image_prompts)
    result["cover_images"] = [u for u in image_urls if u]

    return result


class CoverImageRequest(BaseModel):
    cover: dict
    platform: str = "小红书"


@router.post("/api/workshop/cover-image")
def cover_image(req: CoverImageRequest):
    """单张封面图生成(供专家规划等场景复用)。"""
    prompts_list = volcengine_client.build_cover_prompts(req.cover, req.platform)
    url = volcengine_client.generate_image(prompts_list[0]) if prompts_list else None
    return {"image_url": url}


class StyleAnalyzeRequest(BaseModel):
    """风格分析请求。"""
    content: str
    platform: str = "小红书"
    currentDNA: Optional[dict] = None


@router.post("/api/style-dna/analyze")
def analyze_style(req: StyleAnalyzeRequest):
    """AI 分析用户写的内容,输出风格 DNA 维度分数。"""
    user_prompt = (
        f"请只分析以下这一篇用户确认定稿的风格特征,从 6 个维度打分。\n\n"
        f"发布平台:{req.platform}\n"
        f"内容:{req.content}\n"
        f"{prompts.STYLE_ANALYZE_FMT}"
    )

    try:
        result = deepseek_client.chat_json(
            prompts.STYLE_ANALYZE_ROLE,
            user_prompt,
            temperature=0.2,
        )
        result["dimensions"] = {
            dimension: max(0, min(100, round(float(result["dimensions"][dimension]))))
            for dimension in STYLE_DIMENSIONS
        }
        evidence = result.get("evidence", {})
        result["evidence"] = {
            dimension: str(evidence.get(dimension, "")).strip()
            for dimension in STYLE_DIMENSIONS
        }
        result["source"] = "ai"
        return result
    except Exception as e:
        fb = style_analyze_fallback(req.content)
        fb["source"] = "fallback"
        fb["error"] = str(e)
        return fb
