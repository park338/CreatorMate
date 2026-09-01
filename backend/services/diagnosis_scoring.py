"""账号五维诊断的确定性评分规则。

这些阈值用于产品内的相对诊断，不代表任何平台的官方行业基准。
AI 可以解释结果，但不能改写这里生成的分数、等级和证据。
"""
from __future__ import annotations

from typing import Any, Callable


DIMENSION_NAMES = {
    "positioning": "定位清晰度",
    "supply": "内容供给能力",
    "reach": "流量触达效率",
    "engagement": "互动效率",
    "growth": "增长动能",
}


def _weighted_score(parts: list[tuple[float, float]]) -> int:
    return round(sum(score * weight for score, weight in parts))


def _level(score: int | None) -> str:
    if score is None:
        return "待评估"
    if score >= 85:
        return "优"
    if score >= 70:
        return "良"
    if score >= 50:
        return "中"
    return "差"


def _priority(score: int | None) -> str:
    if score is None:
        return "待评估"
    if score < 60:
        return "高"
    if score < 75:
        return "中"
    return "低"


def _band_score(value: float, bands: list[tuple[float, int]]) -> int:
    """Return the score for the first upper bound that contains value."""
    for upper_bound, score in bands:
        if value < upper_bound:
            return score
    return bands[-1][1]


def _dimension(
    key: str,
    score: int | None,
    confidence: str,
    evidence: str,
    desc: str,
) -> dict[str, Any]:
    return {
        "key": key,
        "name": DIMENSION_NAMES[key],
        "score": score,
        "level": _level(score),
        "confidence": confidence,
        "evidence": evidence,
        "desc": desc,
        "priority": _priority(score),
    }


def _positioning(profile) -> dict[str, Any]:
    direction_scores = {
        "校园探店": 95,
        "本地生活": 72,
        "美食分享": 78,
        "好物种草": 78,
        "穿搭分享": 82,
        "学习干货": 82,
    }
    audience_scores = {"泛兴趣用户": 45, "其他人群": 55}
    value_scores = {"实用信息": 72, "真实体验": 76}

    direction = str(profile.contentDirection or "").strip()
    audience = str(profile.targetAudience or "").strip()
    value = str(profile.valueProposition or "").strip()
    direction_score = direction_scores.get(direction, 80 if direction else 30)
    audience_score = audience_scores.get(audience, 90 if audience else 30)
    value_score = value_scores.get(value, 90 if value else 30)
    relation_score = 90 if direction and audience and value else 50
    if audience in {"泛兴趣用户", "其他人群"}:
        relation_score -= 12

    score = _weighted_score([
        (direction_score, 0.35),
        (audience_score, 0.30),
        (value_score, 0.25),
        (relation_score, 0.10),
    ])
    evidence = f"方向“{direction or '未填写'}” · 受众“{audience or '未填写'}” · 关注理由“{value or '未填写'}”"
    if score >= 85:
        desc = "方向、受众和关注理由已经形成清晰组合，后续内容应持续围绕这组定位验证用户反馈。"
    elif score >= 70:
        desc = "基础定位已成立，但其中仍有一项偏宽，内容主题和表达对象需要进一步收窄。"
    else:
        desc = "当前定位信息偏泛，用户较难快速判断账号适合谁、能持续获得什么价值。"
    return _dimension("positioning", score, "高", evidence, desc)


def _supply(profile) -> dict[str, Any]:
    frequency_scores = {"每周1条": 45, "每周2-3条": 75, "每周3-5条": 92, "日更": 100}
    topic_scores = {"1个以内": 35, "2-3个": 70, "4-5个": 92, "6个以上": 96}
    condition_scores = {"手机随手拍": 70, "有相机/微单": 78, "会基础剪辑": 88, "团队/专业制作": 96}

    frequency = str(profile.postFreq or "").strip()
    topics = str(profile.sustainableTopics or "").strip()
    condition = str(profile.habits.shootCondition or "").strip()
    score = _weighted_score([
        (frequency_scores.get(frequency, 50), 0.45),
        (topic_scores.get(topics, 50), 0.30),
        (condition_scores.get(condition, 60), 0.25),
    ])
    evidence = f"实际更新“{frequency or '未填写'}” · 可持续主题“{topics or '未填写'}” · 制作条件“{condition or '未填写'}”"
    if score >= 85:
        desc = "更新频率、主题储备和制作条件能够互相支撑，具备稳定测试并迭代内容的基础。"
    elif score >= 70:
        desc = "当前供给基本可持续，但主题储备或制作流程仍可能成为提高更新频率时的瓶颈。"
    else:
        desc = "内容供给容易受频率、主题储备或制作条件限制，建议先建立更轻量的固定栏目。"
    return _dimension("supply", score, "高", evidence, desc)


def _reach(profile) -> dict[str, Any]:
    fans = max(int(profile.currentFans or 0), 0)
    views = max(int(profile.avgViews or 0), 0)
    if views <= 0:
        return _dimension(
            "reach",
            None,
            "低",
            "近10条平均播放为0，缺少可用于判断触达的数据",
            "新号或未录入播放数据，当前不把流量触达判为弱项。发布并记录至少5-10条内容后再评估。",
        )

    if fans < 100:
        score = _band_score(views, [(50, 35), (100, 50), (300, 70), (800, 85), (float("inf"), 95)])
        evidence = f"当前{fans}粉，近10条平均播放{views}；冷启动阶段按绝对播放区间判断"
    else:
        ratio = views / fans
        if fans < 1000:
            bands = [(0.5, 30), (1.0, 50), (2.0, 70), (4.0, 85), (float("inf"), 95)]
        elif fans < 10000:
            bands = [(0.2, 30), (0.5, 50), (1.0, 70), (2.0, 85), (float("inf"), 95)]
        else:
            bands = [(0.1, 30), (0.25, 50), (0.5, 70), (1.0, 85), (float("inf"), 95)]
        score = _band_score(ratio, bands)
        evidence = f"近10条平均播放{views} ÷ 当前粉丝{fans} = {ratio:.2f}倍，按账号阶段分档"

    if score >= 85:
        desc = "内容能够稳定触达粉丝圈层之外的人群，当前选题或分发信号具备继续放大的价值。"
    elif score >= 70:
        desc = "流量触达处于可用水平，但还没有形成稳定突破，需继续复用高播放内容的共同特征。"
    else:
        desc = "平均播放相对账号阶段偏弱，优先检查选题需求强度、封面信息和开头承诺是否一致。"
    return _dimension("reach", score, "中", evidence, desc)


def _engagement(profile) -> dict[str, Any]:
    views = max(int(profile.avgViews or 0), 0)
    interactions = max(int(profile.avgInteraction or 0), 0)
    if views <= 0:
        return _dimension(
            "engagement",
            None,
            "低",
            "缺少有效播放基数，无法计算平均互动率",
            "互动量必须结合播放量判断；当前数据不足，不将互动效率判为弱项。",
        )

    rate = interactions / views
    score = _band_score(rate, [(0.01, 30), (0.03, 50), (0.05, 70), (0.08, 85), (float("inf"), 95)])
    evidence = f"近10条平均互动{interactions} ÷ 平均播放{views} = {rate:.1%}"
    if score >= 85:
        desc = "互动率表现强，内容能够促使用户做出点赞、收藏或评论等主动反馈。"
    elif score >= 70:
        desc = "互动效率健康，建议进一步区分点赞、收藏和评论，确认真正驱动互动的内容价值。"
    else:
        desc = "用户看到了内容但主动反馈偏少，需要强化可收藏的信息、明确观点或评论触发点。"
    return _dimension("engagement", score, "中", evidence, desc)


def _growth(profile) -> dict[str, Any]:
    fans = max(int(profile.currentFans or 0), 0)
    new_fans = max(int(profile.newFans30d or 0), 0)
    if fans == 0 and new_fans == 0:
        return _dimension(
            "growth",
            None,
            "低",
            "当前粉丝与近30天新增粉丝均为0，尚无增长样本",
            "账号尚未形成可观察的增长周期，先完成首批内容发布再判断增长动能。",
        )

    if fans == 0:
        score = _band_score(new_fans, [(10, 45), (30, 60), (100, 78), (300, 90), (float("inf"), 96)])
        confidence = "中"
        evidence = f"当前粉丝填报为0，近30天新增{new_fans}；按冷启动新增量分档"
    elif new_fans == 0:
        return _dimension(
            "growth",
            None,
            "低",
            f"当前{fans}粉，近30天新增填报为0，无法区分未增长与未统计",
            "新增粉丝填0存在两种含义，当前不据此判低分；补录真实数据后再评估增长动能。",
        )
    else:
        rate = new_fans / fans
        score = _band_score(rate, [(0.005, 30), (0.02, 50), (0.05, 70), (0.15, 85), (float("inf"), 95)])
        confidence = "中"
        evidence = f"近30天新增{new_fans} ÷ 当前粉丝{fans} = {rate:.1%}"

    if score >= 85:
        desc = "近30天新增粉丝相对当前体量较强，账号正处于明显增长阶段。"
    elif score >= 70:
        desc = "账号具备稳定增长迹象，可以围绕高转粉内容继续提高发布密度和系列化程度。"
    elif score >= 50:
        desc = "增长存在但动能有限，需要识别带来关注的内容，并强化用户持续关注的理由。"
    else:
        desc = "近30天增长偏弱或数据未完整统计，先确认转粉数据，再排查内容价值与关注承诺。"
    return _dimension("growth", score, confidence, evidence, desc)


ACTION_BUILDERS: dict[str, Callable[[Any], dict[str, str]]] = {
    "positioning": lambda p: {
        "action": f"把“{p.contentDirection} + {p.targetAudience} + {p.valueProposition}”写成一句固定定位承诺",
        "reason": "稳定的方向、对象和价值承诺能减少内容漂移，也让用户更快判断是否值得关注。",
        "expected": "账号表达更统一，内容选题和关注理由更清晰",
    },
    "supply": lambda p: {
        "action": f"按{p.postFreq}的现实节奏，先建立2-3个可重复的轻量栏目",
        "reason": "稳定供给依赖可重复流程，而不是临时追求高频更新。",
        "expected": "降低选题和制作成本，提高连续发布能力",
    },
    "reach": lambda p: {
        "action": "复盘近10条内容的播放差异，只保留高播放内容共有的选题与开头结构",
        "reason": "触达效率首先由用户是否愿意停留和平台能否识别内容价值决定。",
        "expected": "提高进入推荐流和突破现有粉丝圈层的概率",
    },
    "engagement": lambda p: {
        "action": "每条内容只设计一个明确互动目标，并在结尾给出具体回应入口",
        "reason": "泛泛地要求点赞评论通常无效，具体问题或可收藏信息更容易触发主动反馈。",
        "expected": "提升评论、收藏或点赞中的至少一项核心互动",
    },
    "growth": lambda p: {
        "action": "标记近30天每条内容带来的新增关注，优先复用高转粉主题",
        "reason": "播放和互动不等于增长，必须单独识别真正提供持续关注理由的内容。",
        "expected": "找到可复制的转粉内容，增强增长稳定性",
    },
}


def _build_priorities(profile, dimensions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    scored = [dimension for dimension in dimensions if dimension["score"] is not None]
    scored.sort(key=lambda dimension: dimension["score"])
    priorities = []
    for dimension in scored[:3]:
        action = ACTION_BUILDERS[dimension["key"]](profile)
        priorities.append({
            "rank": len(priorities) + 1,
            "dimensionKey": dimension["key"],
            **action,
        })

    if len(priorities) < 3 and any(dimension["score"] is None for dimension in dimensions):
        priorities.append({
            "rank": len(priorities) + 1,
            "dimensionKey": "data",
            "action": "连续记录至少5-10条内容的播放、互动和新增粉丝",
            "reason": "缺失数据不会被当作低分，但会限制触达、互动和增长判断的准确性。",
            "expected": "下一次诊断可以覆盖完整五维，并减少经验判断",
        })
    return priorities


def build_diagnosis(profile) -> dict[str, Any]:
    dimensions = [
        _positioning(profile),
        _supply(profile),
        _reach(profile),
        _engagement(profile),
        _growth(profile),
    ]
    scored = [dimension for dimension in dimensions if dimension["score"] is not None]
    pending = len(dimensions) - len(scored)
    if scored:
        weakest = min(scored, key=lambda dimension: dimension["score"])
        summary = f"已完成{len(scored)}项评估，当前最需要关注的是{weakest['name']}；"
        summary += f"另有{pending}项因数据不足待评估。" if pending else "五项均已有可解释的数据依据。"
    else:
        summary = "当前数据不足，暂不生成表现结论。"
    return {
        "dimensions": dimensions,
        "summary": summary,
        "priorities": _build_priorities(profile, dimensions),
        "scoringNote": "分数来自产品内固定诊断规则，用于同一账号的阶段比较，不代表平台官方行业基准。",
    }
