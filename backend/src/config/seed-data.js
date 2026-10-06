// 示例数据种子脚本
const { initDatabase, prepare } = require('./database');

const seedJobs = [
  {
    title: 'AI Agent 开发实习生',
    company: '字节跳动',
    location: '北京',
    salary: '300-500/天',
    type: '实习',
    requirements: ['Python', 'LLM', 'Agent 框架', 'Prompt Engineering'],
    responsibilities: '参与 AI Agent 系统的设计与开发，优化 Prompt 工程，提升 Agent 任务完成率',
    tags: ['AI', 'Agent', 'LLM'],
    source: '官网',
    posted_date: '2026-10-01',
    deadline: '2026-10-31',
    application_url: 'https://jobs.bytedance.com/campus/internship',
  },
  {
    title: '前端开发实习生',
    company: '腾讯',
    location: '深圳',
    salary: '200-350/天',
    type: '实习',
    requirements: ['JavaScript', 'React', 'HTML/CSS', 'Node.js'],
    responsibilities: '负责 Web 前端开发，参与组件库建设，优化页面性能',
    tags: ['前端', 'React', 'Web'],
    source: '官网',
    posted_date: '2026-10-02',
    deadline: '2026-10-30',
    application_url: 'https://join.qq.com',
  },
  {
    title: '后端开发实习生',
    company: '阿里巴巴',
    location: '杭州',
    salary: '250-400/天',
    type: '实习',
    requirements: ['Node.js', 'Express', 'SQLite', 'MySQL', 'Redis'],
    responsibilities: '参与后端服务开发，设计 RESTful API，优化数据库查询',
    tags: ['后端', 'Node.js', '数据库'],
    source: '官网',
    posted_date: '2026-10-03',
    deadline: '2026-11-15',
    application_url: 'https://campus.alibaba.com',
  },
  {
    title: '全栈开发实习生',
    company: '美团',
    location: '北京',
    salary: '250-380/天',
    type: '实习',
    requirements: ['Node.js', 'React', 'SQL', 'Docker'],
    responsibilities: '负责全栈功能开发，从前端到后端的完整实现',
    tags: ['全栈', 'Node.js', 'React'],
    source: '内推',
    posted_date: '2026-10-04',
    deadline: '2026-10-25',
    application_url: 'https://campus.meituan.com',
  },
  {
    title: '算法工程师实习生',
    company: '百度',
    location: '北京',
    salary: '300-500/天',
    type: '实习',
    requirements: ['Python', '机器学习', '深度学习', 'PyTorch'],
    responsibilities: '参与推荐算法研发，数据清洗与特征工程，模型训练与调优',
    tags: ['算法', '机器学习', 'Python'],
    source: '官网',
    posted_date: '2026-10-05',
    deadline: '2026-11-01',
    application_url: 'https://talent.baidu.com/jobs/intern',
  },
  {
    title: '产品经理实习生',
    company: '小红书',
    location: '上海',
    salary: '200-300/天',
    type: '实习',
    requirements: ['产品设计', '数据分析', '沟通能力', 'Axure'],
    responsibilities: '参与产品需求分析，撰写 PRD，跟进产品迭代',
    tags: ['产品', '数据分析'],
    source: '官网',
    posted_date: '2026-10-01',
    deadline: '2026-10-20',
    application_url: 'https://job.xiaohongshu.com',
  },
];

const seedData = async () => {
  await initDatabase();

  // 检查是否已有数据
  const count = prepare('SELECT COUNT(*) as cnt FROM jobs').get();
  if (count.cnt > 0) {
    console.log(`ℹ️  已有 ${count.cnt} 条岗位数据，跳过种子数据`);
    setTimeout(() => process.exit(0), 100);
    return;
  }

  // 插入示例岗位
  for (const job of seedJobs) {
    prepare(
      `INSERT INTO jobs (title, company, location, salary, type, requirements, responsibilities, tags, source, posted_date, deadline, application_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      job.title,
      job.company,
      job.location,
      job.salary,
      job.type,
      JSON.stringify(job.requirements),
      job.responsibilities,
      JSON.stringify(job.tags),
      job.source,
      job.posted_date,
      job.deadline,
      job.application_url
    );
  }

  console.log(`✅ 成功插入 ${seedJobs.length} 条示例岗位数据`);
  setTimeout(() => process.exit(0), 100);
};

seedData().catch((err) => {
  console.error('❌ 种子数据插入失败:', err);
  setTimeout(() => process.exit(1), 100);
});
