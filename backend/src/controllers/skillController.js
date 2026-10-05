// 技能图谱控制器
const { prepare } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const agentService = require('../services/agentService');

// 技能差距分析
const gap = async (req, res) => {
  const userId = req.userId;

  // 获取用户最新简历的技能
  const latestResume = prepare(
    'SELECT parsed_data FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(userId);

  let userSkills = [];
  if (latestResume && latestResume.parsed_data) {
    try {
      const parsed = JSON.parse(latestResume.parsed_data);
      userSkills = parsed.skills || [];
    } catch (e) {
      userSkills = [];
    }
  }

  if (userSkills.length === 0) {
    return errorResponse(res, '请先上传简历以提取技能', 400);
  }

  // 汇总所有岗位的技能要求作为目标技能
  const jobs = prepare('SELECT requirements FROM jobs').all();
  let targetSkills = new Set();
  jobs.forEach(job => {
    if (job.requirements) {
      try {
        const reqs = JSON.parse(job.requirements);
        reqs.forEach(r => targetSkills.add(r));
      } catch (e) {}
    }
  });

  if (targetSkills.size === 0) {
    return errorResponse(res, '暂无岗位数据可供分析', 400);
  }

  targetSkills = Array.from(targetSkills);

  // 调用 Agent 分析差距
  const gapData = await agentService.analyzeSkillGap(userSkills, targetSkills);

  if (!gapData) {
    return errorResponse(res, '技能分析失败', 500);
  }

  return successResponse(res, {
    user_skills: userSkills,
    target_skills: targetSkills,
    ...gapData,
  });
};

// 学习路径推荐
const learningPath = async (req, res) => {
  const userId = req.userId;

  // 获取用户技能
  const latestResume = prepare(
    'SELECT parsed_data FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(userId);

  let userSkills = [];
  if (latestResume && latestResume.parsed_data) {
    try {
      const parsed = JSON.parse(latestResume.parsed_data);
      userSkills = parsed.skills || [];
    } catch (e) {
      userSkills = [];
    }
  }

  // 获取目标技能
  const jobs = prepare('SELECT requirements FROM jobs').all();
  let targetSkills = new Set();
  jobs.forEach(job => {
    if (job.requirements) {
      try {
        const reqs = JSON.parse(job.requirements);
        reqs.forEach(r => targetSkills.add(r));
      } catch (e) {}
    }
  });

  targetSkills = Array.from(targetSkills);

  if (userSkills.length === 0 || targetSkills.length === 0) {
    return errorResponse(res, '请先上传简历并确保有岗位数据', 400);
  }

  // 调用 Agent 生成学习路径
  const pathData = await agentService.getLearningPath(userSkills, targetSkills);

  if (!pathData) {
    return errorResponse(res, '学习路径生成失败', 500);
  }

  return successResponse(res, pathData);
};

module.exports = { gap, learningPath };
