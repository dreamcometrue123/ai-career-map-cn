import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowLeft, Search, SlidersHorizontal, Globe2, BriefcaseBusiness, Check, Info } from 'lucide-react';
import { marketJobs, checkedAt, filterJobs, salaryText } from './app/market-data';
import './app/market.css';

function MarketPage() {
  const [query,setQuery] = useState(''); const [region,setRegion] = useState('全部'); const [family,setFamily] = useState('全部'); const [industry,setIndustry] = useState('全部'); const [salaryOnly,setSalaryOnly] = useState(false);
  const jobs = filterJobs(query,region,family,industry,salaryOnly);
  const reset = () => {setQuery('');setRegion('全部');setFamily('全部');setIndustry('全部');setSalaryOnly(false);};
  const disclosed = jobs.filter(j=>j.salary?.evidence==='详情披露');
  return <div className="market-app">
    <header className="market-nav"><a href="./index.html"><span className="brand-icon">a<span>i</span></span>职业地图 <span className="nav-divider">/</span> <b>招聘观察</b></a><a className="back" href="./index.html"><ArrowLeft size={14}/>返回职业匹配</a></header>
    <main>
      <section className="market-intro"><div><div className="eyebrow"><span/> THE ENTERPRISE AI CAREER RADAR</div><h1>AI To B，<br className="mobile-break"/><em>机会在哪里？</em></h1><p>找到正在出现的企业 AI 机会。看公司、看岗位，也看清薪资的真实口径。</p></div><div className="edition"><Globe2 size={22}/><span>中国大陆 + 海外<br/><b>招聘样本观察 / 01</b></span></div></section>
      <div className="market-stats"><div><b>{marketJobs.length}<small>条</small></b><span>精选职位记录</span></div><div><b>{new Set(marketJobs.map(j=>j.family)).size}<small>类</small></b><span>产品到商业化</span></div><div><b>{marketJobs.filter(j=>j.family==='行业产品经理').length}<small>条</small></b><span>行业产品经理</span></div><div className="stats-date"><span className="dot"/><span>资料查阅日期<b>{checkedAt}</b></span></div></div>
      <section className="market-workspace" aria-label="筛选职位">
        <div className="filter-top"><h2><SlidersHorizontal size={17}/>寻找你的机会</h2><button className="reset" onClick={reset}>清空筛选</button></div>
        <label className="search-box"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索公司、岗位、城市或能力，例如：产品 制造" aria-label="搜索职位"/><kbd>SEARCH</kbd></label>
        <div className="filter-row"><div className="region-tabs" aria-label="地区">{['全部','国内','海外'].map(r=><button key={r} aria-pressed={region===r} className={region===r?'active':''} onClick={()=>setRegion(r)}>{r==='全部'?'全球机会':r}</button>)}</div><label className="select-label">岗位<select value={family} onChange={e=>setFamily(e.target.value)}><option value="全部">全部岗位</option>{[...new Set(marketJobs.map(j=>j.family))].map(f=><option key={f}>{f}</option>)}</select></label><label className="select-label">行业<select value={industry} onChange={e=>setIndustry(e.target.value)}><option value="全部">全部行业</option>{[...new Set(marketJobs.map(j=>j.industry))].map(i=><option key={i}>{i}</option>)}</select></label></div>
        <div className="filter-bottom"><label><input type="checkbox" checked={salaryOnly} onChange={e=>setSalaryOnly(e.target.checked)}/>仅看详情已披露薪资</label><button className="pm-shortcut" onClick={()=>{setFamily('行业产品经理');}}>重点关注：行业产品经理 <ArrowUpRight size={14}/></button></div>
      </section>
      <div className="market-layout"><section className="results" aria-label="招聘职位"><div className="results-heading"><h2>职位清单 <span>{jobs.length}</span></h2><span aria-live="polite">符合当前筛选 · 非实时招聘全量库</span></div>
        {jobs.length===0?<div className="empty"><Search size={30}/><h3>暂时没有这个组合的样本</h3><p>没有收录不代表没有招聘。试试减少关键词或放宽行业筛选。</p><button onClick={reset}>查看全部机会</button></div>:jobs.map((j,index)=><article className="job-card" key={j.id} style={{animationDelay:`${Math.min(index,5)*35}ms`}}>
          <div className="job-company"><span className={`company-monogram ${j.region==='海外'?'international':''}`}>{j.company==='OpenAI'?'O':j.company==='Anthropic'?'A':j.company.slice(0,1)}</span><div><b>{j.company}</b><span>{j.city}</span></div><span className="region-label">{j.region}</span></div>
          <h3>{j.title}</h3><div className="job-tags"><span>{j.family}</span><span>{j.industry}</span></div>
          <div className="salary-line">{j.salary?<><strong className={j.salary.evidence==='索引参考'?'snapshot':''}>{salaryText(j.salary)}</strong><span>{j.salary.currency} / {j.salary.period}</span><small className={j.salary.evidence==='详情披露'?'verified':'pending'}>{j.salary.evidence==='详情披露'?<Check size={12}/>:<Info size={12}/>} {j.salary.evidence}</small></>:<><strong className="undisclosed">薪资未公开</strong><span>以招聘方确认为准</span></>}</div>
          {j.salary&&<p className="salary-note">{j.salary.basis} · {j.salary.note}</p>}
          <p className="job-description">{j.description}</p><p className="experience"><BriefcaseBusiness size={14}/>{j.experience}</p><div className="skill-tags">{j.skills.map(s=><span key={s}>{s}</span>)}</div>
          {j.caution&&<p className="job-caution"><Info size={14}/><span>{j.caution}</span></p>}
          <footer><div><span>{j.source} · {j.status}</span>{j.salary?.source&&<a href={j.salary.source} target="_blank" rel="noopener noreferrer">薪资参考来源 ↗</a>}</div><a className="job-link" href={j.url} target="_blank" rel="noopener noreferrer">查看职位<ArrowUpRight size={16}/></a></footer>
        </article>)}
      </section><aside className="market-aside"><section className="insight-panel"><div className="eyebrow">SALARY, IN CONTEXT</div><h2>读懂岗位市场价</h2><p>当前筛选有 <b>{disclosed.length}</b> 条详情披露薪资。按职位逐条看，不混合币种、底薪和总包。</p>{disclosed.length?disclosed.map(j=><a className="salary-sample" href={j.url} target="_blank" rel="noopener noreferrer" key={j.id}><span>{j.company}<ArrowUpRight size={13}/></span><b>{salaryText(j.salary!)}<small> {j.salary!.currency}/{j.salary!.period}</small></b><p>{j.family} · {j.salary!.basis}</p></a>):<div className="no-salary">当前没有可确认的薪资样本。索引参考不计入已披露样本。</div>}<p className="fine-print">样本偏向已找到的职位，不代表市场均价、实际 offer 或招聘人数。薪资差异也包含地区与职级差异。</p></section>
      <section className="reading-panel"><span className="eyebrow">WHAT TO LOOK FOR</span><h2>不只看“AI”两个字</h2><div><b>01 / 行业产品经理</b><p>先看客户场景和行业经验，再看 AI 产品落地要求。制造、金融、医疗的门槛并不相同。</p></div><div><b>02 / 技术与业务的交界</b><p>FDE 强调工程交付；客户成功强调采用与价值；售前强调需求与方案，不能只按岗位名比较。</p></div><div><b>03 / 海外机会的边界</b><p>薪资之外，留意语言、到岗地点、身份限制与出差要求。远程友好未必开放全球申请。</p></div></section></aside></div>
      <section className="methodology"><h2><Info size={17}/>资料与口径说明</h2><p>本页为 {checkedAt} 人工查阅整理的静态样本，不会自动更新。“详情可访问”仅表示查阅时能读取岗位内容，不保证现在仍有名额。平台可能要求登录、触发验证或下架；按钮均链接原始职位详情，不经过本网站中间页。</p><p>“索引参考”来自搜索索引或平台关联职位摘要，可能滞后，不能代替当前招聘报价。未披露薪资不估算；不换算币种、不把月薪直接乘12当年包、不把广告薪资当实际到手。未披露雇主的代招记录不作为已知招聘公司。行业分类为根据岗位与雇主业务整理的标签。</p></section>
      <footer className="page-footer"><a href="./index.html">AI 职业地图</a><span>看清方向，再做选择。</span><a href="#root">回到顶部 ↑</a></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<MarketPage/>);
