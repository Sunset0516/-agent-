// 数据库初始化脚本 - 创建所有表
const { initDatabase, exec } = require('./database');

const createTables = async () => {
  await initDatabase();

  // 用户表
  exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      target_position VARCHAR(100),
      target_city VARCHAR(50),
      target_salary VARCHAR(50),
      available_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 简历表
  exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parsed_data TEXT,
      score REAL DEFAULT 0,
      suggestions TEXT,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 岗位表
  exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      company VARCHAR(200),
      location VARCHAR(100),
      salary VARCHAR(50),
      type VARCHAR(20) DEFAULT '实习',
      requirements TEXT,
      responsibilities TEXT,
      tags TEXT,
      source VARCHAR(50),
      posted_date DATE,
      deadline DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 投递记录表
  exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      applied_date DATE,
      match_score REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  // 面试记录表
  exec(`
    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      job_id INTEGER,
      type VARCHAR(20) DEFAULT '模拟面试',
      questions TEXT,
      answers TEXT,
      evaluation TEXT,
      score REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
    );
  `);

  // 提醒表
  exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      application_id INTEGER,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      remind_at DATETIME NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ 所有数据表创建成功！');
  // 延迟退出，避免 sql.js WASM 清理时的断言错误
  setTimeout(() => process.exit(0), 100);
};

createTables().catch((err) => {
  console.error('❌ 数据库初始化失败:', err);
  setTimeout(() => process.exit(1), 100);
});
