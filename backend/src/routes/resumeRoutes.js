// 简历路由
const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, resumeController.list);
router.post('/', authMiddleware, resumeController.upload);
router.get('/:id', authMiddleware, resumeController.get);
router.put('/:id', authMiddleware, resumeController.update);
router.delete('/:id', authMiddleware, resumeController.remove);

module.exports = router;
