import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';

const compile = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpile(source, {module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64');
const dataUrl = compile(fs.readFileSync(new URL('../app/career-data.ts', import.meta.url), 'utf8'));
const {roles,emptyAssessment} = await import(dataUrl);
const signalsUrl = compile(fs.readFileSync(new URL('../app/ability-signals.ts', import.meta.url), 'utf8'));
const matchingSource = fs.readFileSync(new URL('../app/matching.ts', import.meta.url), 'utf8').replace("'./career-data'", JSON.stringify(dataUrl)).replaceAll("'./ability-signals'",JSON.stringify(signalsUrl));
const {matchCareers,abilityRoles,containsTerm} = await import(compile(matchingSource));
assert.equal(roles.length,70);
assert.equal(new Set(roles.map(role=>role.id)).size,roles.length);
assert.equal(new Set(roles.map(role=>role.title)).size,roles.length);
assert.ok(roles.every(r=>Object.values(abilityRoles).some(ids=>ids.includes(r.id))));
const profile = {...emptyAssessment,role:'星际园丁',industry:'其他行业',years:'3-5年',preferences:['研究模型'],coding:'可以写代码',travel:'可以出差'};
for (const [role,category] of [['会计','财务经营'],['市场专员','市场增长'],['销售','销售商务'],['文案','内容生产'],['内容生成','内容生产'],['行政文员','职能运营'],['客服','职能运营'],['翻译','内容生产']]) {
  const result=matchCareers({...profile,role,coding:'不想写代码'});
  assert.ok(result.recognizedTitle,role);
  assert.ok(result.matches.some(match=>match.role.category===category),`${role} should find its transition category`);
}
for (const ability of ['财务核算','市场营销','销售经营','文案写作']) {
  const result=matchCareers({...profile,evidence:`想学习${ability}`});
  assert.ok(!result.abilities.includes(ability));
  assert.equal(result.matches.length,0,`Learning ${ability} must not qualify`);
}
assert.ok(matchCareers({...profile,abilities:['数据分析']}).matches.every(match=>!match.role.transition),'Generic analytics must not establish a new domain.');
for (const role of roles.filter(role=>role.transition)) {
  assert.ok(role.transition.from && role.transition.automate && role.transition.human);
  assert.ok(role.transition.domain.every(label=>abilityRoles[label]?.includes(role.id)));
  const result=matchCareers({...profile,role:role.title,abilities:role.transition.domain,evidence:role.skills.join('，')});
  assert.ok(result.matches.some(match=>match.role.id===role.id),`${role.title} must be reachable`);
}
assert.equal(matchCareers(profile).matches.length,0,'Preferences and work constraints must not invent ability evidence.');
assert.equal(containsTerm('不会 Python','python'),false);
assert.equal(containsTerm('prose writing','ros'),false);
assert.equal(containsTerm('使用 ROS 控制机器人','ros'),true);
for (const evidence of ['想学习 Python 和机器学习','不熟悉 Python','Python 正在学习中','同事熟练掌握 Python','我会 Python，但我不会 Python']) {
  assert.equal(matchCareers({...profile,evidence}).abilities.includes('Python开发'),false,evidence);
  assert.equal(matchCareers({...profile,evidence}).matches.length,0,evidence);
}
assert.deepEqual(matchCareers({...profile,role:'前端开发'}).abilities,['前端开发']);
assert.deepEqual(matchCareers({...profile,role:'Java开发'}).abilities,['Java开发']);
assert.equal(containsTerm('熟练 Python 但不会 SQL','Python'),true);
assert.equal(containsTerm('熟练 Python 但不会 SQL','SQL'),false);
const conflict = matchCareers({...profile,abilities:['Python开发'],evidence:'Python不熟悉'});
assert.deepEqual(conflict.conflicts,['Python开发']);
assert.equal(conflict.abilities.includes('Python开发'),false);
assert.deepEqual(matchCareers({...profile,evidence:'想学习 Python 和机器学习'}).learningAbilities,['Python开发','模型算法']);
assert.deepEqual(matchCareers({...profile,industry:''}),matchCareers({...profile,industry:'制造与汽车'}),'Industry is explicitly context-only, not a hidden ranking input.');
const limited = matchCareers({...profile,abilities:['数据分析']});
assert.equal(limited.hasStrongMatch,false);
assert.ok(limited.matches.every(m=>!m.supported));
assert.equal(limited.recognizedTitle,false);
const noCode = matchCareers({...profile,abilities:['Python开发','项目交付','软硬件开发'],coding:'不想写代码'});
assert.ok(noCode.matches.every(m=>!['模型算法','工程平台','智能硬件','具身智能','垂直行业'].includes(m.role.category)&&m.role.id!==21));
const scientist = matchCareers({...profile,role:'科研工程师',abilities:['科研实验','模型算法'],evidence:'使用科学计算与机器学习做材料研究'});
assert.equal(scientist.matches[0].role.id,50);
assert.equal(scientist.matches[0].supported,true);
const {directJobs,directJobsForRole,recruitmentCheckedAt} = await import(compile(fs.readFileSync(new URL('../app/recruitment.ts',import.meta.url),'utf8')));
assert.ok(directJobs.length >= 10);
assert.equal(new Set(directJobs.map(job=>job.url)).size,directJobs.length,'No duplicate vacancies.');
assert.match(recruitmentCheckedAt,/^\d{4}-\d{2}-\d{2}$/);
for (const job of directJobs) {
  const url=new URL(job.url);
  assert.equal(url.protocol,'https:');
  assert.equal(url.search,'','No search or tracking routes.');
  assert.ok(
    (url.hostname==='www.zhaopin.com' && /^\/jobdetail\/[A-Za-z0-9]+\.htm$/.test(url.pathname)) ||
    (url.hostname==='www.zhipin.com' && /^\/job_detail\/[A-Za-z0-9_-]+\.html$/.test(url.pathname)) ||
    (url.hostname==='www.amazon.jobs' && /^\/en\/jobs\/\d+\/[a-z0-9-]+$/.test(url.pathname)),
    'Only specific employer or recruitment-platform job details are allowed.'
  );
  assert.ok(job.roleIds.length && job.roleIds.every(id=>roles.some(r=>r.id===id)));
}
assert.ok(directJobsForRole(21).every(job=>/FDE/.test(job.title)));
assert.deepEqual(directJobsForRole(50),[],'Uncovered roles must not get unrelated or search fallback links.');
assert.deepEqual(directJobsForRole(-1),[]);
const {screenJob} = await import(compile(fs.readFileSync(new URL('../app/job-screening.ts',import.meta.url),'utf8')));
const productJob=directJobs.find(j=>j.title==='AI产品经理');
assert.equal(screenJob(productJob,{city:'',education:'',relevantYears:''}).status,'pending');
assert.equal(screenJob(productJob,{city:'北京',education:'本科',relevantYears:'2'}).status,'basic');
assert.equal(screenJob(productJob,{city:'上海',education:'本科',relevantYears:'2'}).status,'conflict');
assert.equal(screenJob(productJob,{city:'不限',education:'大专',relevantYears:'2'}).status,'conflict');
assert.equal(screenJob(productJob,{city:'不限',education:'硕士',relevantYears:'0'}).status,'conflict');
assert.equal(screenJob(productJob,{city:'不限',education:'硕士',relevantYears:'7'}).status,'pending');
for (const relevantYears of ['-1','NaN','Infinity','61']) assert.equal(screenJob(productJob,{city:'不限',education:'硕士',relevantYears}).status,'pending');
assert.equal(screenJob(directJobs.find(j=>j.source==='BOSS直聘'),{city:'不限',education:'博士',relevantYears:'6'}).status,'pending');

const listeners = new EventTarget();
globalThis.window = listeners;
const memory = new Map();
globalThis.localStorage = {getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
const {savedSnapshot,serverSnapshot,subscribeSaved,writeSaved} = await import(compile(fs.readFileSync(new URL('../app/saved-careers.ts',import.meta.url),'utf8')));
let notified=0;
const unsubscribe=subscribeSaved(()=>notified++);
assert.equal(serverSnapshot(),'[]');
assert.equal(writeSaved([21,50]),true);
assert.deepEqual(JSON.parse(savedSnapshot()),[21,50]);
assert.equal(notified,1);
localStorage.setItem=()=>{throw new Error('Storage disabled');};
assert.equal(writeSaved([50]),false);
assert.deepEqual(JSON.parse(savedSnapshot()),[50],'Blocked storage must retain session bookmarks.');
unsubscribe();
console.log('Passed: coverage, unknown input, preference isolation, negation, token boundaries, weak evidence, coding constraints, science ranking, links and bookmark storage fallback.');
