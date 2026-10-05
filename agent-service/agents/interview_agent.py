"""
面试辅导 Agent
功能：根据岗位要求生成面试题，评估用户回答
"""
import random
from typing import Any, Dict, List
from .base_agent import BaseAgent
from .llm_service import llm_service


class InterviewAgent(BaseAgent):
    """面试辅导 Agent"""

    def __init__(self):
        super().__init__(
            name="InterviewAgent",
            description="根据岗位要求生成面试题，提供模拟面试和回答评估",
        )
        # 通用行为面试题库
        self.behavioral_questions = [
            "请介绍一下你自己，以及为什么适合这个岗位？",
            "描述一次你遇到的最大挑战，你是如何解决的？",
            "你在团队合作中扮演什么角色？请举例说明。",
            "你最大的优点和缺点是什么？",
            "为什么选择我们公司？",
            "描述一次你主动学习新技术并应用到项目中的经历。",
            "如果和同事产生分歧，你会如何处理？",
            "你对未来3-5年的职业规划是什么？",
        ]

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        action = input_data.get("action", "generate")

        if action == "generate":
            return await self._generate_questions(input_data)
        elif action == "evaluate":
            return self._evaluate_answer(input_data)
        else:
            return {"success": False, "message": f"未知操作: {action}"}

    async def _generate_questions(self, input_data: Dict) -> Dict:
        """生成面试题"""
        job_title = input_data.get("job_title", "")
        requirements = input_data.get("requirements", [])
        count = input_data.get("count", 5)

        # 优先用 LLM 生成
        questions = await self._generate_with_llm(job_title, requirements, count)

        if not questions:
            # 降级：基于规则生成
            questions = self._generate_with_rules(job_title, requirements, count)

        return {
            "success": True,
            "data": {
                "questions": questions,
                "total": len(questions),
            },
        }

    async def _generate_with_llm(self, job_title: str, requirements: List[str], count: int) -> List[Dict]:
        """使用 LLM 生成面试题"""
        req_str = ", ".join(requirements) if requirements else "通用"
        prompt = f"""请为「{job_title}」岗位生成 {count} 道面试题。
岗位要求技能：{req_str}

要求：
1. 包含技术题和行为题
2. 技术题围绕岗位技能要求
3. 以 JSON 数组返回，每道题包含：question(题目), type(technical/behavioral), difficulty(easy/medium/hard)

只返回 JSON 数组。"""

        result = await llm_service.chat_json(prompt, "你是一个资深面试官，擅长根据岗位要求设计面试题。")
        if result and isinstance(result, list):
            return result
        if result and isinstance(result, dict) and "questions" in result:
            return result["questions"]
        return []

    def _generate_with_rules(self, job_title: str, requirements: List[str], count: int) -> List[Dict]:
        """基于规则生成面试题（降级方案）"""
        questions = []

        # 技术题：基于岗位要求
        for req in requirements[:count // 2 + 1]:
            questions.append({
                "question": f"请谈谈你对「{req}」的理解，以及在项目中的实际应用经验。",
                "type": "technical",
                "difficulty": "medium",
                "skill": req,
            })

        # 行为题：从题库随机抽取
        behavioral = random.sample(self.behavioral_questions, min(count - len(questions), 3))
        for q in behavioral:
            questions.append({
                "question": q,
                "type": "behavioral",
                "difficulty": "easy",
            })

        # 补充题目直到达到 count
        if len(questions) < count:
            extra_technical = [
                f"在使用相关技术时，你遇到过哪些性能问题？如何优化的？",
                f"请描述一个你最自豪的项目，你在其中承担了什么角色？",
                f"你如何保证代码质量？有哪些实践经验？",
            ]
            for q in extra_technical:
                if len(questions) >= count:
                    break
                questions.append({
                    "question": q,
                    "type": "technical",
                    "difficulty": "medium",
                })

        return questions[:count]

    def _evaluate_answer(self, input_data: Dict) -> Dict:
        """评估回答"""
        question = input_data.get("question", "")
        answer = input_data.get("answer", "")
        question_type = input_data.get("type", "technical")

        if not answer or len(answer.strip()) < 10:
            return {
                "success": True,
                "data": {
                    "score": 20,
                    "level": "needs_improvement",
                    "feedback": "回答过于简短，建议展开详细说明。",
                    "suggestions": ["补充具体的项目经历", "使用 STAR 法则组织回答"],
                },
            }

        # 基于规则的评估
        score, feedback, suggestions = self._rule_based_eval(question, answer, question_type)

        return {
            "success": True,
            "data": {
                "score": score,
                "level": self._score_to_level(score),
                "feedback": feedback,
                "suggestions": suggestions,
            },
        }

    def _rule_based_eval(self, question: str, answer: str, q_type: str) -> tuple:
        """基于规则的回答评估"""
        score = 50  # 基础分
        feedback_parts = []
        suggestions = []

        answer_len = len(answer)

        # 长度评估
        if answer_len < 50:
            score -= 15
            feedback_parts.append("回答偏短")
            suggestions.append("建议展开说明，增加细节")
        elif answer_len < 150:
            score += 5
        elif answer_len < 400:
            score += 15
            feedback_parts.append("回答长度适中")
        else:
            score += 10
            feedback_parts.append("回答较为详尽")

        # 技术题评估关键词
        if q_type == "technical":
            tech_keywords = ["实现", "原理", "架构", "性能", "优化", "经验", "项目", "使用", "解决", "问题"]
            matched = sum(1 for kw in tech_keywords if kw in answer)
            score += matched * 3
            if matched < 2:
                suggestions.append("技术题建议结合具体技术细节和项目经验回答")
            if matched >= 4:
                feedback_parts.append("技术细节充分")

        # 行为题评估（STAR 法则）
        if q_type == "behavioral":
            star_keywords = ["当时", "背景", "任务", "行动", "结果", "因为", "所以", "最后"]
            star_matched = sum(1 for kw in star_keywords if kw in answer)
            score += star_matched * 4
            if star_matched < 2:
                suggestions.append("建议使用 STAR 法则（情境-任务-行动-结果）组织回答")
            if star_matched >= 3:
                feedback_parts.append("结构清晰，符合 STAR 法则")

        # 量化描述加分
        import re
        if re.search(r"\d+%|\d+倍|\d+个|\d+次|\d+万", answer):
            score += 8
            feedback_parts.append("有量化数据支撑")

        score = min(max(score, 0), 100)
        feedback = "；".join(feedback_parts) if feedback_parts else "回答基本完整"

        return score, feedback, suggestions

    def _score_to_level(self, score: int) -> str:
        """分数转等级"""
        if score >= 80:
            return "excellent"
        elif score >= 60:
            return "good"
        elif score >= 40:
            return "average"
        else:
            return "needs_improvement"
