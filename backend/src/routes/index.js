// 路由聚合
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const applicationRoutes = require('./applicationRoutes');
const jobRoutes = require('./jobRoutes');
const resumeRoutes = require('./resumeRoutes');
const interviewRoutes = require('./interviewRoutes');
const skillRoutes = require('./skillRoutes');

router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/jobs', jobRoutes);
router.use('/resumes', resumeRoutes);
router.use('/interviews', interviewRoutes);
router.use('/skills', skillRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常', timestamp: new Date().toISOString() });
});

module.exports = router;
