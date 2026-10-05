// 全局配置
module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'job-agent-secret-key-2026',
  jwtExpiresIn: '7d',
  dbPath: process.env.DB_PATH || './data/job_agent.db',
  agentServiceUrl: process.env.AGENT_SERVICE_URL || 'http://localhost:5000',
};
