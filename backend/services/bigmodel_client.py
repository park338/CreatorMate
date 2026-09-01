"""智谱 CogView 图片生成客户端(REST API + JWT 认证)。

特性:
- 使用标准库实现 JWT 认证,无需额外安装 PyJWT
- 读取环境变量 BIGMODEL_API_KEY
- 支持并发生成多张图片
- 失败时返回 None,由路由层降级处理
"""
import os
import time
import json
import hmac
import hashlib
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed

import httpx

API_KEY = os.environ.get("BIGMODEL_API_KEY", "")
BASE_URL = "https://open.bigmodel.cn/api/paas/v4/images/generations"
MODEL = os.environ.get("BIGMODEL_MODEL", "cogview-3")


def _b64url_encode(data: bytes) -> str:
    """Base64url 编码(无 padding)。"""
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _generate_jwt(api_key: str) -> str:
    """从智谱 API Key(id.secret 格式)生成 JWT token。"""
    parts = api_key.split(".")
    if len(parts) != 2:
        raise ValueError("BIGMODEL_API_KEY 格式应为 {id}.{secret}")

    key_id, secret = parts

    header = {"alg": "HS256", "sign_type": "SIGN"}
    header_b64 = _b64url_encode(json.dumps(header).encode())

    payload = {
        "api_key": key_id,
        "exp": int(time.time()) + 3600,
        "timestamp": int(time.time()),
    }
    payload_b64 = _b64url_encode(json.dumps(payload).encode())

    message = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    sig_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def is_available() -> bool:
    """检查 CogView 是否可用(已配置 Key)。"""
    return bool(API_KEY and "." in API_KEY)


def generate_image(prompt: str, size: str = "1024x1024", timeout: int = 60) -> str | None:
    """生成单张图片,返回 URL 或 None。"""
    if not is_available():
        return None
    try:
        token = _generate_jwt(API_KEY)
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(
                BASE_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "prompt": prompt,
                    "size": size,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            urls = data.get("data", [])
            if urls and isinstance(urls, list):
                return urls[0].get("url")
    except Exception:
        pass
    return None


def generate_images(prompts: list[str], size: str = "1024x1024") -> list[str | None]:
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

    注意:不在 prompt 中要求渲染中文文字(会导致乱码),只描述画面内容/色调/构图。
    前端拿到纯图片后直接展示。
    """
    visual = cover.get("visual_desc", "") or cover.get("tip", "")

    platform_hint = {
        "小红书": "小红书风格,精致美食摄影,暖色调,高饱和度, appetizing",
        "抖音": "抖音风格,强视觉冲击,高对比度,吸睛",
        "视频号": "视频号风格,生活化质感,自然光线",
        "B站": "B站风格,信息丰富,清晰明了",
    }.get(platform, "社交媒体风格封面")

    base = f"{platform_hint}，{visual}，纯背景图无文字"

    styles = [
        "温暖治愈风格，暖色调，柔和光影，食物特写，食欲感强",
        "清新简约风格，明亮色调，干净白色背景，高级杂志质感",
        "活力吸睛风格，鲜艳色彩，强对比度，社交媒体爆款视觉",
    ]
    return [f"{base}，{style}，画面干净无文字无水印" for style in styles]
