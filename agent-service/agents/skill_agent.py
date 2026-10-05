"""
技能图谱 Agent
功能：分析技能差距，推荐学习路径
"""
from typing import Any, Dict, List
from .base_agent import BaseAgent


class SkillAgent(BaseAgent):
    """技能图谱 Agent"""

    def __init__(self):
        super().__init__(
            name="SkillAgent",
            description="分析用户技能与目标岗位的差距，推荐学习路径",
        )
        # 学习资源库
        self.learning_resources = {
            "Python": {"level": "基础", "resources": ["Python 官方教程", "《Python 编程：从入门到实践》"], "hours": 40},
            "JavaScript": {"level": "基础", "resources": ["MDN JavaScript 指南", "《JavaScript 高级程序设计》"], "hours": 50},
            "Node.js": {"level": "进阶", "resources": ["Node.js 官方文档", "《Node.js 实战》"], "hours": 60},
            "Express": {"level": "进阶", "resources": ["Express 官方文档", "Express 实战教程"], "hours": 30},
            "React": {"level": "进阶", "resources": ["React 官方文档", "《React 设计原理》"], "hours": 60},
            "SQL": {"level": "基础", "resources": ["SQL 教程", "《SQL 必知必会》"], "hours": 30},
            "MySQL": {"level": "进阶", "resources": ["MySQL 官方文档", "《高性能 MySQL》"], "hours": 50},
            "Redis": {"level": "进阶", "resources": ["Redis 设计与实现", "Redis 实战"], "hours": 40},
            "Docker": {"level": "进阶", "resources": ["Docker 官方文档", "《Docker 技术入门与实战》"], "hours": 30},
            "Git": {"level": "基础", "resources": ["Pro Git", "Git 教程"], "hours": 20},
            "LLM": {"level": "进阶", "resources": ["大语言模型入门", "Prompt Engineering 指南"], "hours": 50},
            "Agent": {"level": "进阶", "resources": ["LangChain 文档", "AutoGen 实战"], "hours": 60},
            "机器学习": {"level": "进阶", "resources": ["吴恩达机器学习课程", "《机器学习》"], "hours": 80},
            "深度学习": {"level": "高级", "resources": ["深度学习课程", "《深度学习》"], "hours": 100},
            "HTML": {"level": "基础", "resources": ["MDN HTML 指南"], "hours": 15},
            "CSS": {"level": "基础", "resources": ["MDN CSS 指南", "CSS 揭秘"], "hours": 25},
            "FastAPI": {"level": "进阶", "resources": ["FastAPI 官方文档"], "hours": 30},
            "Django": {"level": "进阶", "resources": ["Django 官方文档", "《Django 实战》"], "hours": 60},
            "Kubernetes": {"level": "高级", "resources": ["K8s 官方文档", "《Kubernetes 实战》"], "hours": 80},
        }

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        action = input_data.get("action", "gap_analysis")

        if action == "gap_analysis":
            return self._gap_analysis(input_data)
        elif action == "learning_path":
            return self._learning_path(input_data)
        else:
            return {
                "success": True,
                "data": {
                    "gap": self._analyze_gap(input_data),
                    "path": self._build_path(input_data),
                },
            }

    def _gap_analysis(self, input_data: Dict) -> Dict:
        """技能差距分析"""
        gap = self._analyze_gap(input_data)
        return {"success": True, "data": gap}

    def _learning_path(self, input_data: Dict) -> Dict:
        """学习路径推荐"""
        path = self._build_path(input_data)
        return {"success": True, "data": path}

    def _analyze_gap(self, input_data: Dict) -> Dict:
        """分析技能差距"""
        user_skills = set(input_data.get("user_skills", []))
        target_skills = set(input_data.get("target_skills", []))

        # 已掌握技能
        mastered = user_skills & target_skills
        # 缺失技能
        missing = target_skills - user_skills
        # 额外技能（用户有但岗位没要求的）
        extra = user_skills - target_skills

        # 匹配率
        match_rate = round(len(mastered) / len(target_skills) * 100, 1) if target_skills else 0

        # 技能雷达图数据
        radar = self._build_radar(user_skills, target_skills)

        return {
            "mastered": list(mastered),
            "missing": list(missing),
            "extra": list(extra),
            "match_rate": match_rate,
            "mastered_count": len(mastered),
            "missing_count": len(missing),
            "radar": radar,
        }

    def _build_radar(self, user_skills: set, target_skills: set) -> Dict:
        """构建技能雷达图数据（按类别分组）"""
        categories = {
            "编程语言": ["Python", "Java", "JavaScript", "C++", "Go", "TypeScript"],
            "后端框架": ["Node.js", "Express", "Django", "Flask", "FastAPI", "Spring"],
            "前端框架": ["React", "Vue", "Angular", "Next.js"],
            "数据库": ["MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "SQL"],
            "运维部署": ["Docker", "Kubernetes", "Linux", "Nginx", "Git"],
            "AI/ML": ["LLM", "Agent", "机器学习", "深度学习", "NLP", "PyTorch", "TensorFlow"],
        }

        radar = {}
        for cat, skills in categories.items():
            target_in_cat = [s for s in skills if s in target_skills]
            if target_in_cat:
                mastered_in_cat = [s for s in target_in_cat if s in user_skills]
                radar[cat] = {
                    "target": len(target_in_cat),
                    "mastered": len(mastered_in_cat),
                    "rate": round(len(mastered_in_cat) / len(target_in_cat) * 100, 1),
                }

        return radar

    def _build_path(self, input_data: Dict) -> Dict:
        """构建学习路径"""
        user_skills = set(input_data.get("user_skills", []))
        target_skills = set(input_data.get("target_skills", []))
        missing = list(target_skills - user_skills)

        path_items = []
        total_hours = 0

        for skill in sorted(missing):
            resource = self.learning_resources.get(skill, {
                "level": "基础",
                "resources": ["官方文档", "在线教程"],
                "hours": 30,
            })

            hours = resource.get("hours", 30)
            total_hours += hours

            path_items.append({
                "skill": skill,
                "level": resource.get("level", "基础"),
                "resources": resource.get("resources", []),
                "estimated_hours": hours,
                "priority": self._calc_priority(skill, target_skills),
            })

        # 按优先级排序
        path_items.sort(key=lambda x: x["priority"], reverse=True)

        return {
            "path": path_items,
            "total_skills": len(path_items),
            "total_hours": total_hours,
            "estimated_weeks": round(total_hours / 20, 1),  # 假设每周20小时
        }

    def _calc_priority(self, skill: str, target_skills: set) -> int:
        """计算学习优先级"""
        # AI/Agent 相关技能优先级最高
        high_priority = ["LLM", "Agent", "机器学习", "深度学习", "NLP", "Prompt"]
        if skill in high_priority:
            return 100

        # 基础技能优先级中等
        medium_priority = ["Python", "JavaScript", "SQL", "Git", "HTML", "CSS"]
        if skill in medium_priority:
            return 70

        # 框架和工具优先级较低
        return 50
