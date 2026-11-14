import test from 'node:test';
import assert from 'node:assert/strict';
import { sample, validate, encode, decode, renderSVG } from '../src/roadmap.mjs';
import worker from '../dist/server/index.js';
const request = (plan, headers = { 'Content-Type': 'application/json' }) => new Request('https://example.com/api/roadmaps', { method: 'POST', headers, body: JSON.stringify(plan) });
test('학생이 방향을 선택하지 않은 요청은 거부한다', async () => {
  assert.throws(() => validate({ ...sample, directionConfirmed: false }), /선택/);
  assert.equal((await worker.fetch(request({ ...sample, directionConfirmed: false }))).status, 400);
});
test('한글과 특수문자를 손실 없이 링크로 변환한다', () => {
  const plan = { ...sample, selectedDirection: '게임 & 디자인 <나의 길> "시작"' };
  assert.deepEqual(decode(encode(plan)), validate(plan));
  const svg = renderSVG(plan);
  assert.ok(svg.includes('&amp;')); assert.ok(svg.includes('&lt;')); assert.ok(!svg.includes('<나의 길>'));
});
test('잘못된 링크와 빠진 필드, 잘못된 단계 수를 거부한다', () => {
  for (const v of ['%', 'a'.repeat(12001), 'abcd', null]) assert.throws(() => decode(v));
  for (const p of [{}, { ...sample, stages: [] }, { ...sample, stages: [sample.stages[0]] }, { ...sample, thisWeek: [] }, { ...sample, summary: 'x'.repeat(181) }]) assert.throws(() => validate(p));
});
test('API가 텍스트와 실제로 열리는 SVG 및 그림 페이지를 함께 반환한다', async () => {
  const response = await worker.fetch(request(sample)); assert.equal(response.status, 200);
  const result = await response.json(); assert.equal(result.status, 'ready');
  assert.ok(result.textRoadmap.includes('이번 주에 할 일')); assert.ok(result.textRoadmap.includes(sample.stages[3].outcome));
  const image = await worker.fetch(new Request(result.imageUrl)); assert.equal(image.status, 200);
  assert.match(image.headers.get('Content-Type'), /image\/svg\+xml/);
  const svg = await image.text(); for (const stage of sample.stages) assert.ok(svg.includes(stage.title));
  const page = await worker.fetch(new Request(result.roadmapUrl)); assert.equal(page.status, 200);
  assert.match(await page.text(), /PNG 이미지 저장/);
  assert.equal(result.adaptiveCard.actions[0].url, result.roadmapUrl);
});
test('길어진 내용은 글을 자르지 않고 이미지 높이를 늘린다', () => {
  const long = { ...sample, stages: Array.from({ length: 6 }, (_, i) => ({ period: `${i + 1}개월`, title: '가'.repeat(60), actions: ['나'.repeat(150), '다'.repeat(150), '라'.repeat(150)], outcome: '마'.repeat(100) })) };
  const svg = renderSVG(long);
  assert.ok(Number(svg.match(/height="(\d+)"/)[1]) > 2500);
  assert.ok(svg.includes('계획을 다시 고쳐'));
});
test('요청 형식, 크기, 메서드와 없는 경로를 처리한다', async () => {
  assert.equal((await worker.fetch(request(sample, { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await worker.fetch(new Request('https://example.com/api/roadmaps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }))).status, 400);
  assert.equal((await worker.fetch(request({ ...sample, padding: 'x'.repeat(21000) }))).status, 413);
  assert.equal((await worker.fetch(new Request('https://example.com/nope'))).status, 404);
  assert.equal((await worker.fetch(new Request('https://example.com/api/roadmaps', { method: 'OPTIONS' }))).status, 204);
});
test('인증정보 없는 연결 명세가 실제 서비스 호스트를 사용한다', async () => {
  const spec = await (await worker.fetch(new Request('https://my.example/connector/openapi.json'))).json();
  assert.equal(spec.swagger, '2.0'); assert.equal(spec.host, 'my.example'); assert.ok(spec.paths['/api/roadmaps'].post);
});
