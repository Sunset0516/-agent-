// 投递记录控制器
const { prepare } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const agentService = require('../services/agentService');

// 获取投递统计
const getStats = (req, res) => {
  const userId = req.userId;

  const stats = prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('applied', 'interview', 'offer') THEN 1 ELSE 0 END) as replied,
      SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interviewing,
      SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offers
    FROM applications WHERE user_id = ?`
  ).get(userId);

  return successResponse(res, {
    total: stats.total || 0,
    replied: stats.replied || 0,
    interviewing: stats.interviewing || 0,
    offers: stats.offers || 0,
  });
};

// 获取详细统计（趋势图 + 岗位分布）
const getDetailedStats = (req, res) => {
  const userId = req.userId;

  // 基础统计
  const stats = prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('applied', 'interview', 'offer') THEN 1 ELSE 0 END) as replied,
      SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interviewing,
      SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offers,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM applications WHERE user_id = ?`
  ).get(userId);

  // 投递趋势（最近 7 天）
  const trend = prepare(
    `SELECT DATE(applied_date) as date, COUNT(*) as count
     FROM applications
     WHERE user_id = ? AND applied_date >= date('now', '-7 days')
     GROUP BY DATE(applied_date)
     ORDER BY date ASC`
  ).all(userId);

  // 生成最近 7 天的完整日期
  const trendMap = {};
  trend.forEach(t => { trendMap[t.date] = t.count; });

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    last7Days.push({
      date: dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: trendMap[dateStr] || 0,
    });
  }

  // 岗位分布（按城市）
  const locationDist = prepare(
    `SELECT j.location, COUNT(*) as count
     FROM applications a
     LEFT JOIN jobs j ON a.job_id = j.id
     WHERE a.user_id = ? AND j.location IS NOT NULL AND j.location != ''
     GROUP BY j.location
     ORDER BY count DESC`
  ).all(userId);

  // 状态分布
  const statusDist = prepare(
    `SELECT status, COUNT(*) as count
     FROM applications WHERE user_id = ?
     GROUP BY status`
  ).all(userId);

  return successResponse(res, {
    ...stats,
    trend: last7Days,
    location_distribution: locationDist,
    status_distribution: statusDist,
  });
};

// 获取提醒中心数据
const getReminders = async (req, res) => {
  const userId = req.userId;

  const applications = prepare(
    `SELECT a.*, j.title as job_title, j.company, j.location
     FROM applications a
     LEFT JOIN jobs j ON a.job_id = j.id
     WHERE a.user_id = ?`
  ).all(userId);

  if (!applications || applications.length === 0) {
    return successResponse(res, { reminders: [], stats: { urgent: 0, total: 0 } });
  }

  try {
    const analysis = await agentService.analyzeApplications(applications);
    const reminders = analysis.reminders || [];
    return successResponse(res, {
      reminders,
      stats: {
        urgent: reminders.filter(r => r.priority === 'urgent').length,
        total: reminders.length,
      },
    });
  } catch (error) {
    console.error('Reminder analysis error:', error.message);
    return successResponse(res, { reminders: [], stats: { urgent: 0, total: 0 } });
  }
};

// 获取投递列表（含 Agent 分析）
const list = async (req, res) => {
  const userId = req.userId;

  const applications = prepare(
    `SELECT a.*, j.title as job_title, j.company, j.location
     FROM applications a
     LEFT JOIN jobs j ON a.job_id = j.id
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC`
  ).all(userId);

  // 调用 TrackAgent 分析
  let analysis = null;
  if (applications.length > 0) {
    analysis = await agentService.trackAnalyze(applications, 'analyze');
  }

  return successResponse(res, {
    applications,
    analysis,
  });
};

// 创建投递记录
const create = (req, res) => {
  const { job_id, notes } = req.body;
  const userId = req.userId;

  if (!job_id) {
    return errorResponse(res, '岗位 ID 不能为空', 400);
  }

  // 检查岗位是否存在
  const job = prepare('SELECT id FROM jobs WHERE id = ?').get(job_id);
  if (!job) {
    return errorResponse(res, '岗位不存在', 404);
  }

  // 检查是否已投递
  const existing = prepare(
    'SELECT id FROM applications WHERE user_id = ? AND job_id = ?'
  ).get(userId, job_id);

  if (existing) {
    return errorResponse(res, '已投递过该岗位', 400);
  }

  const result = prepare(
    `INSERT INTO applications (user_id, job_id, status, applied_date, notes)
     VALUES (?, ?, 'applied', date('now'), ?)`
  ).run(userId, job_id, notes || '');

  return successResponse(res, { id: result.lastInsertRowid }, '投递成功', 201);
};

// 更新投递状态
const updateStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.userId;

  const validStatuses = ['pending', 'applied', 'interview', 'offer', 'rejected'];
  if (!validStatuses.includes(status)) {
    return errorResponse(res, '无效的状态值', 400);
  }

  const application = prepare(
    'SELECT id FROM applications WHERE id = ? AND user_id = ?'
  ).get(id, userId);

  if (!application) {
    return errorResponse(res, '投递记录不存在', 404);
  }

  prepare(
    `UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(status, id);

  return successResponse(res, null, '状态更新成功');
};

module.exports = { getStats, getDetailedStats, getReminders, list, create, updateStatus };
