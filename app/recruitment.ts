export type DirectJob = {
  title: string; company: string; city: string; experience: string; salary: string;
  source: '企业官网' | 'BOSS直聘' | '智联招聘'; url: string; roleIds: number[];
  verification: '详情可读' | '平台验证';
};

// Manually checked on this date, not a real-time feed or a guarantee of vacancies.
export const recruitmentCheckedAt = '2026-09-07';
export const directJobs: DirectJob[] = [
  {title:'AI Agent Engineer, ARTS',company:'亚马逊中国',city:'北京',experience:'1年以上相关经验 · 本科',salary:'页面未公开薪资',source:'企业官网',url:'https://www.amazon.jobs/en/jobs/10451070/ai-agent-engineer-arts',roleIds:[3,5],verification:'详情可读'},
  {title:'前沿部署工程师（FDE）',company:'科大讯飞',city:'北京',experience:'5-10年 · 本科',salary:'20-40K',source:'BOSS直聘',url:'https://www.zhipin.com/job_detail/e417cce0a837af040nF82t20GFBZ.html',roleIds:[21],verification:'平台验证'},
  {title:'FDE工程师（央企平台）',company:'中电信数智科技有限公司',city:'北京',experience:'3-5年 · 本科',salary:'页面未公开薪资',source:'智联招聘',url:'https://www.zhaopin.com/jobdetail/CC000520810J40943876808.htm',roleIds:[21],verification:'详情可读'},
  {title:'Agent开发工程师',company:'科大讯飞',city:'合肥',experience:'3-5年 · 本科',salary:'15-20K · 14薪',source:'BOSS直聘',url:'https://www.zhipin.com/job_detail/9abf19e05b52e5460nJ-3N65EFZQ.html',roleIds:[5],verification:'平台验证'},
  {title:'高级RAG工程师（Agent方向）',company:'成都迈思信息技术有限公司',city:'成都',experience:'5-10年 · 大专',salary:'页面未公开薪资',source:'智联招聘',url:'https://www.zhaopin.com/jobdetail/CC153170410J40946840402.htm',roleIds:[5,6],verification:'详情可读'},
  {title:'AI产品经理',company:'智联招聘',city:'北京',experience:'1-3年 · 本科',salary:'页面未公开薪资',source:'智联招聘',url:'https://www.zhaopin.com/jobdetail/CC120019970J40849742803.htm',roleIds:[13],verification:'详情可读'},
  {title:'AIGC UI设计师',company:'北京华通时代科技发展有限公司',city:'北京',experience:'3-5年 · 本科',salary:'页面未公开薪资',source:'智联招聘',url:'https://www.zhaopin.com/jobdetail/CC411076020J40912046504.htm',roleIds:[16],verification:'详情可读'},
  {title:'AIGC设计师',company:'世华软(北京)技术有限公司',city:'北京',experience:'3-5年 · 本科',salary:'1.5-2万元/月',source:'智联招聘',url:'https://www.zhaopin.com/jobdetail/CCL1480544120J40755002916.htm',roleIds:[18,41],verification:'详情可读'},
  {title:'大模型评测',company:'上海微创软件股份有限公司',city:'北京',experience:'1-3年 · 本科',salary:'页面未公开薪资',source:'智联招聘',url:'https://www.zhaopin.com/jobdetail/CC000638920J40875167514.htm',roleIds:[10,11,35],verification:'详情可读'},
  {title:'高级语音算法工程师',company:'科大讯飞',city:'合肥',experience:'3-5年 · 本科',salary:'30-50K · 15薪',source:'BOSS直聘',url:'https://www.zhipin.com/job_detail/cbffda02f492d8e10nF-29-6FFtW.html',roleIds:[24],verification:'平台验证'},
];

export function directJobsForRole(roleId: number) {
  return directJobs.filter(job => job.roleIds.includes(roleId));
}

export type CompanyLead = {
  company: string; title: string; city: string; roleIds: number[];
  sourceUrl: string; checkedAt: string;
};

// Listing evidence only: deliberately separate from direct vacancy URLs.
export const companyLeads: CompanyLead[] = [
  {company:'同花顺',title:'AI infra 算法工程师',city:'杭州',roleIds:[7,28,29],sourceUrl:'https://www.zhipin.com/zhaopin/d1855aec3ccd6d1f1XBy3dS8/',checkedAt:'2026-09-07'},
  {company:'BOSS直聘（招聘企业）',title:'AI Infra 工程师',city:'北京',roleIds:[7,28],sourceUrl:'https://www.zhipin.com/zhaopin/cc8bb52947b030431nx83967/',checkedAt:'2026-09-07'},
  {company:'灵核数智',title:'CSM客户成功(A230943)',city:'杭州',roleIds:[37],sourceUrl:'https://www.zhipin.com/zhaopin/519ee30c491170f91n1-2d67Ew~~/',checkedAt:'2026-09-07'},
  {company:'浙江天怀数智科技',title:'CSM客户成功（AI方向）',city:'杭州',roleIds:[37],sourceUrl:'https://www.zhipin.com/zhaopin/519ee30c491170f91n1-2d67Ew~~/',checkedAt:'2026-09-07'},
];

export function companyLeadsForRole(roleId: number) {
  return companyLeads.filter(lead => lead.roleIds.includes(roleId));
}

export const recruitmentCompanies = [...new Set([
  ...directJobs.map(job => job.company), ...companyLeads.map(lead => lead.company),
])];

export function verificationNote(job: DirectJob) {
  return job.verification === '平台验证'
    ? '已核对职位链接；BOSS 可能要求登录或安全验证，完整详情待核实'
    : '已核对详情；是否仍在招聘，以原页面为准';
}
