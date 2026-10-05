// 面试路由
const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, interviewController.list);
router.post('/start', authMiddleware, interviewController.start);
router.post('/:id/answer', authMiddleware, interviewController.answer);
router.get('/:id', authMiddleware, interviewController.get);

module.exports = router;
