"""
岗位匹配 Agent
功能：根据简历技能和岗位要求，计算匹配度并排序
"""
from typing import Any, Dict, List
from .base_agent import BaseAgent


class JobMatchAgent(BaseAgent):
    """岗位匹配 Agent"""

    def __init__(self):
        super().__init__(
            name="JobMatchAgent",
            description="根据简历技能与岗位要求的匹配度，智能推荐最合适的岗位",
        )

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        resume_skills = input_data.get("skills", [])
        jobs = input_data.get("jobs", [])

        if not jobs:
            return {"success": False, "message": "岗位列表不能为空"}

        # 计算每个岗位的匹配度
        matched_jobs = []
        for job in jobs:
            match_result = self._calculate_match(resume_skills, job)
            matched_jobs.append({
                **job,
                "match_score": match_result["score"],
                "matched_skills": match_result["matched"],
                "missing_skills": match_result["missing"],
            })

        # 按匹配度降序排序
        matched_jobs.sort(key=lambda x: x["match_score"], reverse=True)

        return {
            "success": True,
            "data": {
                "jobs": matched_jobs,
                "total": len(matched_jobs),
            },
        }

    def _calculate_match(self, resume_skills: List[str], job: Dict) -> Dict:
        """
        计算单个岗位的匹配度

        评分维度：
        - 技能匹配 (50分)：Jaccard 相似度
        - 经验匹配 (25分)：根据简历内容长度估算
        - 地点匹配 (15分)：是否匹配期望城市
        - 学历匹配 (10分)：是否满足学历要求
        """
        job_requirements = job.get("requirements", [])
        if isinstance(job_requirements, str):
            try:
                import json
                job_requirements = json.loads(job_requirements)
            except Exception:
                job_requirements = [job_requirements]

        # 技能匹配度 (Jaccard 相似度 * 50)
        resume_set = set(s.lower() for s in resume_skills)
        job_set = set(s.lower() for s in job_requirements)

        if not job_set:
            skill_score = 25  # 无明确要求时给中等分
            matched = []
            missing = []
        else:
            intersection = resume_set & job_set
            union = resume_set | job_set
            jaccard = len(intersection) / len(union) if union else 0
            skill_score = round(jaccard * 50, 1)
            matched = list(intersection)
            missing = list(job_set - resume_set)

        # 经验匹配 (25分)：暂时根据技能数量估算
        exp_score = min(len(resume_skills) * 2, 25)

        # 地点匹配 (15分)：暂给满分，后续可接入用户期望城市
        location_score = 15

        # 学历匹配 (10分)：暂给满分
        education_score = 10

        total_score = round(skill_score + exp_score + location_score + education_score, 1)

        return {
            "score": total_score,
            "matched": matched,
            "missing": missing,
        }
