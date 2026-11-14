# Dream Map 연결하기

## 현재 구성

- `POST /api/roadmaps`: 선택한 진로 계획을 텍스트와 SVG 이미지 링크로 변환.
- `GET /api/roadmap.svg?data=…`: 실제 SVG 이미지 응답.
- `/roadmap?data=…`: 그림, 텍스트, PNG·SVG 저장 화면.
- `/`: 사용자가 제공한 실제 Copilot Studio webchat iframe과 로드맵 화면.
- 로드맵 생성은 규칙 기반 렌더링이며 별도의 유료 이미지 생성 API가 필요하지 않습니다.
- 서버는 로드맵을 저장하지 않습니다. URL의 인코딩된 계획을 렌더링하므로 링크를 가진 사람은 계획 내용을 볼 수 있습니다. 인코딩은 암호화가 아닙니다. 이름, 연락처, 성적 등은 입력하지 마세요.

## 연결 전 조건

API는 **Copilot Studio 서버와 학생의 브라우저에서 접근 가능한 HTTPS 주소**여야 합니다. 사이트가 소유자 전용이면 Copilot Studio 도구와 외부 이미지 로딩은 작동하지 않습니다. 사이트를 공개할 경우 페이지와 렌더링 API에 누구나 접근할 수 있습니다. API에는 학생 대화나 계정 인증정보를 저장하지 않습니다.

GitHub에 코드를 올리는 일과 API를 배포하는 일은 별개입니다. GitHub Pages만으로는 이 POST API를 실행할 수 없습니다.

## 1. Copilot Studio에 REST API 도구 추가

스크린샷처럼 부모 에이전트의 **빌드** 화면에서 부모 카드의 **도구 + → REST API**를 엽니다. 또는 **도구 → 도구 추가 → 새 도구 → REST API**를 선택합니다. UI 이름은 환경에 따라 다를 수 있습니다.

1. `openapi.json`을 업로드합니다. 배포된 서비스의 `/connector/openapi.json`을 받으면 실제 호스트가 반영됩니다.
2. 도구 이름을 `Dream Map Roadmap`으로 설정합니다.
3. 인증은 `없음(None)`을 선택합니다. 이것은 로드맵 API에 대한 설정입니다. 에이전트 자체 인증을 변경하라는 뜻이 아닙니다.
4. `createCareerRoadmap` 작업을 선택합니다.
5. 입력은 부모 에이전트가 완성한 계획에서 채웁니다. `directionConfirmed`가 단순히 항상 true가 되도록 설정하지 마세요. 학생이 선택했을 때만 도구가 실행되어야 합니다.
6. 도구를 추가한 뒤 `parent-agent-addendum.txt` 내용을 부모 에이전트 지침에 추가합니다. 기존 1~14번과 안전 규칙은 유지합니다.
7. 도구 실행 후 동작을 설정할 수 있다면, 응답에 **textRoadmap과 roadmapUrl을 함께 포함**하도록 설정합니다. 단순히 JSON에 adaptiveCard가 들어 있다고 카드가 자동 표시되는 것은 아닙니다.
8. 저장하고 에이전트를 다시 게시합니다. 게시 전 변경은 데모 웹사이트에 반영되지 않을 수 있습니다.

## 2. 답변에 그림을 표시하기

가장 호환성이 좋은 방식은 **텍스트 + ‘로드맵 그림 보기’ 링크**입니다. 도구의 `roadmapUrl`을 Markdown 링크나 Adaptive Card의 `Action.OpenUrl`에 넣습니다. 링크를 누르면 그림을 볼 수 있고 PNG로 저장할 수 있습니다.

SVG 이미지 미리보기는 채널별 지원이 다릅니다. 따라서 SVG를 채팅 안에 직접 표시하는 것을 보장하지 않습니다. 현재 도구는 PNG 파일 URL을 반환하지 않습니다. PNG는 그림 화면에서 학생 브라우저가 만들어 내려받습니다. 채팅 안의 PNG 미리보기가 꼭 필요하면 서버에서 PNG를 렌더링하고 파일 저장소에 보관하는 별도 확장이 필요합니다.

화면에 카드를 확실히 보내려면 토픽/도구 응답 설정에서 Adaptive Card를 명시적으로 전송하세요. 기본 응답 구조는 도구의 `adaptiveCard` 출력에 들어 있습니다. 카드 버튼은 `roadmapUrl`을 엽니다. 채널 또는 환경의 응답 매핑 방식에 맞춰 바인딩해야 합니다.

## 3. iframe과 자동 연동 범위

기존 Microsoft 데모 웹사이트에서도 부모 에이전트가 도구를 호출하면 텍스트 답변과 링크를 함께 보낼 수 있습니다. 기존 데모 페이지의 코드를 수정할 필요가 없습니다.

이 저장소의 홈페이지는 동일한 실제 에이전트 iframe을 사용합니다. 다른 출처의 iframe 내부 대화를 읽지 않습니다. 따라서 그림을 오른쪽 패널에 자동으로 붙이는 기능은 없습니다. 답변의 링크를 열거나 ‘로드맵 링크 불러오기’에 링크를 붙여 넣으면 그림이 나타납니다. 예시 버튼은 가상 계획임을 명시합니다.

대화를 읽어 옆 패널까지 자동 갱신하려면 Direct Line 기반의 별도 Web Chat 클라이언트를 구현해야 합니다. 제공된 iframe URL만으로는 토큰 엔드포인트나 에이전트 인증 설정을 알 수 없으므로 그러한 연결이 완료됐다고 주장하지 않습니다.

## 4. 확인할 대화

1. ‘나는 중2이고 게임과 그림을 좋아해. 어떤 방향이 좋을까?’ → 정보 확인/방향 추천. 도구가 호출되면 안 됩니다.
2. ‘게임 기획 방향으로 해 볼래. 평일 30분 두 번, 주말 2시간 가능해.’ → 필요한 내용이 모이면 계획과 실제 도구 결과 링크 출력.
3. 링크를 열어 한글 그림 확인 → PNG 저장 및 텍스트 복사 확인.
4. ‘시간이 줄어서 주 1시간만 가능해.’ → 계획과 링크가 새로 생성되는지 확인.
5. API 접근을 실패시키면 텍스트 계획과 생성 실패 안내만 표시되는지 확인.

## 공식 문서

- REST API 도구: https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/tools-add-rest-api-customer-conversation
- 도구 추가 및 응답 동작: https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-tools-custom-agent
- iframe과 SDK의 차이: https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-integrate-web-or-native-app-m365-agents-sdk

실제 Copilot Studio에서 연결과 게시, 데모 대화까지 통과하기 전에는 ‘에이전트 연동 완료’로 보지 않습니다.
