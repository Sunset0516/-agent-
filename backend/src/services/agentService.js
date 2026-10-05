// Agent 服务客户端 - 调用 Python Agent 服务（带缓存层）
const crypto = require('crypto');
const fetch = require('node-fetch');
const config = require('../config');

const AGENT_SERVICE_URL = config.agentServiceUrl;

// 简单内存缓存：key -> { data, expireAt }
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

function cacheKey(prefix, ...args) {
  const raw = prefix + ':' + JSON.stringify(args);
  return crypto.createHash('md5').update(raw).digest('hex');
}

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expireAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  if (data === null || data === undefined) return;
  cache.set(key, { data, expireAt: Date.now() + CACHE_TTL });
}

async function callAgent(endpoint, payload) {
  const response = await fetch(`${AGENT_SERVICE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    console.error(`[AgentService] ${endpoint} 请求失败: ${response.status}`);
    return null;
  }
  const result = await response.json();
  return result.success ? result.data : null;
}

/**
 * 调用简历分析 Agent（缓存）
 */
async function analyzeResume(content) {
  const key = cacheKey('resume', content);
  const cached = getCache(key);
  if (cached) return cached;

  try {
    const data = await callAgent('/resume/analyze', { content });
    setCache(key, data);
    return data;
  } catch (error) {
    console.error('[AgentService] 简历分析异常:', error.message);
    return null;
  }
}

/**
 * 调用岗位匹配 Agent（缓存）
 */
async function matchJobs(skills, jobs) {
  const key = cacheKey('jobs-match', skills, jobs);
  const cached = getCache(key);
  if (cached) return cached;

  try {
    const data = await callAgent('/jobs/match', { skills, jobs });
    setCache(key, data);
    return data;
  } catch (error) {
    console.error('[AgentService] 岗位匹配异常:', error.message);
    return null;
  }
}

/**
 * 检查 Agent 服务是否可用
 */
async function checkAgentHealth() {
  try {
    const response = await fetch(`${AGENT_SERVICE_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 调用投递跟踪 Agent
 */
async function trackAnalyze(applications, action = 'analyze') {
  try {
    const data = await callAgent('/track/analyze', { applications, action });
    return data;
  } catch (error) {
    console.error('[AgentService] 投递跟踪异常:', error.message);
    return null;
  }
}

/**
 * 兼容接口：analyzeApplications（投递分析）
 */
async function analyzeApplications(applications) {
  return trackAnalyze(applications, 'analyze');
}

/**
 * 调用面试题生成 Agent
 */
async function generateInterview(jobTitle, requirements, count = 5) {
  try {
    const data = await callAgent('/interview/generate', { job_title: jobTitle, requirements, count });
    return data;
  } catch (error) {
    console.error('[AgentService] 面试题生成异常:', error.message);
    return null;
  }
}

/**
 * 调用回答评估 Agent
 */
async function evaluateAnswer(question, answer, type = 'technical') {
  try {
    const data = await callAgent('/interview/evaluate', { question, answer, type });
    return data;
  } catch (error) {
    console.error('[AgentService] 回答评估异常:', error.message);
    return null;
  }
}

/**
 * 调用技能差距分析 Agent（缓存）
 */
async function analyzeSkillGap(userSkills, targetSkills) {
  const key = cacheKey('skills-gap', userSkills, targetSkills);
  const cached = getCache(key);
  if (cached) return cached;

  try {
    const data = await callAgent('/skills/gap', { user_skills: userSkills, target_skills: targetSkills });
    setCache(key, data);
    return data;
  } catch (error) {
    console.error('[AgentService] 技能差距分析异常:', error.message);
    return null;
  }
}

/**
 * 调用学习路径推荐 Agent（缓存）
 */
async function getLearningPath(userSkills, targetSkills) {
  const key = cacheKey('learning-path', userSkills, targetSkills);
  const cached = getCache(key);
  if (cached) return cached;

  try {
    const data = await callAgent('/skills/learning-path', { user_skills: userSkills, target_skills: targetSkills });
    setCache(key, data);
    return data;
  } catch (error) {
    console.error('[AgentService] 学习路径推荐异常:', error.message);
    return null;
  }
}

module.exports = {
  analyzeResume,
  matchJobs,
  checkAgentHealth,
  trackAnalyze,
  analyzeApplications,
  generateInterview,
  evaluateAnswer,
  analyzeSkillGap,
  getLearningPath,
};
