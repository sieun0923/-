import { sample, validate, encode, decode, renderSVG, textRoadmap } from './roadmap.mjs';
const $ = id => document.getElementById(id);
let current, objectUrl;
function show(plan, isSample = false) {
  const valid = validate(plan);
  const svg = renderSVG(valid);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  $('roadmap-image').src = objectUrl;
  $('roadmap-image').alt = `${valid.selectedDirection} — ${valid.stages.length}단계 진로 로드맵`;
  $('text-plan').textContent = textRoadmap(valid);
  $('map-heading').textContent = isSample ? '작은 시작이 모여, 하나의 지도로' : valid.selectedDirection;
  $('map-copy').textContent = isSample ? '이 그림은 가상의 계획 예시야. 실제 계획은 상담에서 방향을 고른 뒤 만들어 줘.' : valid.summary;
  $('map-status').textContent = isSample ? '예시 · 실제 상담 결과 아님' : '나의 진로 로드맵';
  $('map-status').classList.remove('neutral');
  $('empty-state').hidden = true;
  // .empty-state has a display declaration; inline hidden must still win.
  $('empty-state').style.display = 'none';
  $('result').hidden = false; $('error').hidden = true;
  current = valid;
}
function error(e) { $('error').textContent = e.message || '로드맵을 열지 못했어. 링크를 다시 확인해 줘.'; $('error').hidden = false; }
function download(blob, filename) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
$('sample').addEventListener('click', () => show(sample, true));
$('import-form').addEventListener('submit', e => {
  e.preventDefault();
  try {
    const url = new URL($('roadmap-link').value);
    // Only decode the plan; never navigate to or fetch a pasted URL.
    show(decode(url.searchParams.get('data')));
  } catch (e) { error(e); }
});
$('svg').addEventListener('click', () => {
  if (!current) return;
  download(new Blob([renderSVG(current)], { type: 'image/svg+xml;charset=utf-8' }), 'dream-map.svg');
  $('action-status').textContent = 'SVG 저장을 시작했어.';
});
$('png').addEventListener('click', async () => {
  if (!current) return;
  $('png').disabled = true;
  try {
    await document.fonts.ready;
    const image = new Image(); image.src = objectUrl; await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    if (canvas.height > 14000) throw new Error('그림이 너무 길어. SVG로 저장하거나 단계 내용을 조금 줄여 줘.');
    canvas.getContext('2d').drawImage(image, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNG 저장을 지원하지 않는 브라우저야. SVG로 저장해 줘.');
    download(blob, 'dream-map.png'); $('action-status').textContent = 'PNG 저장을 시작했어.';
  } catch (e) { error(e); } finally { $('png').disabled = false; }
});
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(textRoadmap(current)); $('action-status').textContent = '텍스트 계획을 복사했어.'; }
  catch { $('action-status').textContent = '아래 ‘계획을 글로 읽기’를 열어서 글을 선택해 복사해 줘.'; }
});
try {
  const data = new URL(location.href).searchParams.get('data');
  if (location.pathname.endsWith('/roadmap.html')) document.body.classList.add('viewer');
  if (data) show(decode(data));
  else if (location.pathname.endsWith('/roadmap.html')) throw new Error('로드맵 정보가 없는 링크야. 상담에서 받은 전체 링크를 열어 줘.');
} catch (e) { error(e); }
