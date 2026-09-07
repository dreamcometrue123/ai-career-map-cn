import type { DirectJob } from './recruitment';

export type JobPreferences = { city: string; education: string; relevantYears: string };
export const emptyJobPreferences: JobPreferences = { city:'', education:'', relevantYears:'' };
const educationRank: Record<string,number> = { '高中及以下':0, '大专':1, '本科':2, '硕士':3, '博士':4 };

export function screenJob(job: DirectJob, profile: JobPreferences) {
  const conflicts: string[] = [], pending: string[] = [], checked: string[] = [];
  if (!profile.city) pending.push('未填写意向城市');
  else if (profile.city !== '不限' && profile.city !== job.city) conflicts.push('工作地点为' + job.city);
  else checked.push('城市符合偏好');

  const degree = ['博士','硕士','本科','大专'].find(d=>job.experience.includes(d));
  if (!(profile.education in educationRank)) pending.push('未填写最高已取得学历');
  else if (!degree) pending.push('职位学历要求未核实');
  else if (educationRank[profile.education] < educationRank[degree]) conflicts.push('页面要求' + degree + '及以上');
  else checked.push('学历达到页面门槛');

  const range = job.experience.match(/(\d+)\s*-\s*(\d+)年/);
  const minimum = range ? Number(range[1]) : Number(job.experience.match(/(\d+)年以上/)?.[1]);
  const years = Number(profile.relevantYears);
  if (!profile.relevantYears.trim() || !Number.isFinite(years) || years < 0 || years > 60) pending.push('未填写有效的相关岗位经验年限');
  else if (!Number.isFinite(minimum)) pending.push('职位经验要求未核实');
  else if (years < minimum) conflicts.push('页面要求至少' + minimum + '年相关经验');
  else if (range && years > Number(range[2])) pending.push('经验超出页面区间，需确认职级与薪资预期');
  else checked.push('经验年限达到页面门槛');

  if (job.verification === '平台验证') pending.push('平台完整职位详情尚未核实');
  // The FDE source's list label and body have different experience requirements.
  if (job.url.includes('CC000520810J40943876808')) pending.push('列表标注3–5年，但正文要求5年以上技术背景及2年以上现场AI项目经验');
  const status: 'conflict' | 'pending' | 'basic' = conflicts.length ? 'conflict' : pending.length ? 'pending' : 'basic';
  return { status, label: status === 'conflict' ? '存在条件不符' : status === 'pending' ? '条件待核实' : '基本条件未见冲突', conflicts, pending, checked };
}
