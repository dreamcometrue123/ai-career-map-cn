"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Bookmark, BriefcaseBusiness, ChevronRight, Compass, ExternalLink, MapPin, Search, Sparkles, X } from "lucide-react";

import { roles, categories, abilityOptions, preferenceOptions, emptyAssessment, type Role, type Category, type Level, type Assessment } from './career-data';
import { matchCareers } from './matching';
import { screenJob, emptyJobPreferences, type JobPreferences } from './job-screening';
import { savedSnapshot, serverSnapshot, subscribeSaved, writeSaved } from './saved-careers';

import { directJobs, directJobsForRole, recruitmentCheckedAt, verificationNote, companyLeads, companyLeadsForRole, recruitmentCompanies, type CompanyLead } from './recruitment';

const matchingStages = ['整理能力信号', `对照 ${roles.length} 个岗位方向`, '整理推荐与招聘入口'];
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function CompanyClues({leads}: {leads: CompanyLead[]}) {
  return <div className="company-clues">{leads.map(lead => <article key={lead.company}>
    <strong>{lead.company}</strong><p>{lead.title} · {lead.city}</p>
    <p>在 BOSS 内搜索：<b>{lead.company.replace('（招聘企业）','')} {lead.title}</b></p>
    <details><summary>招聘记录 · 当前在招状态待核实</summary><p>核对日期：{lead.checkedAt}。已发现平台招聘列表记录，暂未核实直达详情。请在平台核对公司、城市及职位名称。</p><a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">查看记录来源（列表页，非投递入口） <ExternalLink size={13}/></a></details>
  </article>)}</div>;
}

function JobLinks({roleId, profile}: {roleId: number; profile: JobPreferences}) {
  const transition = roles.find(role=>role.id===roleId)?.transition;
  const jobs = directJobsForRole(roleId).map(job=>({job,check:screenJob(job,profile)}))
    .sort((a,b)=>({basic:0,pending:1,conflict:2}[a.check.status]-{basic:0,pending:1,conflict:2}[b.check.status]));
  const leads = companyLeadsForRole(roleId);
  return <div className="direct-job-links">
    {transition && <details className="match-note"><summary>传统职业 → AI 转型路径</summary><p><b>原职业：</b>{transition.from}</p><p><b>可尝试自动化的任务：</b>{transition.automate}</p><p><b>仍需人工负责：</b>{transition.human}</p><p>这是本站整理的转型方向，不是已核实的在招职位，也不代表整个职业会被替代。自动化效果取决于任务、数据质量和人工复核。</p></details>}
    <span className="direct-job-label">方向相关招聘 · {jobs.length} 个职位</span><a className="conditions-link" href="#job-conditions">核对城市、学历与经验 <ArrowRight size={13}/></a>
    {jobs.length ? jobs.map(({job,check}) => <div className="screened-job" key={job.url}>
      <span className={`screening-status ${check.status}`}>{check.label}</span>
      <p className="screening-reasons">{[...check.conflicts,...check.pending,...check.checked].join('；')}</p>
      <a href={job.url} target="_blank" rel="noopener noreferrer">
        <div><strong>{job.title}</strong><span>{job.company} · {job.city} · {job.source}</span><small>{job.experience} · {job.salary}</small><small>{verificationNote(job)}</small></div>
        <span className="direct-cta">看职位 <ExternalLink size={14}/></span>
      </a>
    </div>) : <p>{leads.length ? '暂缺已核实的职位直达链接，可按以下公司和职位名称查找。' : '暂未核实到该方向的具体招聘或公司线索，可先收藏方向。'}</p>}
    {jobs.length > 0 && <p className="screening-disclaimer">仅核对上述基本条件，不代表技能、专业、项目背景符合，也不保证职位仍在招。</p>}
    {leads.length > 0 && <><h4>相关招聘公司线索</h4><CompanyClues leads={leads}/></>}
  </div>;
}

export default function Home() {
  const [assessment, setAssessment] = useState<Assessment>(emptyAssessment);
  const [submittedAssessment, setSubmittedAssessment] = useState<Assessment | null>(null);
  const [step, setStep] = useState(1);
  const [matchingPhase, setMatchingPhase] = useState<number | null>(null);
  const matchingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const matchingActive = useRef(false);
  const resultRef = useRef<HTMLElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const [resultVersion, setResultVersion] = useState(0);
  useEffect(() => () => { matchingTimers.current.forEach(clearTimeout); }, []);
  useEffect(() => {
    if (matchingPhase === 0) processRef.current?.focus({preventScroll:true});
  }, [matchingPhase]);
  useEffect(() => {
    if (!resultVersion) return;
    resultRef.current?.focus({preventScroll:true});
    resultRef.current?.scrollIntoView({behavior:reduceMotion() ? 'instant' : 'smooth',block:'start'});
  }, [resultVersion]);
  const [jobPreferences, setJobPreferences] = useState<JobPreferences>(emptyJobPreferences);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "全部">("全部");
  const [level, setLevel] = useState<Level | "全部">("全部");
  const [selected, setSelected] = useState<Role | null>(null);
  const savedRaw = useSyncExternalStore(subscribeSaved, savedSnapshot, serverSnapshot);
  const saved = useMemo<number[]>(() => {
    try {
      const items = JSON.parse(savedRaw);
      return Array.isArray(items) ? [...new Set(items.filter((id: unknown): id is number => typeof id === 'number' && roles.some(r => r.id === id)))] : [];
    } catch { return []; }
  }, [savedRaw]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!selected || !dialogRef.current) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, [selected]);
  const filtered = useMemo(() => roles.filter((role) => {
    const text = `${role.title}${role.aliases}${role.summary}${role.skills.join("")}${role.transition?.from || ""}${role.transition?.automate || ""}`.toLowerCase();
    return (category === "全部" || role.category === category) && (level === "全部" || role.level === level) && (!savedOnly || saved.includes(role.id)) && query.trim().toLowerCase().split(/\s+/).every(term => text.includes(term));
  }), [query, category, level, savedOnly, saved]);
  const result = useMemo(() => submittedAssessment ? matchCareers(submittedAssessment) : null, [submittedAssessment]);
  const matches = result?.matches || [];
  const reviseAssessment = () => { setStep(2); document.getElementById("top")?.scrollIntoView({behavior:"smooth"}); };
  const toggleMulti = (field: "abilities" | "preferences", value: string) => setAssessment((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }));
  const cancelMatching = () => {
    matchingTimers.current.forEach(clearTimeout);
    matchingTimers.current = [];
    matchingActive.current = false;
    setMatchingPhase(null);
    requestAnimationFrame(() => submitRef.current?.focus());
  };
  const completeAssessment = () => {
    if (matchingActive.current) return;
    matchingActive.current = true;
    const snapshot = {...assessment, abilities:[...assessment.abilities], preferences:[...assessment.preferences]};
    const finish = () => {
      setSubmittedAssessment(snapshot);
      setMatchingPhase(null);
      setResultVersion(v => v + 1);
      matchingActive.current = false;
      matchingTimers.current = [];
    };
    if (reduceMotion()) { finish(); return; }
    setMatchingPhase(0);
    matchingTimers.current = [
      setTimeout(() => setMatchingPhase(1), 450),
      setTimeout(() => setMatchingPhase(2), 900),
      setTimeout(finish, 1450),
    ];
  };
  const toggleSave = (id: number) => {
    const success = writeSaved(saved.includes(id) ? saved.filter(item => item !== id) : [...saved,id]);
    setStorageNotice(success ? '' : '浏览器未允许保存收藏，本次可用，刷新后可能丢失。');
  };

  return <main className="app-frame">
    <header className="app-header">
      <a className="logo" href="#top"><span>AI</span>职业地图</a>
      <span className="edition"><i /> CAREER ATLAS</span>
    </header>
    <section className="hero matcher-hero" id="top">
      <p className="hero-eyebrow"><span /> INTERACTIVE CAREER ATLAS</p>
      <h1>你的能力，<br />通往 <em>AI 新职业</em></h1>
      <div className="hero-facts"><span><b>{roles.length}</b> 岗位方向</span><span><b>{categories.length-1}</b> 职业类别</span><a href="#roles">探索岗位库 <ArrowRight size={14}/></a></div>
      <div className="assessment-card">
        <div hidden={matchingPhase !== null}>
        <div className="assessment-progress"><span>0{step} / 03 · {["职业背景", "能力画像", "转型偏好"][step-1]}</span><div aria-label={`第${step}步，共3步`}>{[1,2,3].map((item) => <i key={item} className={item <= step ? "done" : ""} />)}</div></div>
        {step === 1 && <div className="assessment-step"><h2>你的职业背景</h2><p>职位与年限用于方向探索；行业仅作背景记录，不参与排序。</p>
          <label>当前或最近职位<input maxLength={120} value={assessment.role} onChange={(e) => setAssessment({ ...assessment, role: e.target.value })} placeholder="例如：会计、市场专员、销售、文案" /></label>
          <div className="field-pair"><label>所在行业（选填）<select value={assessment.industry} onChange={(e) => setAssessment({ ...assessment, industry: e.target.value })}><option value="">请选择</option><option>互联网与软件</option><option>金融与保险</option><option>制造与汽车</option><option>消费与零售</option><option>医疗与教育</option><option>咨询与专业服务</option><option>政府与公共服务</option><option>其他行业</option></select></label><label>工作年限<select value={assessment.years} onChange={(e) => setAssessment({ ...assessment, years: e.target.value })}><option value="">请选择</option><option>0-1年</option><option>1-3年</option><option>3-5年</option><option>5年以上</option></select></label></div>
        </div>}
        {step === 2 && <div className="assessment-step"><h2>你已经具备什么</h2><p>只选择已经具备的能力。想学习、正在入门或不会的技能请写在描述中，不要勾选。</p>
          <fieldset><legend>可迁移能力</legend><div className="choice-grid">{abilityOptions.map((item) => <button type="button" key={item} aria-pressed={assessment.abilities.includes(item)} className={assessment.abilities.includes(item) ? "selected" : ""} onClick={() => toggleMulti("abilities", item)}>{item}</button>)}</div></fieldset>
          <label>代表项目或成果（选填）<textarea value={assessment.evidence} onChange={(e) => setAssessment({ ...assessment, evidence: e.target.value })} maxLength={3000} placeholder="写清楚你做了什么、使用哪些工具、达到什么结果；不必填写公司或客户真实名称" /></label>
        </div>}
        {step === 3 && <div className="assessment-step"><h2>你想怎样工作</h2><p>偏好和约束会排除看起来适合、实际不合适的岗位。</p>
          <fieldset><legend>更喜欢的工作方式</legend><div className="choice-grid">{preferenceOptions.map((item) => <button type="button" key={item} aria-pressed={assessment.preferences.includes(item)} className={assessment.preferences.includes(item) ? "selected" : ""} onClick={() => toggleMulti("preferences", item)}>{item}</button>)}</div></fieldset>
          <fieldset><legend>对写代码的态度</legend><div className="choice-grid three">{["可以写代码","愿意学习","不想写代码"].map((item) => <button type="button" key={item} aria-pressed={assessment.coding === item} className={assessment.coding === item ? "selected" : ""} onClick={() => setAssessment({ ...assessment, coding: item })}>{item}</button>)}</div></fieldset>
          <fieldset><legend>是否接受客户现场或出差</legend><div className="choice-grid three">{["可以出差","偶尔可以","不接受出差"].map((item) => <button type="button" key={item} aria-pressed={assessment.travel === item} className={assessment.travel === item ? "selected" : ""} onClick={() => setAssessment({ ...assessment, travel: item })}>{item}</button>)}</div></fieldset>
        </div>}
        <div className="assessment-actions">{step > 1 && <button className="back-button" onClick={() => setStep(step - 1)}>上一步</button>}<button ref={submitRef} className="next-button" disabled={(step === 1 && (!assessment.role.trim() || !assessment.years)) || (step === 2 && !assessment.abilities.length && !assessment.evidence.trim()) || (step === 3 && (!assessment.preferences.length || !assessment.coding || !assessment.travel))} onClick={() => step < 3 ? setStep(step + 1) : completeAssessment()}>{step < 3 ? "下一步" : "生成转型清单"}<ArrowRight size={17} /></button></div>
        </div>
        {matchingPhase !== null && <div ref={processRef} tabIndex={-1} className="matching-process" aria-label="正在整理匹配结果">
          <div className="process-kicker"><span className="live-dot"/> ABILITY → CAREER</div>
          <div className="ability-orbit" aria-hidden="true"><div className="orbit-ring outer"/><div className="orbit-ring inner"/><div className="orbit-core"><Compass size={36}/></div>
            {[assessment.abilities[0] || '工作任务', assessment.abilities[1] || '项目经验', '职业方向'].map((text,i) => <span className={`orbit-chip chip-${i}`} key={i}>{text}</span>)}
          </div>
          <h2><output aria-live="polite">{matchingStages[matchingPhase]}</output></h2>
          <p>根据你的能力与约束，整理值得探索的方向。</p>
          <ol className="matching-stages">{matchingStages.map((label,i) => <li key={label} className={i < matchingPhase ? 'complete' : i === matchingPhase ? 'current' : ''}><span>{i < matchingPhase ? '✓' : `0${i+1}`}</span>{label}</li>)}</ol>
          <p className="process-disclosure">本地规则匹配 · 动效展示流程，非实时联网搜索</p>
          <button className="cancel-matching" onClick={cancelMatching}>返回修改</button>
        </div>}
      </div>
    </section>
    {matchingPhase === null && submittedAssessment && result && <section ref={resultRef} tabIndex={-1} key={resultVersion} className="match-section results-reveal" id="matches" aria-label="职业匹配结果">
      <div className="match-heading"><div><span>你的 AI 转型清单</span><h2>{result.hasStrongMatch ? "这些方向值得进一步核实" : matches.length ? "找到一些探索方向" : "暂时没有足够匹配依据"}</h2></div><button onClick={reviseAssessment}>补充能力</button></div>
      <p className="profile-echo">{submittedAssessment.role} · {submittedAssessment.industry || "行业未填写"} · {submittedAssessment.years}</p>
      <div className="assessment-feedback">
        {!result.recognizedTitle && <p>暂未识别「{submittedAssessment.role}」的具体职责。岗位名称不同不影响转型，下面仅根据已识别能力判断。</p>}
        <p>用于推荐的自述能力：{result.abilities.join("、") || "暂无，请补充已完成的日常任务与工具。"}</p>
        {result.learningAbilities.length > 0 && <p>学习中／计划学习（不计入已有能力）：{result.learningAbilities.join('、')}</p>}
        {result.deniedAbilities.length > 0 && <p>描述为不会／不熟悉（不计入）：{result.deniedAbilities.join('、')}</p>}
        {result.uncertainAbilities.length > 0 && <p>表述不确定或相互矛盾（不计入）：{result.uncertainAbilities.join('、')}</p>}
        {result.conflicts.length > 0 && <p>勾选与文字描述不一致：{result.conflicts.join('、')}。请修改确认，当前暂不计入。</p>}
        <p className="assessment-limit">仍为保守的关键词规则，并非能力认证。行业仅展示背景，未参与推荐排序。</p>
        {!result.hasStrongMatch && <p>目前依据有限，以下方向需要进一步核实。没有匹配结果不代表你不适合AI工作。</p>}
        <details><summary>怎样补充信息更有效？</summary><p>① 你独立完成过什么任务？② 用过哪些工具、熟练到什么程度？③ 有什么可展示的结果？例如：用 Python 和 SQL 清洗订单数据，搭建自动化日报。</p></details>
      </div>
      <div className="match-list">{matches.map(({ role, reasons, gaps, band, matchedAbilities, skills, constraints }, index) => <article className="match-card" key={role.id} style={{animationDelay:`${index * 90}ms`}}>
        <button className="match-card-main" onClick={() => setSelected(role)} aria-label={`了解${role.title}的匹配依据和技能要求`}>
        <div className="match-rank"><span>0{index + 1} · {band}</span><strong>{matchedAbilities.length + skills.length} 项线索</strong></div>
        <div className="match-title"><div><span>{role.category}方向</span><h3>{role.title}</h3></div><ChevronRight size={21} /></div>
        <p>{reasons.slice(0, 3).join("；") || "职位名称相关，但尚缺少能力描述"}</p>
        <div className="match-evidence"><span>相关能力</span><strong>{[...matchedAbilities,...skills].join("、") || "待补充"}</strong></div>
        <div className="match-evidence gap"><span>待核实</span><strong>{gaps.length ? gaps.join("、") : "技能熟练度与实际项目效果"}</strong></div>
        {constraints.length > 0 && <p className="constraint-note">{constraints.join("；")}</p>}
        <span className="match-detail-cta">查看能力差距与岗位介绍 <ArrowRight size={14}/></span>
        </button><JobLinks roleId={role.id} profile={jobPreferences}/>
      </article>)}</div>
      <details className="match-note"><summary>推荐依据与局限</summary><p>当前使用{roles.length}个岗位方向的能力规则，结合你选择的能力和描述中出现的技能排序；偏好仅作辅助，不算已有能力。新增转型方向需有对应领域信号或明确的方向名称，通用数据能力不等于财务经验。明确不想写代码时排除技术方向。工作年限是典型参考，实际要求以企业职位为准。</p><p>这是规则推荐，尚未接入大模型语义理解或经过真实投递结果校准。“待核实”表示你尚未提供证据，不表示你不会。你的职业描述只在当前页面内用于计算，收藏保存在本机浏览器。</p></details>
    </section>}
    <section className="live-section" id="jobs">
      <div className="job-conditions" id="job-conditions">
        <h2>再核对具体职位条件</h2>
        <p>方向相关 ≠ 可以直接投递。以下选项只核对招聘基本门槛，不改变能力推荐；不填则标为待核实。</p>
        <div className="assessment-step">
          <div className="field-pair">
            <label>意向城市<select value={jobPreferences.city} onChange={e=>setJobPreferences({...jobPreferences,city:e.target.value})}><option value="">暂不填写</option>{['不限','北京','上海','深圳','广州','杭州','成都','合肥','南京','其他城市'].map(city=><option key={city}>{city}</option>)}</select></label>
            <label>最高已取得学历<select value={jobPreferences.education} onChange={e=>setJobPreferences({...jobPreferences,education:e.target.value})}><option value="">暂不填写</option>{['高中及以下','大专','本科','硕士','博士'].map(degree=><option key={degree}>{degree}</option>)}</select></label>
          </div>
          <label>目标岗位相关经验年限<input type="number" min="0" max="60" step="0.5" inputMode="decimal" value={jobPreferences.relevantYears} onChange={e=>setJobPreferences({...jobPreferences,relevantYears:e.target.value})} placeholder="例如：2（不是总工龄）"/></label>
          <p>切换岗位方向时，请按该方向重新核对相关年限。超出职位年限区间会保留为待确认。</p>
        </div>
        {result && <a href="#matches">返回推荐结果，查看条件核对 <ArrowRight size={14}/></a>}
      </div>
      <details className="company-directory"><summary>招聘公司清单 · {recruitmentCompanies.length} 家</summary>
        <p>按已收录的具体职位与平台招聘记录整理，不代表实时在招数量。</p>
        {recruitmentCompanies.map(company => <div key={company}><strong>{company}</strong><p>{[...directJobs.filter(job=>job.company===company).map(job=>job.title),...companyLeads.filter(lead=>lead.company===company).map(lead=>lead.title)].join('、')}</p></div>)}
      </details>
      <div className="live-heading"><div>暂无直达链接？按公司找</div></div>
      <CompanyClues leads={companyLeads}/>
      <div className="live-heading"><div><span className="live-dot" />招聘直达</div><p>链接核对：{recruitmentCheckedAt}</p></div>
      <div className="live-list">{directJobs.map((job) => <a className="live-card" href={job.url} target="_blank" rel="noreferrer" key={`${job.source}-${job.title}-${job.company}`}>
        <div className="source-line"><span className={`source-badge source-${job.source}`}>{job.source}</span><span>{job.verification === "平台验证" ? "具体职位 · 平台验证" : "具体职位详情"}</span></div>
        <span className={`screening-status ${screenJob(job,jobPreferences).status}`}>{screenJob(job,jobPreferences).label}</span><p className="screening-reasons">{[...screenJob(job,jobPreferences).conflicts,...screenJob(job,jobPreferences).pending].join("；") || "仅城市、学历及经验年限初筛，仍需核实技能与项目要求。"}</p><h2>{job.title}</h2><p className="company-line">{job.company}</p>
        <div className="job-meta"><span><MapPin size={13} />{job.city}</span><span>{job.experience}</span></div>
        <div className="job-foot"><strong>{job.salary}</strong><span>直达职位</span><ExternalLink size={17} /></div><p className="job-verification">{verificationNote(job)}</p>
      </a>)}</div>
      <p className="live-note">仅收录具体职位链接，不使用搜索页、聚合页或首页。职位可能下线或调整，BOSS 可能要求登录验证。这里按岗位方向关联，企业的经验、学历和地点要求仍需逐项核实。</p>
    </section>
    <section className="explorer" id="roles">
      <details className="match-note"><summary>新增：财务、市场、销售、内容与职能转型</summary><p>新增{roles.filter(role=>role.transition).length}个转型方向。可用原职业搜索，如会计、电话销售、文案、客服；打开详情查看任务变化与需要保留的专业能力。</p><p>ILO 研究强调，AI 暴露度不等于失业或完全替代。本页任务示例是编辑整理，非中国岗位替代概率排名；新增方向名称也不是官方职业分类或已核实在招信息。</p><a href="https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure" target="_blank" rel="noopener noreferrer">研究依据：ILO 2025 职业暴露度报告 <ExternalLink size={13}/></a></details>
      <div className="sticky-tools">
        <label className="search-box"><Search size={18} /><span className="sr-only">搜索岗位或技能</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索岗位或技能" />{query && <button onClick={() => setQuery("")} aria-label="清空搜索"><X size={17} /></button>}</label>
        <div className="category-tabs" aria-label="岗位类别">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? "active" : ""}>{item}</button>)}</div>
      </div>
      {savedOnly && <div className="saved-filter">仅看收藏 · 保存在本机<button onClick={() => setSavedOnly(false)}>查看全部</button></div>}{storageNotice && <output className="disclaimer">{storageNotice}</output>}<div className="result-line"><div><strong>{savedOnly ? "我的收藏" : category === "全部" ? "全部岗位" : `${category}方向`}</strong><span>{filtered.length} 个结果</span></div><label className="level-select"><span className="sr-only">经验要求</span><select value={level} onChange={(e) => setLevel(e.target.value as Level | "全部")}><option value="全部">经验不限</option><option>应届可投</option><option>1-3年</option><option>3年以上</option></select></label></div>
      {filtered.length ? <div className="role-list">{filtered.map((role) => <button className="role-card" key={role.id} onClick={() => setSelected(role)}>
        <div className="role-top"><span className="category-tag">{role.category}</span>{role.transition && <span className="hot-tag">AI 转型方向</span>}{role.hot && <span className="hot-tag"><Sparkles size={12} />重点关注</span>}</div>
        <h2>{role.title}</h2><p>{role.summary}</p><div className="skills">{role.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
        <div className="role-bottom"><span>{role.level}</span>{saved.includes(role.id) && <span className="saved-label"><Bookmark size={13} fill="currentColor" />已收藏</span>}<ChevronRight size={19} /></div>
      </button>)}</div> : <div className="empty"><Search size={28} /><strong>{savedOnly ? "当前没有符合条件的收藏" : "方向库暂无直接结果"}</strong><p>{savedOnly ? "在岗位详情中点击收藏，或取消其他筛选。" : "试试技能或常见别名，例如 Python、客户沟通。也可以回到测评描述你的能力。"}</p><button onClick={() => { setQuery(""); setCategory("全部"); setLevel("全部"); setSavedOnly(false); }}>清除筛选</button></div>}
      <p className="disclaimer">这是岗位方向库，不代表实时招聘数量或薪资水平。岗位名称会因公司而异。</p>
    </section>
    <nav className="bottom-nav" aria-label="底部导航"><a href="#top"><Compass size={20} /><span>匹配</span></a><a href="#jobs"><Sparkles size={20} /><span>招聘直达</span></a><a href="#roles" onClick={() => setSavedOnly(false)}><BriefcaseBusiness size={20} /><span>方向库</span></a><button className={savedOnly ? "active" : ""} aria-pressed={savedOnly} onClick={() => { setSavedOnly(true); setCategory("全部"); setLevel("全部"); setQuery(""); document.getElementById("roles")?.scrollIntoView(); }}><Bookmark size={20} /><span>收藏 {saved.length || ""}</span></button></nav>
    {selected && <dialog ref={dialogRef} onCancel={() => setSelected(null)} onClose={() => setSelected(null)} className="detail-screen" aria-labelledby="detail-title"><header><button onClick={() => setSelected(null)} aria-label="返回岗位列表"><ArrowLeft /></button><span>岗位详情</span><button onClick={() => toggleSave(selected.id)} aria-label={saved.includes(selected.id) ? "取消收藏岗位" : "收藏岗位"} aria-pressed={saved.includes(selected.id)}><Bookmark fill={saved.includes(selected.id) ? "currentColor" : "none"} /></button></header><div className="detail-content"><div className="detail-meta"><span>{selected.category}方向</span><span>{selected.level}</span></div><h2 id="detail-title">{selected.title}</h2><p className="detail-summary">{selected.summary}</p><section><h3>核心技能</h3><div className="detail-skills">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section><section><h3>常见岗位名称</h3><p>{selected.aliases}</p></section><section><h3>典型交付</h3><p>{selected.output}</p></section><section className="fit-block"><h3>谁更适合</h3><p>{selected.fit}</p></section><section className="related-jobs"><h3>具体招聘职位</h3><JobLinks roleId={selected.id} profile={jobPreferences}/></section><div className="search-tip">经验标签为方向参考，非所有企业的硬门槛。岗位可能随时调整，请以原招聘平台页面为准。</div></div></dialog>}
  </main>;
}
