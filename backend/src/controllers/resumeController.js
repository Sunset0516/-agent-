// 简历控制器
const { prepare } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const agentService = require('../services/agentService');

// 上传简历（自动调用 Agent 分析）
const upload = async (req, res) => {
  const { content } = req.body;
  const userId = req.userId;

  if (!content || !content.trim()) {
    return errorResponse(res, '简历内容不能为空', 400);
  }

  // 调用 Agent 分析简历
  const analysis = await agentService.analyzeResume(content);

  let parsedData = null;
  let score = 0;
  let suggestions = null;

  if (analysis) {
    parsedData = JSON.stringify(analysis.parsed_data);
    score = analysis.score?.total || 0;
    suggestions = JSON.stringify(analysis.suggestions);
  }

  const result = prepare(
    'INSERT INTO resumes (user_id, content, parsed_data, score, suggestions, version) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(userId, content, parsedData, score, suggestions);

  return successResponse(res, {
    id: result.lastInsertRowid,
    score: score,
    parsed_data: analysis?.parsed_data || null,
    suggestions: analysis?.suggestions || null,
    agent_available: !!analysis,
  }, '简历上传成功', 201);
};

// 获取简历列表
const list = (req, res) => {
  const userId = req.userId;

  const resumes = prepare(
    'SELECT id, content, score, suggestions, version, created_at, updated_at FROM resumes WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);

  const parsedResumes = resumes.map(r => ({
    ...r,
    parsed_data: r.parsed_data ? JSON.parse(r.parsed_data) : null,
    suggestions: r.suggestions ? JSON.parse(r.suggestions) : null,
  }));

  return successResponse(res, parsedResumes);
};

// 获取简历详情
const get = (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const resume = prepare(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?'
  ).get(id, userId);

  if (!resume) {
    return errorResponse(res, '简历不存在', 404);
  }

  resume.parsed_data = resume.parsed_data ? JSON.parse(resume.parsed_data) : null;
  resume.suggestions = resume.suggestions ? JSON.parse(resume.suggestions) : null;

  return successResponse(res, resume);
};

// 更新简历
const update = (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.userId;

  const resume = prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?').get(id, userId);
  if (!resume) {
    return errorResponse(res, '简历不存在', 404);
  }

  prepare(
    `UPDATE resumes SET content = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(content, id);

  return successResponse(res, null, '更新成功');
};

// 删除简历
const remove = (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const resume = prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?').get(id, userId);
  if (!resume) {
    return errorResponse(res, '简历不存在', 404);
  }

  prepare('DELETE FROM resumes WHERE id = ?').run(id);
  return successResponse(res, null, '删除成功');
};

module.exports = { upload, list, get, update, remove };
