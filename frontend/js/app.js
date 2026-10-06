// 主应用逻辑
class App {
  constructor() {
    this.currentUser = null;
    this.currentPage = 'dashboard';
    this.historyStack = [];
    this.init();
  }

  init() {
    // 检查登录状态
    const token = api.getToken();
    if (token) {
      this.loadProfile();
    } else {
      this.showAuth();
    }
  }

  // 显示认证页面
  showAuth() {
    document.getElementById('app').innerHTML = this.getAuthHTML();
    this.bindAuthEvents();
  }

  // 显示主应用
  showApp() {
    document.getElementById('app').innerHTML = this.getAppHTML();
    this.bindAppEvents();
    this.navigate('dashboard');
  }

  // 加载用户信息
  async loadProfile() {
    const result = await api.auth.getProfile();
    if (result.success) {
      this.currentUser = result.data;
      this.showApp();
    } else {
      api.setToken(null);
      this.showAuth();
    }
  }

  // ===== 认证页面 =====
  getAuthHTML() {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-logo">
            <h1>🎯 求职助手</h1>
            <p>多 Agent 智能求职平台</p>
          </div>
          <div class="auth-tabs">
            <div class="auth-tab active" data-tab="login">登录</div>
            <div class="auth-tab" data-tab="register">注册</div>
          </div>
          <div id="auth-form">
            ${this.getLoginFormHTML()}
          </div>
          <div class="auth-footer">
            多 Agent 智能求职助手 · 让找实习更简单
          </div>
        </div>
      </div>
    `;
  }

  getLoginFormHTML() {
    return `
      <form id="login-form">
        <div class="form-group">
          <label class="form-label">用户名 / 邮箱</label>
          <input type="text" class="form-input" id="login-username" placeholder="请输入用户名或邮箱" required>
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input type="password" class="form-input" id="login-password" placeholder="请输入密码" required>
        </div>
        <div id="login-message"></div>
        <button type="submit" class="btn btn-primary btn-block" id="login-btn">登录</button>
      </form>
    `;
  }

  getRegisterFormHTML() {
    return `
      <form id="register-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input type="text" class="form-input" id="reg-username" placeholder="请输入用户名" required>
        </div>
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input type="email" class="form-input" id="reg-email" placeholder="请输入邮箱" required>
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input type="password" class="form-input" id="reg-password" placeholder="至少 6 位" required minlength="6">
        </div>
        <div id="register-message"></div>
        <button type="submit" class="btn btn-primary btn-block" id="register-btn">注册</button>
      </form>
    `;
  }

  bindAuthEvents() {
    // 切换登录/注册
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const form = document.getElementById('auth-form');
        if (tab.dataset.tab === 'login') {
          form.innerHTML = this.getLoginFormHTML();
          this.bindLoginForm();
        } else {
          form.innerHTML = this.getRegisterFormHTML();
          this.bindRegisterForm();
        }
      });
    });

    this.bindLoginForm();
  }

  bindLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      const msg = document.getElementById('login-message');
      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span>';

      const result = await api.auth.login({
        username: document.getElementById('login-username').value,
        password: document.getElementById('login-password').value,
      });

      if (result.success) {
        api.setToken(result.data.token);
        this.currentUser = result.data.user;
        msg.innerHTML = '<div class="alert alert-success">登录成功，正在跳转...</div>';
        setTimeout(() => this.showApp(), 500);
      } else {
        msg.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
        btn.disabled = false;
        btn.innerHTML = '登录';
      }
    });
  }

  bindRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('register-btn');
      const msg = document.getElementById('register-message');
      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span>';

      const result = await api.auth.register({
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
      });

      if (result.success) {
        api.setToken(result.data.token);
        this.currentUser = result.data.user;
        msg.innerHTML = '<div class="alert alert-success">注册成功，正在跳转...</div>';
        setTimeout(() => this.showApp(), 500);
      } else {
        msg.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
        btn.disabled = false;
        btn.innerHTML = '注册';
      }
    });
  }

  // ===== 主应用 =====
  getAppHTML() {
    const userName = this.currentUser?.username || '用户';
    const userEmail = this.currentUser?.email || '';
    const initial = userName.charAt(0).toUpperCase();

    return `
      <div class="app-layout">
        <aside class="sidebar">
          <div class="sidebar-logo">
            <h2>🎯 求职助手</h2>
          </div>
          <nav class="sidebar-nav">
            <div class="nav-item active" data-page="dashboard">
              <span class="icon">📊</span> 数据看板
            </div>
            <div class="nav-item" data-page="resume">
              <span class="icon">📄</span> 简历管理
            </div>
            <div class="nav-item" data-page="jobs">
              <span class="icon">💼</span> 岗位推荐
            </div>
            <div class="nav-item" data-page="applications">
              <span class="icon">📋</span> 投递跟踪
            </div>
            <div class="nav-item" data-page="reminders">
              <span class="icon">🔔</span> 提醒中心
            </div>
            <div class="nav-item" data-page="interview">
              <span class="icon">🎤</span> 面试辅导
            </div>
            <div class="nav-item" data-page="skills">
              <span class="icon">🧠</span> 技能图谱
            </div>
          </nav>
          <div class="sidebar-footer">
            <div class="user-info">
              <div class="user-avatar">${initial}</div>
              <div>
                <div class="user-name">${userName}</div>
                <div class="user-email">${userEmail}</div>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm btn-block" id="logout-btn">退出登录</button>
          </div>
        </aside>
        <main class="main-content" id="main-content">
          <!-- 页面内容动态渲染 -->
        </main>
      </div>
    `;
  }

  bindAppEvents() {
    // 导航切换
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.navigate(page);
      });
    });

    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', () => {
      api.setToken(null);
      this.currentUser = null;
      this.showAuth();
    });
  }

  navigate(page) {
    if (this.currentPage && this.currentPage !== page) {
      this.historyStack.push(this.currentPage);
    }
    this.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    const content = document.getElementById('main-content');
    switch (page) {
      case 'dashboard':
        this.renderDashboard(content);
        break;
      case 'resume':
        this.renderResume(content);
        break;
      case 'jobs':
        this.renderJobs(content);
        break;
      case 'applications':
        this.renderApplications(content);
        break;
      case 'reminders':
        this.renderReminders(content);
        break;
      case 'interview':
        this.renderInterview(content);
        break;
      case 'skills':
        this.renderSkills(content);
        break;
    }
    // 在页面内容最前面插入返回按钮
    const backBtn = document.createElement('div');
    backBtn.innerHTML = this.getBackButtonHTML();
    if (backBtn.firstChild) {
      content.insertBefore(backBtn, content.firstChild);
    }
  }

  goBack() {
    if (this.historyStack.length > 0) {
      const prevPage = this.historyStack.pop();
      this.currentPage = prevPage;
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === prevPage);
      });
      const content = document.getElementById('main-content');
      switch (prevPage) {
        case 'dashboard': this.renderDashboard(content); break;
        case 'resume': this.renderResume(content); break;
        case 'jobs': this.renderJobs(content); break;
        case 'applications': this.renderApplications(content); break;
        case 'reminders': this.renderReminders(content); break;
        case 'interview': this.renderInterview(content); break;
        case 'skills': this.renderSkills(content); break;
      }
      const backBtn = document.createElement('div');
      backBtn.innerHTML = this.getBackButtonHTML();
      if (backBtn.firstChild) {
        content.insertBefore(backBtn, content.firstChild);
      }
    }
  }

  getBackButtonHTML() {
    if (this.historyStack.length === 0) return '';
    const prevPageName = {
      dashboard: '数据看板', resume: '简历管理', jobs: '岗位推荐',
      applications: '投递跟踪', reminders: '提醒中心',
      interview: '面试辅导', skills: '技能图谱',
    }[this.historyStack[this.historyStack.length - 1]] || '上一页';
    return `<button class="btn btn-back" onclick="app.goBack()">← 返回${prevPageName}</button>`;
  }

  // ===== 数据看板 =====
  async renderDashboard(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">数据看板</h1>
        <p class="page-subtitle">你的求职进展一目了然</p>
      </div>
      <div id="dashboard-stats"><div class="loading"></div></div>
      <div id="dashboard-charts" class="mt-16"></div>
      <div id="dashboard-recent" class="mt-16"></div>
    `;

    try {
      const statsResult = await api.application.detailedStats();
      const stats = statsResult.success ? statsResult.data : {};

      document.getElementById('dashboard-stats').innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">📋</div>
            <div>
              <div class="stat-value">${stats.total || 0}</div>
              <div class="stat-label">总投递数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">✅</div>
            <div>
              <div class="stat-value">${stats.replied || 0}</div>
              <div class="stat-label">已回复</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">🎤</div>
            <div>
              <div class="stat-value">${stats.interviewing || 0}</div>
              <div class="stat-label">面试中</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red">🎉</div>
            <div>
              <div class="stat-value">${stats.offers || 0}</div>
              <div class="stat-label">已 Offer</div>
            </div>
          </div>
        </div>
      `;

      // 趋势图 + 岗位分布
      const trend = stats.trend || [];
      const maxCount = Math.max(...trend.map(t => t.count), 1);
      const locations = stats.location_distribution || [];
      const maxLocCount = Math.max(...locations.map(l => l.count), 1);

      let chartsHtml = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">';

      // 投递趋势柱状图
      chartsHtml += `
        <div class="card">
          <h3 class="card-title">📈 近7天投递趋势</h3>
          <div style="display: flex; align-items: flex-end; gap: 8px; height: 150px;">
            ${trend.map(t => `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%;">
                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">${t.count}</div>
                <div style="width: 100%; background: var(--primary); border-radius: 4px 4px 0 0; height: ${(t.count / maxCount) * 100}%; min-height: 4px;"></div>
                <div style="font-size: 11px; color: var(--text-light); margin-top: 4px;">${t.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // 岗位城市分布
      if (locations.length > 0) {
        chartsHtml += `
          <div class="card">
            <h3 class="card-title">📍 投递城市分布</h3>
            ${locations.map(l => `
              <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                  <span>${l.location}</span>
                  <span style="color: var(--text-secondary);">${l.count}</span>
                </div>
                <div style="background: var(--bg-secondary); border-radius: 4px; height: 8px; overflow: hidden;">
                  <div style="background: var(--success); height: 100%; width: ${(l.count / maxLocCount) * 100}%; border-radius: 4px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        chartsHtml += `
          <div class="card">
            <h3 class="card-title">📍 投递城市分布</h3>
            <div class="empty-state" style="padding: 20px;">
              <p style="color: var(--text-light); font-size: 13px;">暂无投递数据</p>
            </div>
          </div>
        `;
      }

      chartsHtml += '</div>';
      document.getElementById('dashboard-charts').innerHTML = chartsHtml;
    } catch (error) {
      document.getElementById('dashboard-stats').innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon blue">📋</div><div><div class="stat-value">0</div><div class="stat-label">总投递数</div></div></div>
          <div class="stat-card"><div class="stat-icon green">✅</div><div><div class="stat-value">0</div><div class="stat-label">已回复</div></div></div>
          <div class="stat-card"><div class="stat-icon orange">🎤</div><div><div class="stat-value">0</div><div class="stat-label">面试中</div></div></div>
          <div class="stat-card"><div class="stat-icon red">🎉</div><div><div class="stat-value">0</div><div class="stat-label">已 Offer</div></div></div>
        </div>
      `;
    }

    // 快速入口
    document.getElementById('dashboard-recent').innerHTML = `
      <div class="card">
        <h3 class="card-title">快速操作</h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="app.navigate('resume')">📄 上传简历</button>
          <button class="btn btn-secondary" onclick="app.navigate('jobs')">💼 浏览岗位</button>
          <button class="btn btn-secondary" onclick="app.navigate('interview')">🎤 模拟面试</button>
          <button class="btn btn-secondary" onclick="app.navigate('skills')">🧠 技能分析</button>
        </div>
      </div>
    `;
  }

  // ===== 简历管理 =====
  renderResume(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">简历管理</h1>
        <p class="page-subtitle">上传简历，AI 帮你分析并优化</p>
      </div>
      <div class="card">
        <h3 class="card-title">上传简历</h3>
        <div class="form-group">
          <label class="form-label">上传文档（支持 TXT / PDF / DOCX）</label>
          <div id="file-drop-zone" class="file-drop-zone">
            <div class="file-drop-icon">📁</div>
            <div class="file-drop-text">点击或拖拽文件到此处上传</div>
            <div class="file-drop-hint">支持 .txt / .pdf / .docx 格式，文件大小 &lt; 10MB</div>
            <input type="file" id="resume-file-input" accept=".txt,.pdf,.docx" style="display: none;" />
          </div>
          <div id="file-status" class="file-status" style="display: none;"></div>
        </div>
        <div class="form-group">
          <label class="form-label">或粘贴文本内容</label>
          <textarea class="form-textarea" id="resume-content" placeholder="请粘贴你的简历内容..."></textarea>
        </div>
        <button class="btn btn-primary" id="analyze-resume-btn">🔍 AI 分析简历</button>
      </div>
      <div id="resume-result" class="mt-16"></div>
    `;

    // 文件上传逻辑
    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('resume-file-input');
    const fileStatus = document.getElementById('file-status');
    const textarea = document.getElementById('resume-content');

    // 点击触发文件选择
    dropZone.addEventListener('click', () => fileInput.click());

    // 拖拽事件
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    // 文件选择
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });

    // 处理上传的文件
    async function handleFile(file) {
      const fileName = file.name;
      const fileSize = file.size;
      const ext = fileName.split('.').pop().toLowerCase();

      // 验证文件大小
      if (fileSize > 10 * 1024 * 1024) {
        fileStatus.style.display = 'block';
        fileStatus.className = 'file-status error';
        fileStatus.innerHTML = '❌ 文件大小超过 10MB 限制';
        return;
      }

      // 验证文件类型
      if (!['txt', 'pdf', 'docx'].includes(ext)) {
        fileStatus.style.display = 'block';
        fileStatus.className = 'file-status error';
        fileStatus.innerHTML = '❌ 不支持的文件格式，请上传 TXT / PDF / DOCX 文件';
        return;
      }

      fileStatus.style.display = 'block';
      fileStatus.className = 'file-status';
      fileStatus.innerHTML = `<div class="loading" style="width:20px;height:20px;display:inline-block;vertical-align:middle;margin-right:8px;"></div>正在读取 ${fileName} ...`;

      try {
        let text = '';
        if (ext === 'txt') {
          text = await readTxtFile(file);
        } else if (ext === 'pdf') {
          text = await readPdfFile(file);
        } else if (ext === 'docx') {
          text = await readDocxFile(file);
        }

        if (!text || text.trim().length < 10) {
          throw new Error('未能从文档中提取到足够的文本内容');
        }

        textarea.value = text;
        fileStatus.className = 'file-status success';
        fileStatus.innerHTML = `✅ ${fileName} 读取成功（${text.length} 字符），已填充到文本框`;
      } catch (err) {
        fileStatus.className = 'file-status error';
        fileStatus.innerHTML = `❌ 读取失败：${err.message}`;
      }
    }

    // 读取 TXT 文件
    function readTxtFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('读取文本文件失败'));
        reader.readAsText(file, 'UTF-8');
      });
    }

    // 读取 PDF 文件（使用 pdf.js）
    async function readPdfFile(file) {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += pageText + '\n';
      }
      return text;
    }

    // 读取 DOCX 文件（使用 mammoth.js）
    async function readDocxFile(file) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    document.getElementById('analyze-resume-btn').addEventListener('click', async () => {
      const content = document.getElementById('resume-content').value.trim();
      if (!content) {
        alert('请先输入简历内容');
        return;
      }
      document.getElementById('resume-result').innerHTML = '<div class="card"><div class="text-center"><div class="loading"></div><p class="mt-16">AI 正在分析简历，请稍候...</p></div></div>';

      const result = await api.resume.upload({ content });

      if (result.success && result.data) {
        const d = result.data;
        const skills = d.parsed_data?.skills || [];
        const suggestions = d.suggestions || [];
        const score = d.score || 0;

        let scoreColor = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)';

        document.getElementById('resume-result').innerHTML = `
          <div class="card">
            <h3 class="card-title">📊 分析结果</h3>
            <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 20px;">
              <div style="text-align: center;">
                <div style="font-size: 48px; font-weight: 700; color: ${scoreColor};">${score}</div>
                <div style="color: var(--text-secondary); font-size: 13px;">简历评分</div>
              </div>
              <div style="flex: 1;">
                <div style="margin-bottom: 8px; font-weight: 500;">技能提取 (${skills.length}项)</div>
                <div>${skills.map(s => `<span class="tag">${s}</span>`).join('') || '<span style="color: var(--text-light);">未提取到技能</span>'}</div>
              </div>
            </div>
            <div style="border-top: 1px solid var(--border-light); padding-top: 16px;">
              <div style="font-weight: 500; margin-bottom: 12px;">💡 优化建议</div>
              <ul style="padding-left: 20px; color: var(--text-secondary);">
                ${suggestions.map(s => `<li style="margin-bottom: 6px;">${s}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      } else {
        document.getElementById('resume-result').innerHTML = `
          <div class="card">
            <div class="alert alert-error">${result.message || '分析失败，请重试'}</div>
          </div>
        `;
      }
    });
  }

  // ===== 岗位推荐 =====
  renderJobs(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">岗位推荐</h1>
        <p class="page-subtitle">AI 为你匹配最合适的实习岗位</p>
      </div>
      <div class="card">
        <h3 class="card-title">📋 筛选条件</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div class="form-group">
            <label class="form-label">工资下限（元/月）</label>
            <input type="number" class="form-input" id="filter-salary-min" placeholder="如 5000" />
          </div>
          <div class="form-group">
            <label class="form-label">工资上限（元/月）</label>
            <input type="number" class="form-input" id="filter-salary-max" placeholder="如 15000" />
          </div>
          <div class="form-group">
            <label class="form-label">工作时间</label>
            <select class="form-input" id="filter-work-hours">
              <option value="">不限</option>
              <option value="全职">全职</option>
              <option value="兼职">兼职</option>
              <option value="实习">实习</option>
              <option value="远程">远程</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">到岗时间</label>
            <select class="form-input" id="filter-start-date">
              <option value="">不限</option>
              <option value="随时">随时到岗</option>
              <option value="一周">一周内</option>
              <option value="两周">两周内</option>
              <option value="一月">一月内</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">岗位类别</label>
            <select class="form-input" id="filter-category">
              <option value="">不限</option>
              <option value="技术">技术</option>
              <option value="产品">产品</option>
              <option value="设计">设计</option>
              <option value="运营">运营</option>
              <option value="市场">市场</option>
              <option value="数据">数据</option>
            </select>
          </div>
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
          <button class="btn btn-primary" id="recommend-btn">🎯 智能推荐</button>
          <button class="btn btn-secondary" id="screen-recommend-btn">📊 大数据筛查推荐</button>
        </div>
      </div>
      <div id="jobs-list" class="mt-16"></div>
    `;

    const getFilters = () => {
      const filters = {};
      const sm = document.getElementById('filter-salary-min').value;
      const sx = document.getElementById('filter-salary-max').value;
      const wh = document.getElementById('filter-work-hours').value;
      const sd = document.getElementById('filter-start-date').value;
      const cat = document.getElementById('filter-category').value;
      if (sm) filters.salary_min = sm;
      if (sx) filters.salary_max = sx;
      if (wh) filters.work_hours = wh;
      if (sd) filters.start_date = sd;
      if (cat) filters.category = cat;
      return filters;
    };

    const renderJobCard = (job, isBigData = false) => {
      const matchScore = job.match_score || 0;
      const scoreColor = matchScore >= 70 ? 'var(--success)' : matchScore >= 50 ? 'var(--warning)' : 'var(--danger)';
      const matchedSkills = job.matched_skills || [];
      const missingSkills = job.missing_skills || [];
      const requirements = job.requirements || [];
      const reasons = job.recommend_reasons || [];
      const badge = isBigData ? '<span class="tag tag-success" style="margin-left:8px;">📊 大数据推荐</span>' : '';

      return `
        <div class="card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div>
              <h3 style="font-size: 18px; margin-bottom: 4px;">${job.title}${badge}</h3>
              <div style="color: var(--text-secondary); font-size: 14px;">
                ${job.company || ''} · ${job.location || ''} · ${job.salary || ''}
                ${job.work_hours ? ` · ${job.work_hours}` : ''}
                ${job.start_date ? ` · ${job.start_date}到岗` : ''}
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: 700; color: ${scoreColor};">${matchScore}%</div>
              <div style="font-size: 12px; color: var(--text-light);">匹配度</div>
            </div>
          </div>
          ${reasons.length > 0 ? `
            <div style="background: var(--bg-tertiary); border-radius: 6px; padding: 10px 14px; margin-bottom: 10px;">
              <div style="font-size: 12px; color: var(--primary); font-weight: 600; margin-bottom: 4px;">💡 推荐理由</div>
              ${reasons.map(r => `<div style="font-size: 13px; color: var(--text-secondary);">• ${r}</div>`).join('')}
            </div>
          ` : ''}
          <div style="margin-bottom: 8px;">
            <span style="font-size: 13px; color: var(--text-secondary);">岗位要求：</span>
            ${requirements.map(r => `<span class="tag">${r}</span>`).join('')}
          </div>
          ${matchedSkills.length > 0 ? `
            <div style="margin-bottom: 8px;">
              <span style="font-size: 13px; color: var(--success);">✓ 已匹配：</span>
              ${matchedSkills.map(s => `<span class="tag tag-success">${s}</span>`).join('')}
            </div>
          ` : ''}
          ${missingSkills.length > 0 ? `
            <div style="margin-bottom: 10px;">
              <span style="font-size: 13px; color: var(--danger);">✗ 待提升：</span>
              ${missingSkills.map(s => `<span class="tag tag-danger">${s}</span>`).join('')}
            </div>
          ` : ''}
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
            ${job.application_url ? `
              <a href="${job.application_url}" target="_blank" rel="noopener" class="btn btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                🔗 立即投递
              </a>
            ` : `
              <span class="btn btn-secondary" style="opacity: 0.6; cursor: not-allowed;">暂无投递链接</span>
            `}
            <button class="btn btn-secondary" onclick="app.trackJob(${job.id})">📝 记录投递</button>
          </div>
        </div>
      `;
    };

    // 智能推荐
    document.getElementById('recommend-btn').addEventListener('click', async () => {
      const filters = getFilters();
      document.getElementById('jobs-list').innerHTML = '<div class="card"><div class="text-center"><div class="loading"></div><p class="mt-16">JobMatchAgent 正在为你匹配岗位...</p></div></div>';

      const result = await api.job.recommend(filters);

      if (result.success && result.data && result.data.length > 0) {
        document.getElementById('jobs-list').innerHTML = result.data.map(j => renderJobCard(j, false)).join('');
      } else {
        document.getElementById('jobs-list').innerHTML = `
          <div class="card">
            <div class="empty-state">
              <div class="icon">💼</div>
              <h3>暂无匹配岗位</h3>
              <p>请调整筛选条件或先上传简历</p>
            </div>
          </div>
        `;
      }
    });

    // 大数据筛查推荐
    document.getElementById('screen-recommend-btn').addEventListener('click', async () => {
      const filters = getFilters();
      document.getElementById('jobs-list').innerHTML = '<div class="card"><div class="text-center"><div class="loading"></div><p class="mt-16">正在基于大数据分析为你筛查推荐...</p></div></div>';

      const result = await api.job.screenRecommend(filters);

      if (result.success && result.data && result.data.jobs && result.data.jobs.length > 0) {
        const analysis = result.data.analysis || {};
        let analysisHtml = '';
        if (analysis.user_skills && analysis.user_skills.length > 0) {
          analysisHtml = `
            <div class="card" style="margin-bottom: 16px; background: var(--bg-tertiary);">
              <h3 class="card-title">📈 大数据分析报告</h3>
              <div style="font-size: 13px; color: var(--text-secondary);">
                <div>已掌握技能：${analysis.user_skills.map(s => `<span class="tag">${s}</span>`).join('')}</div>
                ${analysis.applied_count > 0 ? `<div style="margin-top:6px;">投递历史：${analysis.applied_count} 次</div>` : ''}
                ${analysis.preferred_locations && Object.keys(analysis.preferred_locations).length > 0 ? `<div style="margin-top:6px;">偏好城市：${Object.entries(analysis.preferred_locations).map(([k,v]) => `${k}(${v})`).join('、')}</div>` : ''}
              </div>
            </div>
          `;
        }
        document.getElementById('jobs-list').innerHTML = analysisHtml + result.data.jobs.map(j => renderJobCard(j, true)).join('');
      } else {
        document.getElementById('jobs-list').innerHTML = `
          <div class="card">
            <div class="empty-state">
              <div class="icon">📊</div>
              <h3>暂无大数据推荐岗位</h3>
              <p>请调整筛选条件或先上传简历获取个性化推荐</p>
            </div>
          </div>
        `;
      }
    });
  }

  // ===== 投递跟踪 =====
  async renderApplications(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">投递跟踪</h1>
        <p class="page-subtitle">管理投递记录，TrackAgent 智能提醒跟进</p>
      </div>
      <div id="app-tracking-content"><div class="card"><div class="text-center"><div class="loading"></div><p class="mt-16">加载中...</p></div></div></div>
    `;

    const result = await api.application.list();

    if (result.success) {
      const { applications, analysis } = result.data;
      const stats = analysis?.stats || {};
      const reminders = analysis?.reminders || [];
      const timeline = analysis?.timeline || applications;

      let remindersHtml = '';
      if (reminders.length > 0) {
        remindersHtml = `
          <div class="card" style="margin-bottom: 16px;">
            <h3 class="card-title">🔔 智能提醒 (${reminders.length})</h3>
            ${reminders.map(r => `
              <div class="alert alert-${r.level === 'warning' ? 'warning' : r.level === 'success' ? 'success' : 'info'}" style="margin-bottom: 8px;">
                ${r.message}
              </div>
            `).join('')}
          </div>
        `;
      }

      let statsHtml = '';
      if (applications.length > 0) {
        statsHtml = `
          <div class="stats-grid" style="margin-bottom: 16px;">
            <div class="stat-card"><div class="stat-icon blue">📋</div><div><div class="stat-value">${stats.total || 0}</div><div class="stat-label">总投递</div></div></div>
            <div class="stat-card"><div class="stat-icon green">✅</div><div><div class="stat-value">${stats.reply_rate || 0}%</div><div class="stat-label">回复率</div></div></div>
            <div class="stat-card"><div class="stat-icon orange">🎤</div><div><div class="stat-value">${stats.interview_rate || 0}%</div><div class="stat-label">面试率</div></div></div>
            <div class="stat-card"><div class="stat-icon red">🎉</div><div><div class="stat-value">${stats.offer_rate || 0}%</div><div class="stat-label">Offer率</div></div></div>
          </div>
        `;
      }

      let tableHtml = '';
      if (applications.length > 0) {
        const statusLabels = { pending: '待投递', applied: '已投递', interview: '面试中', offer: '已Offer', rejected: '已拒绝' };
        tableHtml = `
          <div class="card">
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr><th>岗位</th><th>公司</th><th>投递日期</th><th>状态</th><th>操作</th></tr>
                </thead>
                <tbody>
                  ${applications.map(app => `
                    <tr>
                      <td>${app.job_title || '-'}</td>
                      <td>${app.company || '-'}</td>
                      <td>${(app.applied_date || app.created_at || '').slice(0, 10)}</td>
                      <td><span class="status-badge status-${app.status}">${statusLabels[app.status] || app.status}</span></td>
                      <td>
                        <select class="form-input" style="padding: 4px 8px; width: auto; font-size: 12px;" onchange="app.updateAppStatus(${app.id}, this.value)">
                          <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>已投递</option>
                          <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>面试中</option>
                          <option value="offer" ${app.status === 'offer' ? 'selected' : ''}>已Offer</option>
                          <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>已拒绝</option>
                        </select>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else {
        tableHtml = `
          <div class="card">
            <div class="empty-state">
              <div class="icon">📋</div>
              <h3>暂无投递记录</h3>
              <p>去「岗位推荐」页面投递心仪的岗位吧</p>
            </div>
          </div>
        `;
      }

      document.getElementById('app-tracking-content').innerHTML = remindersHtml + statsHtml + tableHtml;
    }
  }

  // 更新投递状态
  async updateAppStatus(id, status) {
    const result = await api.application.updateStatus(id, status);
    if (result.success) {
      this.navigate('applications');
    } else {
      alert(result.message || '更新失败');
    }
  }

  // ===== 提醒中心 =====
  async renderReminders(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🔔 提醒中心</h1>
        <p class="page-subtitle">TrackAgent 智能提醒，不错过每一个关键节点</p>
      </div>
      <div id="reminders-content"><div class="loading"></div></div>
    `;

    try {
      const result = await api.application.reminders();
      if (!result.success) throw new Error(result.message);

      const { reminders, stats } = result.data;

      let html = `
        <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
          <div class="stat-card">
            <div class="stat-icon red">🚨</div>
            <div>
              <div class="stat-value">${stats.urgent}</div>
              <div class="stat-label">紧急提醒</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon blue">📋</div>
            <div>
              <div class="stat-value">${stats.total}</div>
              <div class="stat-label">全部提醒</div>
            </div>
          </div>
        </div>
      `;

      if (!reminders || reminders.length === 0) {
        html += `
          <div class="empty-state">
            <div class="empty-icon" style="font-size: 48px; margin-bottom: 12px;">🎉</div>
            <p>暂无提醒事项，继续加油！</p>
          </div>
        `;
      } else {
        html += '<div class="card"><h3 class="card-title">📌 提醒列表</h3>';
        reminders.forEach(r => {
          const priorityBadge = r.priority === 'urgent'
            ? '<span class="badge urgent">紧急</span>'
            : r.priority === 'high' ? '<span class="badge warn">重要</span>' : '<span class="badge">一般</span>';
          html += `
            <div class="reminder-item" style="padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${r.priority === 'urgent' ? 'var(--danger)' : r.priority === 'high' ? 'var(--warning)' : 'var(--primary)'}; background: var(--bg-secondary);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong>${r.message}</strong>
                ${priorityBadge}
              </div>
              <div style="font-size: 13px; color: var(--text-secondary);">${r.action || ''}</div>
              ${r.deadline ? `<div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">⏰ 截止：${r.deadline}</div>` : ''}
            </div>
          `;
        });
        html += '</div>';
      }

      document.getElementById('reminders-content').innerHTML = html;
    } catch (error) {
      document.getElementById('reminders-content').innerHTML = `
        <div class="empty-state">
          <p style="color: var(--danger);">加载失败：${error.message}</p>
        </div>
      `;
    }
  }

  // ===== 面试辅导 =====
  renderInterview(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">面试辅导</h1>
        <p class="page-subtitle">InterviewAgent 为你生成面试题并评估回答</p>
      </div>
      <div id="interview-content">
        <div class="card">
          <h3 class="card-title">开始模拟面试</h3>
          <div class="form-group">
            <label class="form-label">选择目标岗位（可选）</label>
            <select class="form-input" id="interview-job-select">
              <option value="">通用面试</option>
            </select>
          </div>
          <button class="btn btn-primary" id="start-interview-btn">🎤 开始面试</button>
        </div>
      </div>
    `;

    // 加载岗位列表
    api.job.list().then(result => {
      if (result.success && result.data) {
        const select = document.getElementById('interview-job-select');
        result.data.forEach(job => {
          const opt = document.createElement('option');
          opt.value = job.id;
          opt.textContent = `${job.title} @ ${job.company}`;
          select.appendChild(opt);
        });
      }
    });

    document.getElementById('start-interview-btn').addEventListener('click', () => {
      const jobId = document.getElementById('interview-job-select').value;
      this.startInterview(jobId);
    });
  }

  // 开始面试
  async startInterview(jobId) {
    document.getElementById('interview-content').innerHTML = '<div class="card"><div class="text-center"><div class="loading"></div><p class="mt-16">InterviewAgent 正在生成面试题...</p></div></div>';

    const result = await api.interview.start(jobId ? parseInt(jobId) : null);

    if (result.success && result.data) {
      this.interviewState = {
        id: result.data.id,
        questions: result.data.questions,
        currentIndex: 0,
        answers: [],
      };
      this.renderInterviewQuestion();
    } else {
      document.getElementById('interview-content').innerHTML = `<div class="card"><div class="alert alert-error">${result.message || '面试开始失败'}</div></div>`;
    }
  }

  // 渲染当前面试题
  renderInterviewQuestion() {
    const state = this.interviewState;
    const q = state.questions[state.currentIndex];
    const typeLabel = q.type === 'technical' ? '技术题' : '行为题';
    const diffLabel = { easy: '简单', medium: '中等', hard: '困难' }[q.difficulty] || q.difficulty;

    document.getElementById('interview-content').innerHTML = `
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <span class="tag">${typeLabel}</span>
            <span class="tag">${diffLabel}</span>
          </div>
          <span style="color: var(--text-secondary); font-size: 13px;">第 ${state.currentIndex + 1} / ${state.questions.length} 题</span>
        </div>
        <h3 style="font-size: 18px; margin-bottom: 16px;">${q.question}</h3>
        <div class="form-group">
          <textarea class="form-textarea" id="interview-answer" placeholder="请输入你的回答..."></textarea>
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" id="submit-answer-btn">提交回答</button>
          <button class="btn btn-secondary" id="skip-btn">跳过</button>
        </div>
        <div id="evaluation-result" class="mt-16"></div>
      </div>
    `;

    document.getElementById('submit-answer-btn').addEventListener('click', () => this.submitAnswer());
    document.getElementById('skip-btn').addEventListener('click', () => this.nextQuestion());
  }

  // 提交回答
  async submitAnswer() {
    const answer = document.getElementById('interview-answer').value.trim();
    if (!answer) {
      alert('请输入回答');
      return;
    }

    document.getElementById('evaluation-result').innerHTML = '<div class="text-center"><div class="loading"></div><p class="mt-16">正在评估回答...</p></div>';

    const result = await api.interview.answer(this.interviewState.id, answer);

    if (result.success && result.data) {
      const ev = result.data.evaluation;
      const levelLabels = { excellent: '优秀', good: '良好', average: '一般', needs_improvement: '待提升' };
      const levelColors = { excellent: 'var(--success)', good: 'var(--primary)', average: 'var(--warning)', needs_improvement: 'var(--danger)' };

      document.getElementById('evaluation-result').innerHTML = `
        <div style="border-top: 1px solid var(--border-light); padding-top: 16px;">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
            <div style="font-size: 36px; font-weight: 700; color: ${levelColors[ev.level]};">${ev.score}</div>
            <div>
              <div style="font-weight: 500;">${levelLabels[ev.level] || ev.level}</div>
              <div style="color: var(--text-secondary); font-size: 13px;">${ev.feedback}</div>
            </div>
          </div>
          ${ev.suggestions && ev.suggestions.length > 0 ? `
            <div style="margin-top: 8px;">
              <div style="font-weight: 500; margin-bottom: 4px;">💡 改进建议</div>
              <ul style="padding-left: 20px; color: var(--text-secondary);">
                ${ev.suggestions.map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <button class="btn btn-primary mt-16" id="next-q-btn">下一题 →</button>
        </div>
      `;
      document.getElementById('next-q-btn').addEventListener('click', () => this.nextQuestion());
    }
  }

  // 下一题
  nextQuestion() {
    this.interviewState.currentIndex++;
    if (this.interviewState.currentIndex >= this.interviewState.questions.length) {
      this.finishInterview();
    } else {
      this.renderInterviewQuestion();
    }
  }

  // 面试结束
  finishInterview() {
    document.getElementById('interview-content').innerHTML = `
      <div class="card">
        <div class="empty-state">
          <div class="icon">🎉</div>
          <h3>面试完成！</h3>
          <p>你已完成本次模拟面试，继续加油！</p>
          <button class="btn btn-primary mt-16" onclick="app.navigate('interview')">再来一次</button>
        </div>
      </div>
    `;
  }

  // ===== 技能图谱 =====
  renderSkills(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">技能图谱</h1>
        <p class="page-subtitle">SkillAgent 分析技能差距，推荐学习路径</p>
      </div>
      <div class="card">
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn-primary" id="analyze-skills-btn">🔍 分析技能差距</button>
          <button class="btn btn-secondary" id="learning-path-btn">📚 生成学习路径</button>
        </div>
      </div>
      <div id="skills-result" class="mt-16"></div>
    `;

    document.getElementById('analyze-skills-btn').addEventListener('click', async () => {
      document.getElementById('skills-result').innerHTML = '<div class="card"><div class="text-center"><div class="loading"></div><p class="mt-16">SkillAgent 正在分析技能差距...</p></div></div>';

      const result = await api.skill.gap();
      if (result.success && result.data) {
        this.renderSkillGap(result.data);
      } else {
        document.getElementById('skills-result').innerHTML = `<div class="card"><div class="alert alert-error">${result.message || '分析失败'}</div></div>`;
      }
    });

    document.getElementById('learning-path-btn').addEventListener('click', async () => {
      document.getElementById('skills-result').innerHTML = '<div class="card"><div class="text-center"><div class="loading"></div><p class="mt-16">SkillAgent 正在生成学习路径...</p></div></div>';

      const result = await api.skill.learningPath();
      if (result.success && result.data) {
        this.renderLearningPath(result.data);
      } else {
        document.getElementById('skills-result').innerHTML = `<div class="card"><div class="alert alert-error">${result.message || '生成失败'}</div></div>`;
      }
    });
  }

  // 渲染技能差距分析
  renderSkillGap(data) {
    const mastered = data.mastered || [];
    const missing = data.missing || [];
    const matchRate = data.match_rate || 0;
    const radar = data.radar || {};

    let radarHtml = '';
    if (Object.keys(radar).length > 0) {
      radarHtml = `
        <div class="card" style="margin-bottom: 16px;">
          <h3 class="card-title">📊 技能雷达图（按类别）</h3>
          ${Object.entries(radar).map(([cat, info]) => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                <span>${cat}</span>
                <span>${info.mastered}/${info.target} (${info.rate}%)</span>
              </div>
              <div style="background: var(--bg-secondary); border-radius: 4px; height: 8px; overflow: hidden;">
                <div style="background: var(--primary); height: 100%; width: ${info.rate}%; border-radius: 4px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    document.getElementById('skills-result').innerHTML = `
      <div class="card" style="margin-bottom: 16px;">
        <h3 class="card-title">📈 技能匹配概览</h3>
        <div style="display: flex; gap: 24px; align-items: center;">
          <div style="text-align: center;">
            <div style="font-size: 48px; font-weight: 700; color: var(--primary);">${matchRate}%</div>
            <div style="color: var(--text-secondary); font-size: 13px;">技能匹配率</div>
          </div>
          <div style="flex: 1;">
            <div style="margin-bottom: 8px;"><strong>已掌握 (${mastered.length})：</strong>${mastered.map(s => `<span class="tag tag-success">${s}</span>`).join('') || '无'}</div>
            <div><strong>待提升 (${missing.length})：</strong>${missing.map(s => `<span class="tag tag-danger">${s}</span>`).join('') || '无'}</div>
          </div>
        </div>
      </div>
      ${radarHtml}
    `;
  }

  // 渲染学习路径
  renderLearningPath(data) {
    const path = data.path || [];
    const totalHours = data.total_hours || 0;
    const totalWeeks = data.estimated_weeks || 0;

    if (path.length === 0) {
      document.getElementById('skills-result').innerHTML = `
        <div class="card"><div class="empty-state"><div class="icon">✅</div><h3>技能已全部掌握</h3><p>你已掌握所有目标岗位要求的技能！</p></div></div>
      `;
      return;
    }

    document.getElementById('skills-result').innerHTML = `
      <div class="card" style="margin-bottom: 16px;">
        <h3 class="card-title">📚 学习路径推荐</h3>
        <div style="color: var(--text-secondary); margin-bottom: 16px;">
          共 ${path.length} 项技能待学习，预计 ${totalHours} 小时（约 ${totalWeeks} 周）
        </div>
        ${path.map((item, idx) => `
          <div style="border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div>
                <strong>${idx + 1}. ${item.skill}</strong>
                <span class="tag" style="margin-left: 8px;">${item.level}</span>
              </div>
              <span style="font-size: 13px; color: var(--text-secondary);">⏱ ${item.estimated_hours}小时</span>
            </div>
            <div style="font-size: 13px; color: var(--text-secondary);">
              <strong>推荐资源：</strong>${item.resources.join('、')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 记录投递
  async trackJob(jobId) {
    try {
      const result = await api.application.create({ job_id: jobId, status: 'pending' });
      if (result.success) {
        alert('✅ 投递记录已添加，可在"投递跟踪"页面查看');
        this.navigate('applications');
      } else {
        alert(result.message || '记录失败');
      }
    } catch (e) {
      alert('记录投递失败: ' + e.message);
    }
  }
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
