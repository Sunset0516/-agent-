// 服务入口
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config');
const { initDatabase, exec, prepare } = require('./src/config/database');
const routes = require('./src/routes');

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（前端）
app.use(express.static(path.join(__dirname, '../frontend')));

// API 路由
app.use('/api', routes);

// 根路径重定向到前端
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 数据库迁移：给 jobs 表添加新字段
const runMigrations = () => {
  const migrations = [
    { column: 'work_hours', sql: 'ALTER TABLE jobs ADD COLUMN work_hours VARCHAR(50);' },
    { column: 'start_date', sql: 'ALTER TABLE jobs ADD COLUMN start_date VARCHAR(50);' },
    { column: 'category', sql: 'ALTER TABLE jobs ADD COLUMN category VARCHAR(50);' },
  ];
  // 检查已有列
  const cols = prepare('PRAGMA table_info(jobs)').all().map(c => c.name);
  migrations.forEach(m => {
    if (!cols.includes(m.column)) {
      try { exec(m.sql); console.log(`  ✅ 迁移: jobs.${m.column}`); } catch (e) { /* 已存在 */ }
    }
  });
};

// 初始化数据库后启动服务
const startServer = async () => {
  try {
    await initDatabase();
    runMigrations();
    app.listen(config.port, () => {
      console.log(`\n🚀 求职助手平台后端服务已启动`);
      console.log(`📡 服务地址: http://localhost:${config.port}`);
      console.log(`📊 健康检查: http://localhost:${config.port}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
};

startServer();
