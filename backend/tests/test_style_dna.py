import unittest
from unittest.mock import patch

from routers.workshop import StyleAnalyzeRequest, WorkshopGenRequest, analyze_style, generate
from schemas import AccountProfile, Habits, StyleDNA


class StyleDNAContractTests(unittest.TestCase):
    def test_default_profile_does_not_claim_learned_dimensions(self):
        profile = AccountProfile()

        self.assertEqual(profile.habits.styleDNA.sampleCount, 0)
        self.assertEqual(profile.habits.styleDNA.dimensions, {})
        self.assertIn("尚未建立", profile.style_dna_text())
        self.assertNotIn("幽默50", profile.style_dna_text())

    def test_trained_profile_includes_sample_context_and_generation_target(self):
        style_dna = StyleDNA(
            dimensions={"幽默": 55, "情绪": 70, "专业": 65, "亲和": 80, "犀利": 35, "网感": 60},
            generationDimensions={"幽默": 70},
            writingStyle="亲切自然",
            sampleCount=3,
            confidence="中",
        )
        profile = AccountProfile(habits=Habits(styleDNA=style_dna))
        context = profile.style_dna_text()

        self.assertIn("样本数量:3", context)
        self.assertIn("幽默55", context)
        self.assertIn("生成调性目标", context)
        self.assertIn("幽默70", context)

    @patch("routers.workshop.volcengine_client.generate_images", return_value=[])
    @patch("routers.workshop.volcengine_client.build_cover_prompts", return_value=[])
    @patch("routers.workshop.deepseek_client.chat_json")
    def test_workshop_does_not_inject_untrained_default_scores(self, chat_json, _build_prompts, _generate_images):
        chat_json.return_value = {"body": "正文", "cover": {}, "hashtags": [], "comments": {}}
        request = WorkshopGenRequest(
            title="测试标题",
            profile={
                "targetAudience": "学生党",
                "habits": {
                    "contentStyle": "实用干货",
                    "tone": "亲切学姐",
                    "styleDNA": {
                        "sampleCount": 0,
                        "dimensions": {"幽默": 99},
                    },
                },
            },
        )

        generate(request)
        user_prompt = chat_json.call_args.args[1]

        self.assertIn("尚未形成样本画像", user_prompt)
        self.assertIn("目标受众:学生党", user_prompt)
        self.assertNotIn("幽默99", user_prompt)

    @patch("routers.workshop.deepseek_client.chat_json")
    def test_single_sample_analysis_does_not_read_historical_scores(self, chat_json):
        chat_json.return_value = {
            "dimensions": {"幽默": 50, "情绪": 60, "专业": 70, "亲和": 80, "犀利": 30, "网感": 55},
            "keywords": ["真实"],
            "evidence": {},
            "summary": "测试风格",
        }
        request = StyleAnalyzeRequest(
            content="这是一篇用户确认过的定稿",
            currentDNA={"dimensions": {"幽默": 99}},
        )

        result = analyze_style(request)
        user_prompt = chat_json.call_args.args[1]

        self.assertNotIn("幽默99", user_prompt)
        self.assertEqual(result["dimensions"]["亲和"], 80)
        self.assertEqual(set(result["evidence"]), {"幽默", "情绪", "专业", "亲和", "犀利", "网感"})


if __name__ == "__main__":
    unittest.main()
