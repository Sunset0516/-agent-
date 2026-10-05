"""
基础 Agent 类
所有专业 Agent 都继承自 BaseAgent，实现统一的接口
"""
from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAgent(ABC):
    """Agent 基类"""

    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description

    @abstractmethod
    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行 Agent 任务

        Args:
            input_data: 输入数据字典

        Returns:
            输出结果字典，必须包含 success 字段
        """
        pass

    def get_info(self) -> Dict[str, str]:
        """获取 Agent 信息"""
        return {
            "name": self.name,
            "description": self.description,
        }
