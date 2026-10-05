// 技能路由
const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const authMiddleware = require('../middleware/auth');

router.get('/gap', authMiddleware, skillController.gap);
router.get('/learning-path', authMiddleware, skillController.learningPath);

module.exports = router;
