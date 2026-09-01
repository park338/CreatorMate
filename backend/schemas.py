"""Pydantic 数据模型 —— 前后端接口契约。"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional


class StyleDNA(BaseModel):
    """写作风格 DNA —— 可量化、可调参的风格画像。"""
    dimensions: Dict[str, int] = Field(default_factory=dict)
    generationDimensions: Dict[str, int] = Field(default_factory=dict)
    writingStyle: str = ""
    targetAudience: str = ""
    keywords: List[str] = Field(default_factory=list)
    keywordCounts: Dict[str, int] = Field(default_factory=dict)
    sceneKeywords: Dict[str, List[str]] = Field(default_factory=dict)
    sampleCount: int = 0
    sampleHashes: List[str] = Field(default_factory=list)
    sampleSourceHashes: List[str] = Field(default_factory=list)
    status: str = "untrained"
    confidence: str = "待建立"
    lastSampleSummary: str = ""
    lastEvidence: Dict[str, str] = Field(default_factory=dict)


class Habits(BaseModel):
    """个人习惯 —— 作为 AI 个性化的隐含条件。"""
    nickname: str = "小伙伴"
    contentStyle: str = "实用干货"
    tone: str = "亲切学姐"
    shootCondition: str = "手机随手拍"
    activeTime: str = "夜猫型"
    personality: str = "外向爱分享"
    interests: str = "美食、校园生活"
    extraNote: str = ""
    styleDNA: StyleDNA = Field(default_factory=StyleDNA)


class AccountProfile(BaseModel):
    """账号画像 —— 成长陪伴型 agent 的主体。"""
    platform: str = "小红书"
    accountName: str = "小悠的探店日记"
    contentDirection: str = "校园探店"
    targetAudience: str = "学生党"
    valueProposition: str = "真实体验"
    currentFans: int = 320
    targetFans: int = 2000
    targetDays: int = 30
    postFreq: str = "每周2-3条"
    avgViews: int = 800
    avgInteraction: int = 35
    newFans30d: int = 0
    sustainableTopics: str = "2-3个"
    habits: Habits = Field(default_factory=Habits)

    def style_dna_text(self) -> str:
        """风格 DNA 注入文本,供 AI prompt 使用。"""
        style_dna = self.habits.styleDNA
        if style_dna.sampleCount <= 0 or not style_dna.dimensions:
            return (
                "写作风格DNA:尚未建立,不要推测六维分数\n"
                f"首次创作仅参考用户主动选择的偏好:{self.habits.contentStyle}/{self.habits.tone}\n"
                f"目标受众:{self.targetAudience}"
            )
        d = style_dna.dimensions
        dims_str = "/".join(f"{k}{v}" for k, v in d.items())
        lines = [
            f"写作风格DNA(请严格匹配这个调性):{dims_str}",
            f"写作风格描述:{style_dna.writingStyle}",
            f"样本数量:{style_dna.sampleCount},可信度:{style_dna.confidence}",
            f"目标受众:{self.targetAudience}",
            f"高频关键词:{', '.join(style_dna.keywords)}",
        ]
        if style_dna.generationDimensions:
            targets = "/".join(f"{k}{v}" for k, v in style_dna.generationDimensions.items())
            lines.append(f"本次生成调性目标(只影响生成,不代表样本画像):{targets}")
        return "\n".join(lines)

    def habits_text(self) -> str:
        """把个人习惯格式化为可读文本,供 AI prompt 注入。"""
        h = self.habits
        lines = [
            f"用户昵称(请用这个称呼ta):{h.nickname}",
            f"内容风格偏好:{h.contentStyle}",
            f"说话口吻/人设:{h.tone}",
            f"拍摄条件:{h.shootCondition}",
            f"活跃时段:{h.activeTime}",
            f"性格特点:{h.personality}",
            f"擅长领域/兴趣:{h.interests}",
            self.style_dna_text(),
        ]
        if h.extraNote:
            lines.append(f"用户补充:{h.extraNote}")
        return "\n".join(lines)

    def base_text(self) -> str:
        """账号基础信息文本。"""
        return (
            f"平台:{self.platform}\n账号名称:{self.accountName}\n内容方向:{self.contentDirection}\n"
            f"当前粉丝:{self.currentFans}\n目标粉丝:{self.targetFans}\n目标周期:{self.targetDays}天\n"
            f"发布频率:{self.postFreq}\n近期平均播放:{self.avgViews}\n近期平均互动:{self.avgInteraction}"
        )

    def diagnosis_text(self) -> str:
        """五维诊断专用信息，不改变其它内容生成模块的上下文。"""
        return (
            f"平台:{self.platform}\n内容方向:{self.contentDirection}\n"
            f"目标受众:{self.targetAudience}\n核心关注理由:{self.valueProposition}\n"
            f"当前粉丝:{self.currentFans}\n近10条平均播放:{self.avgViews}\n"
            f"近10条平均互动:{self.avgInteraction}\n近30天新增粉丝:{self.newFans30d}\n"
            f"近30天实际更新频率:{self.postFreq}\n可持续主题数量:{self.sustainableTopics}\n"
            f"制作条件:{self.habits.shootCondition}\n目标粉丝:{self.targetFans}\n目标周期:{self.targetDays}天"
        )


class DiagnoseRequest(BaseModel):
    profile: AccountProfile


class GrowthPlanRequest(BaseModel):
    profile: AccountProfile


class ContentRequest(BaseModel):
    topic: str
    profile: AccountProfile


class ReviewRequest(BaseModel):
    profile: AccountProfile
    contentTitle: str = ""


class StyleAnalyzeRequest(BaseModel):
    """风格分析请求 —— AI 分析用户写的内容,输出风格 DNA 维度分数。"""
    content: str
    platform: str = "小红书"
    currentDNA: Optional[dict] = None
