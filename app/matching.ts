import { roles, type Assessment } from './career-data';
import { containsTerm, termSignal } from './ability-signals';
export { containsTerm } from './ability-signals';

// Explicit transferable abilities. Array order carries no scoring weight.
export const abilityRoles: Record<string, number[]> = {
  '财务核算': [51,53,54], '财务分析': [52],
  '市场营销': [55,56,57,58], '销售经营': [59,60,61,62],
  '文案写作': [18,56,58,62,63,64,65], '视频制作': [41,64],
  '行政流程': [67], '客户服务': [37,40,68],
  '人力资源': [69,70], '翻译编辑': [66],
  '业务分析': [13,14,15,21,37,38,39,20], '客户沟通': [14,15,21,37,38,39],
  '产品设计': [13,16,17,40], '项目交付': [14,21,37,38,39],
  'Python开发': [1,2,3,5,6,9,10,22,23,24,25,26,27,30,32,33,34,35,36,50],
  '前端开发': [5,33], 'Java开发': [5,6,30,32,33], '通用软件开发': [5,6,30,32,33],
  '数据分析': [9,10,11,13,25,26,34,35,36,42,52,54,55,56,57,58,59],
  '模型算法': [1,2,3,4,6,10,22,23,24,25,26,27,34,35,47,48,50],
  '内容创意': [11,17,18,40,41,63,65,70], '风险合规': [12,19,42,43,54],
  '团队管理': [20,37,38,39], '系统运维': [7,8,28,29,30,32,46],
  '软硬件开发': [4,8,28,29,31,44,45,46], '机器人/控制': [47,48,49],
  '科研实验': [1,2,22,23,24,27,47,50],
};
const synonyms: Record<string, string[]> = {
  '财务核算': ['财务','会计','出纳','记账','应收应付','费用审核','报销审核'],
  '财务分析': ['财务分析','预算分析','预算专员','经营分析','财务建模','fp&a'],
  '市场营销': ['市场','营销','广告投放','投放优化','用户增长','市场调研','电商运营','店铺运营','商品运营','商品编辑','crm运营'],
  '销售经营': ['销售','商务','投标','标书','线索运营','商机管理'],
  '文案写作': ['文案','写作','撰稿','写手','编辑','脚本创作'],
  '视频制作': ['视频制作','剪辑','编导','分镜'],
  '行政流程': ['行政','文员','资料录入','办公流程','办公自动化'],
  '客户服务': ['客服','售后服务','呼叫中心','客户投诉'],
  '人力资源': ['人力资源','招聘专员','人事','hr','培训专员','课程运营','内训师'],
  '翻译编辑': ['翻译','笔译','双语','本地化','术语管理'],
  '业务分析': ['业务分析','需求分析','业务建模','流程梳理','咨询顾问'],
  '客户沟通': ['客户沟通','客户访谈','售前','客户成功','客户经营'],
  '产品设计': ['产品设计','产品经理','用户研究','交互设计','ux'],
  '项目交付': ['项目交付','项目管理','项目经理','实施顾问','上线验收'],
  'Python开发': ['python'],
  '前端开发': ['前端开发','react','vue','javascript','typescript'],
  'Java开发': ['java','spring'],
  '通用软件开发': ['后端开发','全栈开发','软件开发'],
  '数据分析': ['数据分析','sql','统计分析','数据工程','数据标注'],
  '模型算法': ['模型算法','机器学习','深度学习','算法工程师','pytorch'],
  '内容创意': ['内容策划','内容创作','内容生成','内容运营','自媒体','文案','视频制作','新媒体','影视'],
  '风险合规': ['风险合规','法律','法务','合规','审计','风控','隐私'],
  '团队管理': ['团队管理','组织变革','战略规划'],
  '系统运维': ['运维','云计算','kubernetes','devops','基础设施'],
  '软硬件开发': ['硬件','芯片','npu','cuda','嵌入式','c++'],
  '机器人/控制': ['机器人','运动控制','自动驾驶','ros','具身'],
  '科研实验': ['科研','科学计算','科学研究','药物研发','材料研究'],
};
const splitSkills = (skill: string) => [skill, ...skill.split('/')];
export function matchCareers(a: Assessment) {
  const background = `${a.role}。${a.evidence}`;
  const signalGroups = Object.entries(synonyms).map(([label,terms]) => {
    const states = terms.map(term=>termSignal(background,term)).filter(state=>state!=='absent');
    const blocked = states.some(state=>state!=='stated');
    return {label,states,blocked};
  });
  const inferred = signalGroups.filter(g=>g.states.includes('stated')&&!g.blocked).map(g=>g.label);
  const conflicts = signalGroups.filter(g=>g.blocked&&a.abilities.includes(g.label)).map(g=>g.label);
  const learningAbilities = signalGroups.filter(g=>g.states.includes('learning')).map(g=>g.label);
  const deniedAbilities = signalGroups.filter(g=>g.states.includes('denied')).map(g=>g.label);
  const uncertainAbilities = signalGroups.filter(g=>g.states.includes('uncertain')).map(g=>g.label);
  const abilities = [...new Set([...a.abilities.filter(x=>x in abilityRoles&&!conflicts.includes(x)), ...inferred])];
  const ranked = roles.map(role => {
    const matchedAbilities = abilities.filter(x=>abilityRoles[x].includes(role.id));
    const skills = role.skills.filter(skill=>splitSkills(skill).some(term=>containsTerm(background,term)));
    const evidenceSkills = role.skills.filter(skill=>splitSkills(skill).some(term=>containsTerm(a.evidence,term)));
    const named = [role.title,...role.aliases.split('、')].some(term=>containsTerm(a.role,term));
    const sourceNamed = role.transition?.from.split('、').some(term=>containsTerm(a.role,term)) ?? false;
    // General data skills alone do not establish accounting, marketing or sales experience.
    if (role.transition && !role.transition.domain.some(label=>abilities.includes(label)) && !named) return null;
    const technical = ['模型算法','工程平台','智能硬件','具身智能','垂直行业'].includes(role.category) || [9,12,21,34,35,36].includes(role.id);
    const constraints: string[] = [];
    if (technical && a.coding === '不想写代码') return null;
    if (technical && a.coding === '愿意学习') constraints.push('需要编程实践；愿意学习尚不能证明已具备能力');
    if (a.years === '0-1年' && role.level === '3年以上') constraints.push('典型方向通常需要3年以上相关经验');
    if (a.years === '1-3年' && role.level === '3年以上') constraints.push('需要核实相关工作经验是否达到要求');
    if (role.id === 21 && a.travel === '不接受出差') constraints.push('部分FDE岗位要求驻场或出差，请核实职位要求');
    const evidenceCount = matchedAbilities.length + skills.length;
    if (!evidenceCount && !named) return null;
    const preference = a.preferences.some(p => ({'研究模型':'模型算法','开发系统':'工程平台','与客户合作':'产品交付','设计产品':'交互创意','分析数据':'数据评测','内容创作':'交互创意','治理战略':'治理战略','软硬件优化':'智能硬件','机器人系统':'具身智能','科学研究':'垂直行业'}[p] === role.category));
    const points = Math.min(3,matchedAbilities.length)*3 + skills.length*4 + evidenceSkills.length*2 + (named?1:0) + (sourceNamed?2:0) + (preference?1:0) - constraints.length*3;
    const supported = matchedAbilities.length >= 2 && evidenceSkills.length >= 1 && !constraints.length;
    return {role,points,matchedAbilities,skills,constraints,band:supported?'值得优先核实':'探索方向',supported,gaps:role.skills.filter(x=>!skills.includes(x)),reasons:[...matchedAbilities.map(x=>`${x}：${a.abilities.includes(x)?'你选择的能力':'从职位或项目描述中识别'}`),...skills.map(x=>`${x}：在你的描述中出现`)]};
  }).filter((x): x is NonNullable<typeof x> => x !== null).sort((a,b)=>b.points-a.points || a.role.id-b.role.id);
  const matches = ranked.slice(0,5);
  return {matches,abilities,learningAbilities,deniedAbilities,uncertainAbilities,conflicts,recognizedTitle:Object.values(synonyms).some(terms=>terms.some(t=>containsTerm(a.role,t))) || roles.some(r=>[r.title,...r.aliases.split('、')].some(t=>containsTerm(a.role,t))),hasStrongMatch:matches.some(x=>x.supported)};
}
