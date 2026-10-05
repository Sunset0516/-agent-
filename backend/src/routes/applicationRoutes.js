// 投递记录路由
const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, applicationController.list);
router.post('/', authMiddleware, applicationController.create);
router.put('/:id/status', authMiddleware, applicationController.updateStatus);
router.get('/stats', authMiddleware, applicationController.getStats);
router.get('/stats/detailed', authMiddleware, applicationController.getDetailedStats);
router.get('/reminders', authMiddleware, applicationController.getReminders);

module.exports = router;
