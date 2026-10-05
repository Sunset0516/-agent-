// 岗位路由
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, jobController.list);
router.get('/recommend', authMiddleware, jobController.recommend);
router.get('/screen-recommend', authMiddleware, jobController.screenRecommend);
router.get('/:id', authMiddleware, jobController.get);
router.post('/', authMiddleware, jobController.create);
router.put('/:id', authMiddleware, jobController.update);
router.delete('/:id', authMiddleware, jobController.remove);

module.exports = router;
