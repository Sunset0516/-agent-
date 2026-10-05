// 面试辅导控制器
const { prepare } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const agentService = require('../services/agentService');

// 开始模拟面试
const start = async (req, res) => {
  const { job_id } = req.body;
  const userId = req.userId;

  // 获取岗位信息
  let jobTitle = '';
  let requirements = [];

  if (job_id) {
    const job = prepare('SELECT title, requirements FROM jobs WHERE id = ?').get(job_id);
    if (job) {
      jobTitle = job.title;
      requirements = job.requirements ? JSON.parse(job.requirements) : [];
    }
  }

  // 调用 Agent 生成面试题
  const interviewData = await agentService.generateInterview(jobTitle, requirements, 5);

  if (!interviewData) {
    return errorResponse(res, '面试题生成失败，请稍后重试', 500);
  }

  const questions = interviewData.questions || [];

  // 保存面试记录
  const result = prepare(
    'INSERT INTO interviews (user_id, job_id, questions) VALUES (?, ?, ?)'
  ).run(userId, job_id || null, JSON.stringify(questions));

  return successResponse(res, {
    id: result.lastInsertRowid,
    questions,
    job_title: jobTitle,
  }, '面试开始', 201);
};

// 提交回答并获取评估
const answer = async (req, res) => {
  const { id } = req.params;
  const { answer, question_index = 0 } = req.body;
  const userId = req.userId;

  if (!answer || !answer.trim()) {
    return errorResponse(res, '回答内容不能为空', 400);
  }

  // 获取面试记录
  const interview = prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(id, userId);
  if (!interview) {
    return errorResponse(res, '面试记录不存在', 404);
  }

  const questions = interview.questions ? JSON.parse(interview.questions) : [];
  const question = questions[question_index] || questions[0];

  if (!question) {
    return errorResponse(res, '面试题不存在', 400);
  }

  // 调用 Agent 评估回答
  const evaluation = await agentService.evaluateAnswer(
    question.question,
    answer,
    question.type || 'technical'
  );

  if (!evaluation) {
    return errorResponse(res, '回答评估失败', 500);
  }

  // 更新面试记录
  const answers = interview.answers ? JSON.parse(interview.answers) : [];
  answers[question_index] = { answer, evaluation };

  prepare(
    'UPDATE interviews SET answers = ? WHERE id = ?'
  ).run(JSON.stringify(answers), id);

  return successResponse(res, {
    question: question.question,
    evaluation,
  });
};

// 获取面试详情
const get = (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const interview = prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(id, userId);
  if (!interview) {
    return errorResponse(res, '面试记录不存在', 404);
  }

  interview.questions = interview.questions ? JSON.parse(interview.questions) : [];
  interview.answers = interview.answers ? JSON.parse(interview.answers) : [];
  interview.evaluation = interview.evaluation ? JSON.parse(interview.evaluation) : null;

  return successResponse(res, interview);
};

// 获取面试历史
const list = (req, res) => {
  const userId = req.userId;

  const interviews = prepare(
    'SELECT i.*, j.title as job_title FROM interviews i LEFT JOIN jobs j ON i.job_id = j.id WHERE i.user_id = ? ORDER BY i.created_at DESC'
  ).all(userId);

  const parsed = interviews.map(i => ({
    ...i,
    questions: i.questions ? JSON.parse(i.questions) : [],
    answers: i.answers ? JSON.parse(i.answers) : [],
  }));

  return successResponse(res, parsed);
};

module.exports = { start, answer, get, list };
