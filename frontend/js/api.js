// API 客户端 - 统一封装请求和响应处理
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(method, path, data = null) {
    const url = `${API_BASE}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    };

    if (this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      // 统一处理 401 未授权
      if (response.status === 401) {
        this.setToken(null);
        if (window.app) {
          window.app.showAuth();
        }
        return result;
      }

      return result;
    } catch (error) {
      console.error('API 请求错误:', error);
      return {
        success: false,
        message: '网络请求失败，请检查网络连接',
      };
    }
  }

  // 认证接口
  auth = {
    register: (data) => this.request('POST', '/auth/register', data),
    login: (data) => this.request('POST', '/auth/login', data),
    getProfile: () => this.request('GET', '/auth/profile'),
    updateProfile: (data) => this.request('PUT', '/auth/profile', data),
  };

  // 简历接口
  resume = {
    upload: (data) => this.request('POST', '/resumes', data),
    list: () => this.request('GET', '/resumes'),
    get: (id) => this.request('GET', `/resumes/${id}`),
    update: (id, data) => this.request('PUT', `/resumes/${id}`, data),
    delete: (id) => this.request('DELETE', `/resumes/${id}`),
  };

  // 岗位接口
  job = {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request('GET', `/jobs${query ? '?' + query : ''}`);
    },
    get: (id) => this.request('GET', `/jobs/${id}`),
    create: (data) => this.request('POST', '/jobs', data),
    update: (id, data) => this.request('PUT', `/jobs/${id}`, data),
    delete: (id) => this.request('DELETE', `/jobs/${id}`),
    recommend: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request('GET', `/jobs/recommend${query ? '?' + query : ''}`);
    },
    screenRecommend: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request('GET', `/jobs/screen-recommend${query ? '?' + query : ''}`);
    },
  };

  // 投递接口
  application = {
    create: (data) => this.request('POST', '/applications', data),
    list: () => this.request('GET', '/applications'),
    get: (id) => this.request('GET', `/applications/${id}`),
    updateStatus: (id, status) => this.request('PUT', `/applications/${id}/status`, { status }),
    stats: () => this.request('GET', '/applications/stats'),
    detailedStats: () => this.request('GET', '/applications/stats/detailed'),
    reminders: () => this.request('GET', '/applications/reminders'),
  };

  // 面试接口
  interview = {
    start: (jobId) => this.request('POST', '/interviews/start', { job_id: jobId }),
    answer: (id, answer) => this.request('POST', `/interviews/${id}/answer`, { answer }),
    get: (id) => this.request('GET', `/interviews/${id}`),
    list: () => this.request('GET', '/interviews'),
  };

  // 技能接口
  skill = {
    gap: () => this.request('GET', '/skills/gap'),
    learningPath: () => this.request('GET', '/skills/learning-path'),
  };
}

// 全局 API 实例
const api = new ApiClient();
