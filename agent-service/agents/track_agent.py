"""
投递跟踪 Agent
功能：分析投递记录，生成提醒，计算投递统计
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List
from .base_agent import BaseAgent


class TrackAgent(BaseAgent):
    """投递跟踪 Agent"""

    def __init__(self):
        super().__init__(
            name="TrackAgent",
            description="分析投递记录，生成跟进提醒，提供投递统计与时间线",
        )
        # 提醒规则
        self.reminder_rules = {
            "no_reply_days": 5,       # 投递后 N 天未回复提醒
            "interview_remind_days": 1,  # 面试前 N 天提醒
            "offer_confirm_days": 3,     # Offer 后 N 天未确认提醒
        }
        # 状态映射
        self.status_map = {
            "pending": "待投递",
            "applied": "已投递",
            "interview": "面试中",
            "offer": "已 Offer",
            "rejected": "已拒绝",
        }

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        applications = input_data.get("applications", [])
        action = input_data.get("action", "analyze")

        if action == "analyze":
            return self._analyze(applications)
        elif action == "reminders":
            return self._generate_reminders(applications)
        elif action == "timeline":
            return self._build_timeline(applications)
        else:
            return {
                "success": True,
                "data": {
                    "stats": self._calc_stats(applications),
                    "reminders": self._generate_reminders_list(applications),
                },
            }

    def _analyze(self, applications: List[Dict]) -> Dict:
        """综合分析投递情况"""
        return {
            "success": True,
            "data": {
                "stats": self._calc_stats(applications),
                "reminders": self._generate_reminders_list(applications),
                "timeline": self._build_timeline_data(applications),
            },
        }

    def _calc_stats(self, applications: List[Dict]) -> Dict:
        """计算投递统计"""
        total = len(applications)
        status_counts = {}
        for app in applications:
            status = app.get("status", "pending")
            status_counts[status] = status_counts.get(status, 0) + 1

        # 计算回复率（已投递及以后的状态视为有回复）
        replied = sum(v for k, v in status_counts.items() if k in ["applied", "interview", "offer"])
        reply_rate = round((replied / total * 100), 1) if total > 0 else 0

        # 面试率
        interviewing = status_counts.get("interview", 0)
        interview_rate = round((interviewing / total * 100), 1) if total > 0 else 0

        # Offer 率
        offers = status_counts.get("offer", 0)
        offer_rate = round((offers / total * 100), 1) if total > 0 else 0

        return {
            "total": total,
            "status_counts": status_counts,
            "reply_rate": reply_rate,
            "interview_rate": interview_rate,
            "offer_rate": offer_rate,
        }

    def _generate_reminders_list(self, applications: List[Dict]) -> List[Dict]:
        """生成提醒列表"""
        reminders = []
        now = datetime.now()

        for app in applications:
            status = app.get("status", "pending")
            applied_date_str = app.get("applied_date") or app.get("created_at", "")

            if not applied_date_str:
                continue

            try:
                applied_date = datetime.fromisoformat(applied_date_str.replace("Z", ""))
            except (ValueError, TypeError):
                continue

            days_since = (now - applied_date).days

            # 规则1：投递后 N 天未回复
            if status == "applied" and days_since >= self.reminder_rules["no_reply_days"]:
                reminders.append({
                    "type": "no_reply",
                    "application_id": app.get("id"),
                    "job_title": app.get("job_title", "未知岗位"),
                    "message": f"「{app.get('job_title', '该岗位')}」已投递 {days_since} 天未收到回复，建议主动跟进",
                    "days": days_since,
                    "level": "warning",
                })

            # 规则2：面试中状态提醒准备
            if status == "interview":
                reminders.append({
                    "type": "interview_prep",
                    "application_id": app.get("id"),
                    "job_title": app.get("job_title", "未知岗位"),
                    "message": f"「{app.get('job_title', '该岗位')}」正在面试中，请做好准备",
                    "level": "info",
                })

            # 规则3：Offer 确认提醒
            if status == "offer" and days_since >= self.reminder_rules["offer_confirm_days"]:
                reminders.append({
                    "type": "offer_confirm",
                    "application_id": app.get("id"),
                    "job_title": app.get("job_title", "未知岗位"),
                    "message": f"「{app.get('job_title', '该岗位')}」已收到 Offer {days_since} 天，请尽快确认",
                    "days": days_since,
                    "level": "success",
                })

        # 按级别排序：warning > success > info
        level_order = {"warning": 0, "success": 1, "info": 2}
        reminders.sort(key=lambda x: level_order.get(x["level"], 9))

        return reminders

    def _build_timeline_data(self, applications: List[Dict]) -> List[Dict]:
        """构建时间线数据"""
        timeline = []
        for app in applications:
            timeline.append({
                "id": app.get("id"),
                "job_title": app.get("job_title", "未知岗位"),
                "company": app.get("company", ""),
                "status": app.get("status", "pending"),
                "status_label": self.status_map.get(app.get("status", "pending"), "未知"),
                "applied_date": app.get("applied_date") or app.get("created_at", ""),
                "match_score": app.get("match_score", 0),
            })

        # 按日期降序
        timeline.sort(key=lambda x: x.get("applied_date", ""), reverse=True)
        return timeline

    def _generate_reminders(self, applications: List[Dict]) -> Dict:
        """生成提醒（独立接口）"""
        reminders = self._generate_reminders_list(applications)
        return {
            "success": True,
            "data": {
                "reminders": reminders,
                "count": len(reminders),
            },
        }

    def _build_timeline(self, applications: List[Dict]) -> Dict:
        """构建时间线（独立接口）"""
        timeline = self._build_timeline_data(applications)
        return {
            "success": True,
            "data": {
                "timeline": timeline,
                "total": len(timeline),
            },
        }
