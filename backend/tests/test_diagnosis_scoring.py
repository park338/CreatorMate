import unittest
from unittest.mock import patch

from routers.diagnose import diagnose
from schemas import AccountProfile, DiagnoseRequest
from services.diagnosis_scoring import build_diagnosis


class DiagnosisScoringTests(unittest.TestCase):
    def test_profile_with_metrics_scores_all_five_dimensions(self):
        profile = AccountProfile(
            contentDirection="校园探店",
            targetAudience="学生党",
            valueProposition="省钱避坑",
            currentFans=320,
            avgViews=800,
            avgInteraction=35,
            newFans30d=120,
            postFreq="每周2-3条",
            sustainableTopics="4-5个",
        )

        result = build_diagnosis(profile)
        scores = {item["key"]: item["score"] for item in result["dimensions"]}

        self.assertEqual(set(scores), {"positioning", "supply", "reach", "engagement", "growth"})
        self.assertTrue(all(score is not None for score in scores.values()))
        self.assertEqual(scores["reach"], 85)
        self.assertEqual(scores["engagement"], 70)
        self.assertEqual(scores["growth"], 95)

    def test_new_account_keeps_performance_dimensions_pending(self):
        result = build_diagnosis(AccountProfile(currentFans=0, avgViews=0, avgInteraction=0, newFans30d=0))
        dimensions = {item["key"]: item for item in result["dimensions"]}

        for key in ("reach", "engagement", "growth"):
            self.assertIsNone(dimensions[key]["score"])
            self.assertEqual(dimensions[key]["level"], "待评估")
            self.assertEqual(dimensions[key]["priority"], "待评估")
        self.assertEqual(result["priorities"][-1]["dimensionKey"], "data")

    def test_zero_growth_is_pending_because_zero_can_mean_untracked(self):
        result = build_diagnosis(AccountProfile(currentFans=500, avgViews=600, avgInteraction=20, newFans30d=0))
        growth = next(item for item in result["dimensions"] if item["key"] == "growth")

        self.assertIsNone(growth["score"])
        self.assertEqual(growth["confidence"], "低")

    @patch("routers.diagnose.deepseek_client.chat_json")
    def test_ai_cannot_describe_pending_dimensions_as_weaknesses(self, chat_json):
        profile = AccountProfile(currentFans=0, avgViews=0, avgInteraction=0, newFans30d=0)
        baseline = build_diagnosis(profile)
        baseline_reach = next(item for item in baseline["dimensions"] if item["key"] == "reach")
        chat_json.return_value = {
            "dimensions": [{"key": "reach", "desc": "流量触达已经证实很差"}],
            "summary": "五项表现都很差",
            "priorities": [],
        }

        result = diagnose(DiagnoseRequest(profile=profile))
        reach = next(item for item in result["dimensions"] if item["key"] == "reach")

        self.assertEqual(reach["desc"], baseline_reach["desc"])
        self.assertEqual(result["summary"], baseline["summary"])

    @patch("routers.diagnose.deepseek_client.chat_json")
    def test_ai_cannot_overwrite_rule_scores_or_priority_order(self, chat_json):
        profile = AccountProfile(currentFans=320, avgViews=800, avgInteraction=35, newFans30d=120)
        baseline = build_diagnosis(profile)
        baseline_scores = [item["score"] for item in baseline["dimensions"]]
        baseline_priority_keys = [item["dimensionKey"] for item in baseline["priorities"]]
        chat_json.return_value = {
            "dimensions": [
                {"key": "positioning", "score": 0, "level": "差", "desc": "AI只可替换这段说明"},
            ],
            "summary": "AI解释",
            "priorities": [
                {
                    "dimensionKey": baseline_priority_keys[0],
                    "action": "按规则低分项执行",
                    "reason": "保留规则排序",
                    "expected": "得到可复盘结果",
                },
                {
                    "dimensionKey": "not-allowed",
                    "action": "非法建议",
                    "reason": "非法",
                    "expected": "非法",
                },
            ],
        }

        result = diagnose(DiagnoseRequest(profile=profile))

        self.assertEqual([item["score"] for item in result["dimensions"]], baseline_scores)
        self.assertEqual([item["dimensionKey"] for item in result["priorities"]], baseline_priority_keys)
        self.assertEqual(result["dimensions"][0]["desc"], "AI只可替换这段说明")
        self.assertEqual(result["model"], "deepseek-reasoner")


if __name__ == "__main__":
    unittest.main()
