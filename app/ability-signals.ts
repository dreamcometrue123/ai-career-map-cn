export type SignalState = 'stated' | 'learning' | 'denied' | 'uncertain' | 'absent';
const normalize = (s: string) => s.toLowerCase().normalize('NFKC');
const denial = /不会|不懂|没有|未掌握|没做过|不擅长|不了解|不熟悉|不熟练|未接触|没用过|零基础|不能|no experience|don['’]t know|not familiar/;
const learning = /想学|想要学|希望学|打算学|计划学|准备学|正在学|在学|学习中|入门|初学|了解一点|want to learn|learning/;
const uncertain = /同事|他人|别人|招聘要求|岗位要求|需要掌握|希望掌握|期望掌握|是否会/;

// Conservative phrase rules, not semantic verification of proficiency.
export function termSignal(text: string, term: string): SignalState {
  const t = normalize(term).trim();
  if (!t) return 'absent';
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = /^[a-z0-9+#. /-]+$/.test(t)
    ? new RegExp('(^|[^a-z0-9])' + escaped + '($|[^a-z0-9])', 'i')
    : new RegExp(escaped, 'i');
  const states = normalize(text).split(/[，,。；;！!？?\n]|但是|不过|但|\bbut\b/)
    .filter(clause => pattern.test(clause)).map(clause => {
      if (denial.test(clause)) return 'denied';
      if (learning.test(clause)) return 'learning';
      if (uncertain.test(clause)) return 'uncertain';
      return 'stated';
    });
  if (!states.length) return 'absent';
  if (new Set(states).size > 1) return 'uncertain';
  return states[0] as SignalState;
}

export function containsTerm(text: string, term: string) {
  return termSignal(text, term) === 'stated';
}
