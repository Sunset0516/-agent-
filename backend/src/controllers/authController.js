// 认证控制器
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prepare } = require('../config/database');
const config = require('../config');
const { successResponse, errorResponse } = require('../utils/response');

// 用户注册
const register = (req, res) => {
  const { username, email, password } = req.body;

  // 参数校验
  if (!username || !email || !password) {
    return errorResponse(res, '用户名、邮箱和密码不能为空', 400);
  }

  if (password.length < 6) {
    return errorResponse(res, '密码长度不能少于 6 位', 400);
  }

  // 检查用户名是否已存在
  const existingUser = prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) {
    return errorResponse(res, '用户名或邮箱已被注册', 400);
  }

  // 加密密码
  const passwordHash = bcrypt.hashSync(password, 10);

  // 插入用户
  const result = prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  ).run(username, email, passwordHash);

  const userId = result.lastInsertRowid;

  // 生成 JWT
  const token = jwt.sign({ userId, username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return successResponse(res, {
    token,
    user: {
      id: userId,
      username,
      email,
    },
  }, '注册成功', 201);
};

// 用户登录
const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return errorResponse(res, '用户名和密码不能为空', 400);
  }

  // 查询用户
  const user = prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);

  if (!user) {
    return errorResponse(res, '用户名或密码错误', 401);
  }

  // 验证密码
  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    return errorResponse(res, '用户名或密码错误', 401);
  }

  // 生成 JWT
  const token = jwt.sign({ userId: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return successResponse(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      target_position: user.target_position,
      target_city: user.target_city,
    },
  }, '登录成功');
};

// 获取当前用户信息
const getProfile = (req, res) => {
  const user = prepare(
    'SELECT id, username, email, target_position, target_city, target_salary, available_date, created_at FROM users WHERE id = ?'
  ).get(req.userId);

  if (!user) {
    return errorResponse(res, '用户不存在', 404);
  }

  return successResponse(res, user);
};

// 更新用户信息
const updateProfile = (req, res) => {
  const { target_position, target_city, target_salary, available_date } = req.body;

  prepare(
    `UPDATE users SET 
      target_position = COALESCE(?, target_position),
      target_city = COALESCE(?, target_city),
      target_salary = COALESCE(?, target_salary),
      available_date = COALESCE(?, available_date),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  ).run(target_position, target_city, target_salary, available_date, req.userId);

  const user = prepare(
    'SELECT id, username, email, target_position, target_city, target_salary, available_date FROM users WHERE id = ?'
  ).get(req.userId);

  return successResponse(res, user, '更新成功');
};

module.exports = { register, login, getProfile, updateProfile };
