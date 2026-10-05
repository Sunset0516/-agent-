"""
Agent 协调器
负责注册、管理和分发任务给各个专业 Agent
"""
from typing import Any, Dict, Optional
from agents.base_agent import BaseAgent
from agents.resume_agent import ResumeAgent
from agents.job_match_agent import JobMatchAgent
from agents.track_agent import TrackAgent
from agents.interview_agent import InterviewAgent
from agents.skill_agent import SkillAgent


class Orchestrator:
    """Agent 协调器"""

    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self._register_default_agents()

    def _register_default_agents(self):
        """注册默认 Agent"""
        self.register(ResumeAgent())
        self.register(JobMatchAgent())
        self.register(TrackAgent())
        self.register(InterviewAgent())
        self.register(SkillAgent())

    def register(self, agent: BaseAgent):
        """注册一个 Agent"""
        self.agents[agent.name] = agent

    def get_agent(self, name: str) -> Optional[BaseAgent]:
        """获取指定 Agent"""
        return self.agents.get(name)

    def list_agents(self) -> Dict[str, Dict[str, str]]:
        """列出所有已注册的 Agent"""
        return {name: agent.get_info() for name, agent in self.agents.items()}

    async def dispatch(self, agent_name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        分发任务到指定 Agent

        Args:
            agent_name: Agent 名称
            input_data: 输入数据

        Returns:
            Agent 执行结果
        """
        agent = self.get_agent(agent_name)
        if not agent:
            return {
                "success": False,
                "message": f"未找到 Agent: {agent_name}",
                "available_agents": list(self.agents.keys()),
            }

        try:
            result = await agent.run(input_data)
            return result
        except Exception as e:
            return {
                "success": False,
                "message": f"Agent 执行失败: {str(e)}",
            }


# 全局单例
orchestrator = Orchestrator()
