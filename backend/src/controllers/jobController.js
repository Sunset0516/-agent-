// 岗位控制器
const { prepare } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const agentService = require('../services/agentService');

// 获取岗位列表
const list = (req, res) => {
  const { location, type, keyword } = req.query;

  let sql = 'SELECT * FROM jobs WHERE 1=1';
  const params = [];

  if (location) {
    sql += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (keyword) {
    sql += ' AND (title LIKE ? OR company LIKE ? OR requirements LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY created_at DESC';

  const jobs = prepare(sql).all(...params);

  // 解析 JSON 字段
  const parsedJobs = jobs.map(job => ({
    ...job,
    requirements: job.requirements ? JSON.parse(job.requirements) : [],
    tags: job.tags ? JSON.parse(job.tags) : [],
  }));

  return successResponse(res, parsedJobs);
};

// 获取岗位详情
const get = (req, res) => {
  const { id } = req.params;
  const job = prepare('SELECT * FROM jobs WHERE id = ?').get(id);

  if (!job) {
    return errorResponse(res, '岗位不存在', 404);
  }

  job.requirements = job.requirements ? JSON.parse(job.requirements) : [];
  job.tags = job.tags ? JSON.parse(job.tags) : [];

  return successResponse(res, job);
};

// 创建岗位
const create = (req, res) => {
  const { title, company, location, salary, type, requirements, responsibilities, tags, source, posted_date, deadline } = req.body;

  if (!title) {
    return errorResponse(res, '岗位名称不能为空', 400);
  }

  const result = prepare(
    `INSERT INTO jobs (title, company, location, salary, type, requirements, responsibilities, tags, source, posted_date, deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    title,
    company || '',
    location || '',
    salary || '',
    type || '实习',
    requirements ? JSON.stringify(requirements) : '[]',
    responsibilities || '',
    tags ? JSON.stringify(tags) : '[]',
    source || '手动录入',
    posted_date || null,
    deadline || null
  );

  return successResponse(res, { id: result.lastInsertRowid }, '岗位添加成功', 201);
};

// 更新岗位
const update = (req, res) => {
  const { id } = req.params;
  const { title, company, location, salary, type, requirements, responsibilities, tags, posted_date, deadline } = req.body;

  const job = prepare('SELECT id FROM jobs WHERE id = ?').get(id);
  if (!job) {
    return errorResponse(res, '岗位不存在', 404);
  }

  prepare(
    `UPDATE jobs SET
      title = COALESCE(?, title),
      company = COALESCE(?, company),
      location = COALESCE(?, location),
      salary = COALESCE(?, salary),
      type = COALESCE(?, type),
      requirements = COALESCE(?, requirements),
      responsibilities = COALESCE(?, responsibilities),
      tags = COALESCE(?, tags),
      posted_date = COALESCE(?, posted_date),
      deadline = COALESCE(?, deadline)
    WHERE id = ?`
  ).run(
    title, company, location, salary, type,
    requirements ? JSON.stringify(requirements) : null,
    responsibilities,
    tags ? JSON.stringify(tags) : null,
    posted_date, deadline, id
  );

  return successResponse(res, null, '更新成功');
};

// 删除岗位
const remove = (req, res) => {
  const { id } = req.params;

  const job = prepare('SELECT id FROM jobs WHERE id = ?').get(id);
  if (!job) {
    return errorResponse(res, '岗位不存在', 404);
  }

  prepare('DELETE FROM jobs WHERE id = ?').run(id);
  return successResponse(res, null, '删除成功');
};

// 智能推荐岗位（调用 JobMatchAgent，支持筛选条件）
const recommend = async (req, res) => {
  const userId = req.userId;
  const { salary_min, salary_max, work_hours, start_date, category } = req.query;

  // 构建带筛选的 SQL
  let sql = 'SELECT * FROM jobs WHERE 1=1';
  const params = [];

  if (salary_min) {
    // salary 字段是字符串如 "150-200元/天" 或 "8000-12000元/月"，用 LIKE 模糊匹配
    sql += " AND CAST(salary AS TEXT) != '' ";
    // 对于数值范围筛选，提取数字部分进行比较
    sql += ` AND CAST(
      CASE
        WHEN CAST(salary AS INTEGER) > 0 THEN CAST(salary AS INTEGER)
        ELSE 0
      END AS INTEGER
    ) >= ?`;
    params.push(parseInt(salary_min) || 0);
  }
  if (salary_max) {
    sql += ` AND CAST(
      CASE
        WHEN CAST(salary AS INTEGER) > 0 THEN CAST(salary AS INTEGER)
        ELSE 999999
      END AS INTEGER
    ) <= ?`;
    params.push(parseInt(salary_max) || 999999);
  }
  if (work_hours) {
    sql += ' AND work_hours LIKE ?';
    params.push(`%${work_hours}%`);
  }
  if (start_date) {
    sql += ' AND start_date LIKE ?';
    params.push(`%${start_date}%`);
  }
  if (category) {
    sql += ' AND (category = ? OR category IS NULL)';
    params.push(category);
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  let jobs = prepare(sql).all(...params);

  if (jobs.length === 0) {
    return successResponse(res, []);
  }

  // 解析 JSON 字段
  const parsedJobs = jobs.map(job => ({
    ...job,
    requirements: job.requirements ? JSON.parse(job.requirements) : [],
    tags: job.tags ? JSON.parse(job.tags) : [],
  }));

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

  // 调用 JobMatchAgent
  const matchResult = await agentService.matchJobs(userSkills, parsedJobs);

  if (matchResult && matchResult.jobs) {
    return successResponse(res, matchResult.jobs);
  }

  // 降级：返回岗位列表（无匹配度）
  return successResponse(res, parsedJobs);
};

// 大数据筛查推荐（综合用户技能+投递历史+筛选条件）
const screenRecommend = async (req, res) => {
  const userId = req.userId;
  const { salary_min, salary_max, work_hours, start_date, category } = req.query;

  // 1. 获取用户技能
  const latestResume = prepare(
    'SELECT parsed_data FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(userId);

  let userSkills = [];
  let resumeData = null;
  if (latestResume && latestResume.parsed_data) {
    try {
      resumeData = JSON.parse(latestResume.parsed_data);
      userSkills = resumeData.skills || [];
    } catch (e) {
      userSkills = [];
    }
  }

  // 2. 获取用户投递历史，分析偏好
  const appliedJobs = prepare(
    `SELECT j.title, j.location, j.salary, j.type, j.category
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     WHERE a.user_id = ?`
  ).all(userId);

  // 统计用户投递偏好
  const preferredLocations = {};
  const preferredCategories = {};
  const preferredTypes = {};
  appliedJobs.forEach(j => {
    if (j.location) preferredLocations[j.location] = (preferredLocations[j.location] || 0) + 1;
    if (j.category) preferredCategories[j.category] = (preferredCategories[j.category] || 0) + 1;
    if (j.type) preferredTypes[j.type] = (preferredTypes[j.type] || 0) + 1;
  });

  // 3. 构建筛选 SQL
  let sql = 'SELECT * FROM jobs WHERE 1=1';
  const params = [];

  if (salary_min) {
    sql += ` AND CAST(
      CASE
        WHEN CAST(salary AS INTEGER) > 0 THEN CAST(salary AS INTEGER)
        ELSE 0
      END AS INTEGER
    ) >= ?`;
    params.push(parseInt(salary_min) || 0);
  }
  if (salary_max) {
    sql += ` AND CAST(
      CASE
        WHEN CAST(salary AS INTEGER) > 0 THEN CAST(salary AS INTEGER)
        ELSE 999999
      END AS INTEGER
    ) <= ?`;
    params.push(parseInt(salary_max) || 999999);
  }
  if (work_hours) {
    sql += ' AND work_hours LIKE ?';
    params.push(`%${work_hours}%`);
  }
  if (start_date) {
    sql += ' AND start_date LIKE ?';
    params.push(`%${start_date}%`);
  }
  if (category) {
    sql += ' AND (category = ? OR category IS NULL)';
    params.push(category);
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  let jobs = prepare(sql).all(...params);

  if (jobs.length === 0) {
    return successResponse(res, {
      jobs: [],
      analysis: {
        user_skills: userSkills,
        applied_count: appliedJobs.length,
        preferred_locations: preferredLocations,
        preferred_categories: preferredCategories,
      },
    });
  }

  // 解析 JSON 字段
  const parsedJobs = jobs.map(job => ({
    ...job,
    requirements: job.requirements ? JSON.parse(job.requirements) : [],
    tags: job.tags ? JSON.parse(job.tags) : [],
  }));

  // 4. 调用 JobMatchAgent 进行技能匹配
  const matchResult = await agentService.matchJobs(userSkills, parsedJobs);

  let rankedJobs = [];
  if (matchResult && matchResult.jobs) {
    rankedJobs = matchResult.jobs;
  } else {
    // 降级：手动计算匹配度
    rankedJobs = parsedJobs.map(job => {
      const reqSkills = job.requirements || [];
      const matched = reqSkills.filter(r => userSkills.some(s =>
        s.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(s.toLowerCase())
      ));
      return {
        ...job,
        match_score: reqSkills.length > 0 ? Math.round((matched.length / reqSkills.length) * 100) : 0,
        matched_skills: matched,
        missing_skills: reqSkills.filter(r => !matched.includes(r)),
      };
    });
  }

  // 5. 大数据加权排序：技能匹配度(50%) + 投递偏好加分(30%) + 热度加分(20%)
  rankedJobs = rankedJobs.map(job => {
    let bonusScore = 0;
    const reasons = [];

    // 投递偏好加分
    if (preferredLocations[job.location]) {
      bonusScore += 10 * preferredLocations[job.location];
      reasons.push(`你曾投递过 ${job.location} 的岗位`);
    }
    if (preferredCategories[job.category]) {
      bonusScore += 10 * preferredCategories[job.category];
      reasons.push(`你偏好 ${job.category} 类岗位`);
    }
    if (preferredTypes[job.type]) {
      bonusScore += 5 * preferredTypes[job.type];
      reasons.push(`你常投递 ${job.type} 岗位`);
    }

    // 技能匹配加分
    const matchScore = job.match_score || 0;
    if (matchScore >= 80) {
      reasons.push('技能高度匹配');
      bonusScore += 20;
    } else if (matchScore >= 60) {
      reasons.push('技能较匹配');
      bonusScore += 10;
    }

    const finalScore = Math.min(100, Math.round(matchScore * 0.7 + bonusScore * 0.3));

    return {
      ...job,
      match_score: finalScore,
      recommend_reasons: reasons,
      is_big_data_recommend: true,
    };
  });

  // 按综合分排序
  rankedJobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

  return successResponse(res, {
    jobs: rankedJobs,
    analysis: {
      user_skills: userSkills,
      applied_count: appliedJobs.length,
      preferred_locations: preferredLocations,
      preferred_categories: preferredCategories,
    },
  });
};

module.exports = { list, get, create, update, remove, recommend, screenRecommend };
