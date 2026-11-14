import { validate, encode, decode, renderSVG, textRoadmap, sample } from './roadmap.mjs';
import { assets } from './assets.generated.mjs';

const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    try {
      if (url.pathname === '/api/health' && request.method === 'GET') return json({ status: 'ok', service: 'dream-map-roadmap', version: '1.0.0' });
      if (url.pathname === '/api/roadmaps' && request.method === 'POST') {
        if (!request.headers.get('Content-Type')?.toLowerCase().includes('application/json')) return json({ error: 'Content-Type은 application/json이어야 합니다.' }, 415);
        if (Number(request.headers.get('Content-Length')) > 20000) return json({ error: '로드맵 입력이 너무 깁니다.' }, 413);
        const body = await request.text();
        if (new TextEncoder().encode(body).length > 20000) return json({ error: '로드맵 입력이 너무 깁니다.' }, 413);
        const p = validate(JSON.parse(body)), data = encode(p);
        if (data.length > 12000) return json({ error: '링크에 담기에는 계획이 너무 깁니다. 활동 내용을 조금 줄여 주세요.' }, 413);
        const imageUrl = `${url.origin}/api/roadmap.svg?data=${data}`;
        const roadmapUrl = `${url.origin}/roadmap?data=${data}`;
        return json({ status: 'ready', imageFormat: 'svg', imageUrl, roadmapUrl, textRoadmap: textRoadmap(p),
          adaptiveCard: { type: 'AdaptiveCard', version: '1.5', $schema: 'http://adaptivecards.io/schemas/adaptive-card.json', body: [{ type: 'TextBlock', text: p.selectedDirection, weight: 'Bolder', size: 'Medium', wrap: true }, { type: 'TextBlock', text: p.summary, wrap: true }], actions: [{ type: 'Action.OpenUrl', title: '나의 로드맵 그림 열기', url: roadmapUrl }] }
        });
      }
      if (url.pathname === '/api/roadmap.svg' && request.method === 'GET') {
        const plan = decode(url.searchParams.get('data'));
        return new Response(renderSVG(plan), { headers: { ...headers, 'Content-Type': 'image/svg+xml; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox", 'Content-Disposition': 'inline; filename="dream-map.svg"' } });
      }
      if (url.pathname === '/sample.svg' && request.method === 'GET') return new Response(renderSVG(sample), { headers: { ...headers, 'Content-Type': 'image/svg+xml; charset=utf-8' } });
      if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: '지원하지 않는 요청 방식입니다.' }, 405);
      const path = ['/', '/roadmap'].includes(url.pathname) ? '/index.html' : url.pathname;
      if (path === '/connector/openapi.json') {
        const spec = JSON.parse(assets[path].body); spec.host = url.host;
        return json(spec);
      }
      const asset = assets[path];
      if (!asset) return json({ error: '찾을 수 없는 페이지입니다.' }, 404);
      return new Response(request.method === 'HEAD' ? null : asset.body, { headers: { ...headers, 'Content-Type': asset.type, 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; frame-src https://copilotstudio.microsoft.com; connect-src 'self'; object-src 'none'; base-uri 'none'" } });
    } catch (error) {
      return json({ error: error instanceof SyntaxError ? '올바른 JSON 형식이 필요합니다.' : error.message || '로드맵을 만들지 못했습니다.' }, 400);
    }
  }
};
