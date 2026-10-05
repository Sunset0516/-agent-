"""
Agent 服务入口 (FastAPI)
提供 Agent 调用的 HTTP API
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

load_dotenv()

from orchestrator import orchestrator

app = FastAPI(
    title="求职助手 Agent 服务",
    description="多 Agent 智能求职平台 - Agent 编排服务",
    version="1.0.0",
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== 请求/响应模型 =====
class ResumeAnalyzeRequest(BaseModel):
    content: str


class JobMatchRequest(BaseModel):
    skills: List[str]
    jobs: List[Dict[str, Any]]


class TrackAnalyzeRequest(BaseModel):
    applications: List[Dict[str, Any]]
    action: Optional[str] = "analyze"


class InterviewGenerateRequest(BaseModel):
    job_title: str = ""
    requirements: List[str] = []
    count: int = 5


class InterviewEvaluateRequest(BaseModel):
    question: str
    answer: str
    type: str = "technical"


class SkillGapRequest(BaseModel):
    user_skills: List[str]
    target_skills: List[str]


class AgentDispatchRequest(BaseModel):
    agent_name: str
    input_data: Dict[str, Any]


# ===== 路由 =====
@app.get("/")
async def root():
    return {
        "success": True,
        "message": "Agent 服务运行正常",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {"success": True, "message": "OK"}


@app.get("/agents")
async def list_agents():
    """列出所有可用的 Agent"""
    return {
        "success": True,
        "data": orchestrator.list_agents(),
    }


@app.post("/agent/dispatch")
async def dispatch_agent(request: AgentDispatchRequest):
    """通用 Agent 分发接口"""
    result = await orchestrator.dispatch(request.agent_name, request.input_data)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/resume/analyze")
async def analyze_resume(request: ResumeAnalyzeRequest):
    """简历分析接口"""
    result = await orchestrator.dispatch("ResumeAgent", {"content": request.content})
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/jobs/match")
async def match_jobs(request: JobMatchRequest):
    """岗位匹配接口"""
    result = await orchestrator.dispatch(
        "JobMatchAgent",
        {"skills": request.skills, "jobs": request.jobs},
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/track/analyze")
async def track_analyze(request: TrackAnalyzeRequest):
    """投递跟踪分析接口"""
    result = await orchestrator.dispatch(
        "TrackAgent",
        {"applications": request.applications, "action": request.action},
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/interview/generate")
async def interview_generate(request: InterviewGenerateRequest):
    """生成面试题接口"""
    result = await orchestrator.dispatch(
        "InterviewAgent",
        {
            "action": "generate",
            "job_title": request.job_title,
            "requirements": request.requirements,
            "count": request.count,
        },
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/interview/evaluate")
async def interview_evaluate(request: InterviewEvaluateRequest):
    """评估回答接口"""
    result = await orchestrator.dispatch(
        "InterviewAgent",
        {
            "action": "evaluate",
            "question": request.question,
            "answer": request.answer,
            "type": request.type,
        },
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/skills/gap")
async def skills_gap(request: SkillGapRequest):
    """技能差距分析接口"""
    result = await orchestrator.dispatch(
        "SkillAgent",
        {
            "action": "gap_analysis",
            "user_skills": request.user_skills,
            "target_skills": request.target_skills,
        },
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/skills/learning-path")
async def skills_learning_path(request: SkillGapRequest):
    """学习路径推荐接口"""
    result = await orchestrator.dispatch(
        "SkillAgent",
        {
            "action": "learning_path",
            "user_skills": request.user_skills,
            "target_skills": request.target_skills,
        },
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AGENT_PORT", 5000))
    print(f"\n🤖 Agent 服务启动中...")
    print(f"📡 服务地址: http://localhost:{port}")
    print(f"📊 健康检查: http://localhost:{port}/health")
    print(f"📋 可用 Agent: {list(orchestrator.agents.keys())}\n")

    uvicorn.run(app, host="0.0.0.0", port=port)
