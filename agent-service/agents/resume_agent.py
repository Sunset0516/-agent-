"""
简历分析 Agent
功能：解析简历、多维度评分、给出优化建议
"""
import re
from typing import Any, Dict, List, Optional
from .base_agent import BaseAgent
from .llm_service import llm_service


class ResumeAgent(BaseAgent):
    """简历分析 Agent"""

    def __init__(self):
        super().__init__(
            name="ResumeAgent",
            description="解析简历内容，提取结构化信息，进行多维度评分并给出优化建议",
        )
        # 常见技能关键词
        self.skill_keywords = [
            "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust",
            "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring",
            "React", "Vue", "Angular", "Next.js",
            "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle",
            "Docker", "Kubernetes", "Linux", "Git", "Nginx",
            "机器学习", "深度学习", "LLM", "Agent", "Prompt", "NLP", "CV",
            "TensorFlow", "PyTorch", "LangChain",
            "HTML", "CSS", "Sass", "Webpack",
            "RESTful", "GraphQL", "WebSocket",
            "AWS", "阿里云", "腾讯云",
            "数据分析", "数据可视化", "Excel", "SQL",
        ]

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        content = input_data.get("content", "")
        if not content:
            return {"success": False, "message": "简历内容不能为空"}

        # 优先使用 LLM 解析，失败则使用规则引擎
        parsed_data = await self._parse_with_llm(content)
        if not parsed_data:
            parsed_data = self._parse_with_rules(content)

        # 评分
        score = self._calculate_score(content, parsed_data)

        # 优化建议
        suggestions = self._generate_suggestions(content, parsed_data, score)

        return {
            "success": True,
            "data": {
                "parsed_data": parsed_data,
                "score": score,
                "suggestions": suggestions,
            },
        }

    async def _parse_with_llm(self, content: str) -> Optional[Dict]:
        """使用 LLM 解析简历"""
        prompt = f"""请解析以下简历内容，提取结构化信息，以 JSON 格式返回。

要求：
1. personal_info: 姓名、邮箱、电话
2. education: 教育经历数组，包含学校、专业、学历、起止时间
3. skills: 技能列表（数组）
4. projects: 项目经历数组，包含项目名、描述、技术栈、角色
5. experience: 工作/实习经历数组
6. summary: 个人简介

简历内容：
{content[:3000]}

只返回 JSON，不要其他文字。"""

        system_prompt = "你是一个专业的简历解析助手，擅长从文本中提取结构化信息。"

        result = await llm_service.chat_json(prompt, system_prompt)
        if result and isinstance(result, dict):
            return result
        return None

    def _parse_with_rules(self, content: str) -> Dict:
        """基于规则的简历解析（降级方案）"""
        parsed = {
            "personal_info": self._extract_personal_info(content),
            "education": self._extract_education(content),
            "skills": self._extract_skills(content),
            "projects": self._extract_projects(content),
            "experience": self._extract_experience(content),
            "summary": self._extract_summary(content),
        }
        return parsed

    def _extract_personal_info(self, content: str) -> Dict:
        """提取个人信息"""
        info = {}

        # 邮箱
        email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", content)
        if email_match:
            info["email"] = email_match.group()

        # 电话
        phone_match = re.search(r"1[3-9]\d{9}", content)
        if phone_match:
            info["phone"] = phone_match.group()

        # 姓名（取第一行非空内容作为候选）
        lines = [l.strip() for l in content.split("\n") if l.strip()]
        if lines:
            first_line = lines[0]
            if len(first_line) <= 10 and not re.search(r"[@\d]", first_line):
                info["name"] = first_line

        return info

    def _extract_education(self, content: str) -> List[Dict]:
        """提取教育经历"""
        education = []
        # 匹配 "学校 + 专业" 模式
        edu_patterns = [
            r"([\u4e00-\u9fa5]{2,20}大学)\s*([\u4e00-\u9fa5]{2,15}学院)?\s*([\u4e00-\u9fa5]{2,15}专业)?",
            r"([\u4e00-\u9fa5]{2,20}学院)\s*([\u4e00-\u9fa5]{2,15}专业)?",
        ]
        for pattern in edu_patterns:
            matches = re.finditer(pattern, content)
            for m in matches:
                edu = {"school": m.group(1)}
                if m.group(2):
                    edu["major"] = m.group(2)
                if m.group(3):
                    edu["major"] = m.group(3)
                education.append(edu)

        # 提取学历
        degrees = ["博士", "硕士", "本科", "大专", "高中"]
        for deg in degrees:
            if deg in content:
                if education:
                    education[0]["degree"] = deg
                break

        return education[:3]  # 最多返回3条

    def _extract_skills(self, content: str) -> List[str]:
        """提取技能"""
        skills = []
        content_lower = content.lower()
        for skill in self.skill_keywords:
            if skill.lower() in content_lower and skill not in skills:
                skills.append(skill)
        return skills

    def _extract_projects(self, content: str) -> List[Dict]:
        """提取项目经历"""
        projects = []
        # 简单匹配 "项目名称：xxx" 模式
        project_patterns = [
            r"项目[名称]*[：:]\s*([^\n]+)",
            r"项目[：:]\s*([^\n]+)",
        ]
        for pattern in project_patterns:
            matches = re.finditer(pattern, content)
            for m in matches:
                projects.append({"name": m.group(1).strip()})
        return projects[:5]

    def _extract_experience(self, content: str) -> List[Dict]:
        """提取工作/实习经历"""
        experience = []
        patterns = [
            r"(实习经历|工作经历|项目经历)[\s\S]{0,500}",
        ]
        return experience

    def _extract_summary(self, content: str) -> str:
        """提取个人简介"""
        summary = ""
        patterns = [
            r"(个人简介|自我介绍|个人评价)[：:]\s*([^\n]+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                summary = match.group(2).strip()
                break
        return summary

    def _calculate_score(self, content: str, parsed: Dict) -> Dict:
        """计算简历评分（多维度）"""
        scores = {}

        # 1. 内容完整性 (25分)
        completeness = 0
        if parsed.get("personal_info", {}).get("name"):
            completeness += 5
        if parsed.get("personal_info", {}).get("email"):
            completeness += 5
        if parsed.get("education"):
            completeness += 5
        if parsed.get("skills"):
            completeness += 5
        if parsed.get("projects") or parsed.get("experience"):
            completeness += 5
        scores["completeness"] = completeness

        # 2. 技能丰富度 (30分)
        skills = parsed.get("skills", [])
        skill_score = min(len(skills) * 3, 30)
        scores["skills"] = skill_score

        # 3. 量化描述 (20分)
        # 检查是否有数字、百分比等量化描述
        quantified = len(re.findall(r"\d+%|\d+倍|\d+个|\d+次|\d+万|\d+天", content))
        quant_score = min(quantified * 4, 20)
        scores["quantification"] = quant_score

        # 4. 排版规范 (15分)
        # 检查是否有合理的分段和标题
        lines = [l for l in content.split("\n") if l.strip()]
        has_structure = any(kw in content for kw in ["教育", "技能", "项目", "经历", "简介"])
        structure_score = 15 if has_structure and len(lines) > 10 else 8
        scores["structure"] = structure_score

        # 5. 关键词覆盖 (10分)
        total_score = sum(scores.values())
        scores["total"] = round(total_score, 1)

        return scores

    def _generate_suggestions(self, content: str, parsed: Dict, score: Dict) -> List[str]:
        """生成优化建议"""
        suggestions = []

        # 内容完整性建议
        if not parsed.get("personal_info", {}).get("name"):
            suggestions.append("建议在简历开头明确标注姓名")
        if not parsed.get("personal_info", {}).get("email"):
            suggestions.append("请确保简历中包含有效的联系方式（邮箱/电话）")
        if not parsed.get("education"):
            suggestions.append("建议补充教育经历，包括学校、专业、学历和时间")
        if not parsed.get("skills"):
            suggestions.append("建议添加技能列表，突出你的核心技术能力")

        # 技能建议
        skills = parsed.get("skills", [])
        if len(skills) < 3:
            suggestions.append("技能较少，建议补充相关技术栈，如编程语言、框架、工具等")

        # 量化描述建议
        if score.get("quantification", 0) < 10:
            suggestions.append("建议在项目/经历中加入量化数据，如'提升性能50%'、'服务10万用户'等")

        # 结构建议
        if score.get("structure", 0) < 12:
            suggestions.append("建议使用清晰的分节标题（教育经历、技能、项目经历等），便于阅读")

        # 内容长度建议
        if len(content) < 300:
            suggestions.append("简历内容较短，建议补充项目细节和个人贡献")

        if not suggestions:
            suggestions.append("简历整体质量不错，继续保持！")

        return suggestions
