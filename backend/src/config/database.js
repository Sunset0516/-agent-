// 数据库连接配置 - 使用 sql.js (纯 JS/WASM, 无需原生编译)
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('./index');

let db = null;
let dbFilePath = null;

// 初始化数据库
const initDatabase = async () => {
  const SQL = await initSqlJs();
  dbFilePath = path.resolve(__dirname, '../../', config.dbPath);

  // 确保 data 目录存在
  const dataDir = path.dirname(dbFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 如果数据库文件存在，从文件加载；否则创建新的
  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  console.log(`📦 数据库已加载: ${dbFilePath}`);
  return db;
};

// 持久化数据库到文件
const saveDatabase = () => {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFilePath, buffer);
};

// 封装 prepare 方法，提供类似 better-sqlite3 的 API
const prepare = (sql) => {
  return {
    run(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const result = stmt.step();
      const lastInsertRowid = db.exec('SELECT last_insert_rowid() AS id')[0]?.values[0][0];
      const changes = db.getRowsModified?.() || 0;
      stmt.free();
      saveDatabase();
      return { lastInsertRowid, changes };
    },
    get(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      let row = null;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      return row;
    },
    all(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    },
  };
};

// 执行 SQL（无返回值）
const exec = (sql) => {
  db.exec(sql);
  saveDatabase();
};

// 导出数据库实例和工具方法
module.exports = {
  initDatabase,
  prepare,
  exec,
  saveDatabase,
  getDb: () => db,
};
