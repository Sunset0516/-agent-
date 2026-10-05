"""
LLM 服务封装
支持两种模式：
1. API 模式：调用大模型 API（需配置 API_KEY）
2. 降级模式：基于规则的本地处理（无需 API）
"""
import os
import json
import re
from typing import Optional


class LLMService:
    """LLM 调用服务"""

    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.api_url = os.getenv("LLM_API_URL", "")
        self.api_model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.enabled = bool(self.api_key and self.api_url)

    async def chat(self, prompt: str, system_prompt: str = "你是一个专业的求职助手。") -> Optional[str]:
        """
        调用 LLM 对话

        Args:
            prompt: 用户提示词
            system_prompt: 系统提示词

        Returns:
            LLM 回复文本，失败返回 None
        """
        if not self.enabled:
            return None

        try:
            import httpx

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": self.api_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.api_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[LLMService] 调用失败: {e}")
            return None

    async def chat_json(self, prompt: str, system_prompt: str = "你是一个专业的求职助手。") -> Optional[dict]:
        """
        调用 LLM 并解析 JSON 响应

        Args:
            prompt: 用户提示词
            system_prompt: 系统提示词

        Returns:
            解析后的 JSON 字典，失败返回 None
        """
        response = await self.chat(prompt, system_prompt)
        if not response:
            return None

        # 尝试提取 JSON
        try:
            # 清理可能的 markdown 代码块标记
            cleaned = re.sub(r"```json\s*", "", response)
            cleaned = re.sub(r"```\s*$", "", cleaned)
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            # 尝试从文本中提取 JSON 对象
            match = re.search(r"\{[\s\S]*\}", response)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
            return None


# 全局单例
llm_service = LLMService()
