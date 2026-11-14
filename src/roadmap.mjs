export const sample = {
  directionConfirmed: true,
  selectedDirection: '게임 기획 · 작은 게임부터 완성하기',
  summary: '만드는 즐거움을 알아가는 8주. 평일에는 짧게, 주말에는 직접 만들어 봐.',
  weeklyTime: '주 3시간 · 평일 30분씩 두 번 + 주말 2시간',
  stages: [
    { period: '1–2주', title: '좋아하는 게임 관찰하기', actions: ['좋아하는 게임 하나를 골라 재미있는 이유 3가지 적기', '게임의 목표·규칙·보상을 한 장에 정리하기'], outcome: '나만의 게임 관찰 노트' },
    { period: '3–4주', title: '작은 아이디어 구체화하기', actions: ['주인공과 목표를 정하고 종이에 장면 그려 보기', '완성할 수 있을 만큼 작은 게임 규칙 만들기'], outcome: '한 장짜리 게임 기획서' },
    { period: '5–6주', title: '직접 움직이는 게임 만들기', actions: ['익숙한 제작 도구로 핵심 기능 한 가지 구현하기', '플레이 가능한 짧은 첫 버전 완성하기'], outcome: '1분 동안 해 볼 수 있는 게임' },
    { period: '7–8주', title: '함께 해 보고 다듬기', actions: ['친구 한 명에게 보여 주고 불편한 점 들어 보기', '한 가지를 개선하고 과정을 기록하기'], outcome: '게임 첫 작품 + 제작 회고' }
  ],
  thisWeek: ['좋아하는 게임 하나 고르기', '관찰 노트를 쓸 시간 30분 잡기']
};

const fail = message => { throw new Error(message); };
function str(value, field, max) {
  if (typeof value !== 'string' || !value.trim() || [...value].length > max) fail(`${field}: 1~${max}자의 글을 입력해 주세요.`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) fail(`${field}: 제어 문자는 사용할 수 없어요.`);
  return value.trim();
}
function list(value, field, min, max, length) {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail(`${field}: ${min}~${max}개가 필요해요.`);
  return value.map((v, i) => str(v, `${field}[${i}]`, length));
}
export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('로드맵 정보가 필요해요.');
  if (input.directionConfirmed !== true) fail('학생이 진로 방향을 먼저 선택한 뒤 로드맵을 만들 수 있어요.');
  if (!Array.isArray(input.stages) || input.stages.length < 2 || input.stages.length > 6) fail('단계는 2~6개가 필요해요.');
  return {
    directionConfirmed: true,
    selectedDirection: str(input.selectedDirection, '선택한 방향', 60),
    summary: str(input.summary, '계획 설명', 180),
    weeklyTime: str(input.weeklyTime, '활용 시간', 90),
    stages: input.stages.map((s, i) => {
      if (!s || typeof s !== 'object') fail(`${i + 1}단계 정보가 필요해요.`);
      return { period: str(s.period, '기간', 30), title: str(s.title, '단계 제목', 60), actions: list(s.actions, '실천 활동', 1, 3, 150), outcome: str(s.outcome, '남길 결과물', 100) };
    }),
    thisWeek: list(input.thisWeek, '이번 주 할 일', 1, 4, 120)
  };
}
export function encode(input) {
  const bytes = new TextEncoder().encode(JSON.stringify(validate(input)));
  let binary = ''; for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
export function decode(data) {
  if (typeof data !== 'string' || data.length > 12000 || !/^[A-Za-z0-9_-]+$/.test(data)) fail('로드맵 링크가 올바르지 않아요.');
  const padded = data.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(data.length / 4) * 4, '=');
  try { return validate(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(padded), c => c.charCodeAt(0))))); }
  catch { fail('로드맵 링크의 내용이 올바르지 않아요. 새 링크를 받아 주세요.'); }
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
// Approximate CJK advance conservatively; all accepted content remains in the image.
function wrap(text, maxWidth, size) {
  const lines = []; let line = '', width = 0;
  for (const c of text) {
    const advance = /[\u0020-\u007e]/u.test(c) ? size * 0.63 : size;
    if (c === '\n' || width + advance > maxWidth) { lines.push(line); line = ''; width = 0; if (c === '\n') continue; }
    line += c; width += advance;
  }
  if (line) lines.push(line);
  return lines;
}
export function textRoadmap(input) {
  const p = validate(input);
  return `선택한 방향: ${p.selectedDirection}\n${p.summary}\n활용 시간: ${p.weeklyTime}\n\n단계별 실천 계획:\n${p.stages.map((s, i) => `${i + 1}. ${s.period} · ${s.title}\n${s.actions.map(a => `- ${a}`).join('\n')}\n남길 결과물: ${s.outcome}`).join('\n\n')}\n\n이번 주에 할 일:\n${p.thisWeek.map(a => `- ${a}`).join('\n')}\n\n계획을 수정하고 싶은 부분이 있어?`;
}
export function renderSVG(input) {
  const p = validate(input), parts = []; let y = 68;
  const text = (value, x, width, size, color = '#263e36', weight = 400) => {
    const lines = wrap(value, width, size);
    parts.push(`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}">${lines.map((l, i) => `<tspan x="${x}" dy="${i ? Math.ceil(size * 1.65) : 0}">${esc(l)}</tspan>`).join('')}</text>`);
    y += lines.length * Math.ceil(size * 1.65);
  };
  parts.push('<rect x="42" y="35" width="8" height="35" rx="4" fill="#417961"/>');
  text('DREAM MAP  /  나의 다음 한 걸음', 66, 970, 20, '#4a765e', 700); y += 15;
  text(p.selectedDirection, 62, 960, 38, '#173c2d', 700); y += 2;
  text(p.summary, 62, 960, 21, '#60716a'); y += 10;
  text('활용 시간  ·  ' + p.weeklyTime, 62, 960, 19, '#466a58', 600); y += 30;
  const colors = ['#e5eedf', '#f4e8d2', '#e4ebf2', '#ede5f0', '#e6ede5', '#f2e6dc'];
  p.stages.forEach((s, i) => {
    const start = y - 26, index = parts.length;
    parts.push('');
    parts.push(`<circle cx="87" cy="${y - 2}" r="25" fill="#fff"/><text x="87" y="${y + 5}" text-anchor="middle" font-size="20" font-weight="700" fill="#365b45">${String(i + 1).padStart(2, '0')}</text>`);
    text(s.period, 132, 880, 17, '#687766', 600); y += 4;
    text(s.title, 132, 860, 27, '#263e36', 700); y += 8;
    for (const a of s.actions) { text('•  ' + a, 132, 850, 20); y += 3; }
    y += 9; text('남길 것  →  ' + s.outcome, 132, 850, 18, '#526951', 600); y += 12;
    parts[index] = `<rect x="52" y="${start}" width="996" height="${y - start}" rx="22" fill="${colors[i]}"/>`;
    y += 48;
  });
  text('이번 주, 이 두근거림부터', 62, 960, 27, '#173c2d', 700); y += 4;
  for (const a of p.thisWeek) { text('□  ' + a, 62, 950, 21); y += 3; }
  y += 20; text('속도는 달라도 괜찮아. 해 본 뒤에 네 계획을 다시 고쳐 보자.', 62, 950, 18, '#728176');
  y += 30;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="${y}" viewBox="0 0 1100 ${y}" role="img" aria-labelledby="title desc"><title id="title">${esc(p.selectedDirection)} 진로 로드맵</title><desc id="desc">${esc(p.summary)}</desc><rect width="1100" height="${y}" fill="#fcfbf6"/><g font-family="'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif">${parts.join('')}</g></svg>`;
}
