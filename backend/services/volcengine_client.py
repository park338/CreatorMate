"""火山引擎 豆包 Seedream 图片生成客户端(REST API)。

特性:
- 使用火山引擎方舟平台 API Key 鉴权(Bearer Token,无需 JWT)
- 读取环境变量 VOLCENGINE_API_KEY
- 支持并发生成多张图片
- 豆包 Seedream 模型中文文字渲染能力强,可生成带文字封面
- 失败时返回 None,由路由层降级处理
"""
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

import httpx

API_KEY = os.environ.get("VOLCENGINE_API_KEY", "")
BASE_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations"
# 默认使用豆包 Seedream 5.0;可通过 VOLCENGINE_MODEL 配置其他版本
MODEL = os.environ.get("VOLCENGINE_MODEL", "doubao-seedream-5-0-260128")
# 默认 2K 分辨率;5.0/4.5/4.0 支持 2K/4K,3.0-t2i 用 1024x1024
IMAGE_SIZE = os.environ.get("VOLCENGINE_IMAGE_SIZE", "2K")


def is_available() -> bool:
    """检查豆包生图是否可用(已配置 API Key)。"""
    return bool(API_KEY)


def generate_image(prompt: str, size: str = IMAGE_SIZE, timeout: int = 90) -> str | None:
    """生成单张图片,返回 URL 或 None。"""
    if not is_available():
        return None
    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(
                BASE_URL,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "prompt": prompt,
                    "size": size,
                    "watermark": False,
                    "response_format": "url",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            images = data.get("data", [])
            if images and isinstance(images, list):
                # 成功的图片信息对象
                if images[0].get("url"):
                    return images[0]["url"]
                # 某些版本返回 b64_json
                if images[0].get("b64_json"):
                    return f"data:image/jpeg;base64,{images[0]['b64_json']}"
    except Exception:
        pass
    return None


def generate_images(prompts: list[str], size: str = IMAGE_SIZE) -> list[str | None]:
    """并发生成多张图片,返回 URL 列表(失败的为 None)。"""
    if not is_available():
        return [None] * len(prompts)

    results: list[str | None] = [None] * len(prompts)
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_idx = {
            executor.submit(generate_image, p, size): i
            for i, p in enumerate(prompts)
        }
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                results[idx] = future.result()
            except Exception:
                results[idx] = None
    return results


def build_cover_prompts(cover: dict, platform: str) -> list[str]:
    """根据封面文案和平台,构建 3 个不同风格的图片生成 prompt。

    豆包 Seedream 模型支持中文文字渲染,可在封面上生成标题文字。
    """
    title = cover.get("title", "")
    subtitle = cover.get("subtitle", "")
    visual = cover.get("visual_desc", "") or cover.get("tip", "")

    platform_hint = {
        "小红书": "小红书风格封面,精致美食摄影,暖色调,高饱和度,竖版构图,appetizing",
        "抖音": "抖音风格封面,强视觉冲击,高对比度,吸睛,竖版",
        "视频号": "视频号风格封面,生活化质感,自然光线,竖版",
        "B站": "B站风格封面,信息丰富,清晰明了,横版",
    }.get(platform, "社交媒体风格封面")

    # 封面文字描述(豆包可渲染中文)
    text_desc = ""
    if title:
        text_desc = f"封面上方有大标题文字「{title}」"
        if subtitle:
            text_desc += f",下方有副标题「{subtitle}」"

    base = f"{platform_hint}，{visual}，{text_desc}"

    styles = [
        "温暖治愈风格,暖色调,柔和光影,食物特写,食欲感强,精致排版",
        "清新简约风格,明亮色调,干净白色背景,高级杂志质感,留白设计",
        "活力吸睛风格,鲜艳色彩,强对比度,社交媒体爆款视觉,大字标题",
    ]
    return [f"{base}，{style}" for style in styles]
