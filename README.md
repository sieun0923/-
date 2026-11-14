# Dream Map · 나의 다음 한 걸음

Copilot Studio 진로 상담 에이전트가 학생이 선택한 진로의 실천 계획을 **텍스트 + 로드맵 그림 링크**로 제공하기 위한 웹사이트와 REST API입니다.

## 포함된 결과물

- `public/index.html`: 제공된 Dream Map 에이전트를 임베드한 반응형 홈페이지.
- `public/assets/sample-roadmap.svg`: 가상의 8주 게임 기획 로드맵 이미지.
- `src/roadmap.mjs`: 입력 검증, 한글 SVG, 텍스트, 링크 변환.
- `src/worker.mjs`: 웹사이트와 로드맵 REST API. 표준 Web API만 사용하며 외부 이미지 생성 서비스는 호출하지 않습니다.
- `connector/openapi.json`: Copilot Studio에 가져올 Swagger 2.0 연결 명세.
- `connector/parent-agent-addendum.txt`: 부모 에이전트에 추가할 도구 사용 지침.
- [Copilot Studio 연결 방법](connector/SETUP.ko.md).

현재 Dream Map 편집 화면에서는 **도구 추가 → 추가 → MCP**로 `https://dream-map-roadmap-sieun.ai-camp-1009.chatgpt.site/api/mcp`를 연결합니다. REST API와 MCP가 같은 검증 및 렌더러를 사용합니다.

학생이 방향을 고르기 전에는 API가 계획을 생성하지 않도록 `directionConfirmed: true`를 요구합니다. 학생이 실제로 선택했는지 판단하는 책임은 부모 에이전트에 있습니다. 서버가 대화를 직접 읽거나 그 선택을 독립적으로 검증하지는 않습니다.

## 실행

Node.js 22 이상. 외부 패키지를 설치할 필요가 없습니다.

```sh
npm run build
npm test
npm start
```

`http://127.0.0.1:8787`에서 확인합니다. `/api/health`는 상태 확인, `/connector/openapi.json`은 현재 접속 호스트를 반영한 연결 파일입니다. 다른 플랫폼에 배포할 때는 `.openai/hosting.json`의 Sites 프로젝트 ID를 그대로 재사용하지 마세요.

## 연결 범위

GitHub 소스 업로드, 웹사이트 배포, Copilot Studio 도구 추가/게시 여부는 각각 별도로 확인해야 합니다. iframe은 실제 에이전트를 표시하지만, 대화 결과를 부모 페이지에 전달하지 않습니다. 로드맵 링크를 열어 보거나 홈페이지에 링크를 붙여 넣을 수 있습니다.

SVG는 채널마다 미리보기 지원이 다르므로 **그림 보기 링크는 항상 제공**합니다. PNG 저장은 브라우저에서 제공하며, API가 PNG 이미지 URL을 반환한다고 주장하지 않습니다.

로드맵 데이터는 링크에 포함됩니다. 이름·연락처·상세 성적 등 개인정보를 넣지 마세요. 서버는 로드맵 내용을 영구 저장하지 않습니다.
