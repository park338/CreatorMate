"""AI 诊断路由。"""
import json

from fastapi import APIRouter

from schemas import DiagnoseRequest
from services import deepseek_client, prompts
from services.diagnosis_scoring import build_diagnosis

router = APIRouter()


@router.post("/api/diagnose")
def diagnose(req: DiagnoseRequest):
    p = req.profile
    baseline = build_diagnosis(p)
    user_prompt = (
        f"请解释以下已经由规则引擎计算好的五维诊断。\n\n"
        f"【诊断输入】\n{p.diagnosis_text()}\n\n"
        f"【个人习惯】(作为个性化诊断的隐含条件,诊断说明和建议要结合这些习惯)\n{p.habits_text()}\n\n"
        f"【不可修改的评分结果】\n{json.dumps(baseline, ensure_ascii=False)}\n\n"
        f"{prompts.DIAGNOSE_FMT}"
    )
    try:
        ai_result = deepseek_client.chat_json(
            prompts.DIAGNOSE_ROLE,
            user_prompt,
            temperature=0.2,
            model=deepseek_client.DIAGNOSE_MODEL,
        )
        descriptions = {
            item.get("key"): item.get("desc", "").strip()
            for item in ai_result.get("dimensions", [])
            if isinstance(item, dict) and isinstance(item.get("desc"), str)
        }
        for dimension in baseline["dimensions"]:
            if dimension["score"] is not None and descriptions.get(dimension["key"]):
                dimension["desc"] = descriptions[dimension["key"]]

        summary = ai_result.get("summary")
        has_pending_dimension = any(
            dimension["score"] is None for dimension in baseline["dimensions"]
        )
        if not has_pending_dimension and isinstance(summary, str) and summary.strip():
            baseline["summary"] = summary.strip()

        ai_priorities = {
            item.get("dimensionKey"): item
            for item in ai_result.get("priorities", [])
            if isinstance(item, dict) and isinstance(item.get("dimensionKey"), str)
        }
        for priority in baseline["priorities"]:
            item = ai_priorities.get(priority["dimensionKey"])
            if not item:
                continue
            action = str(item.get("action", "")).strip()
            reason = str(item.get("reason", "")).strip()
            expected = str(item.get("expected", "")).strip()
            if action and reason and expected:
                priority.update(action=action, reason=reason, expected=expected)

        baseline["source"] = "ai"
        baseline["scoringSource"] = "rules"
        baseline["model"] = deepseek_client.DIAGNOSE_MODEL
        return baseline
    except Exception as e:
        baseline["source"] = "rules"
        baseline["scoringSource"] = "rules"
        baseline["error"] = str(e)
        return baseline
