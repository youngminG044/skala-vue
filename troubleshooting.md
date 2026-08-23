# 트러블 슈팅 내역

날씨 대시보드 실습 프로젝트를 진행하면서 실제로 막혔던 지점과 해결 과정을 기록한다.
"이렇게 하면 된다"보다 **왜 그렇게 되는가**에 초점을 맞춘다.

---

## 1. slot으로 넘긴 컴포넌트는 그 카드의 자식이 아니다

### 증상

`BaseDashboardCard` 안에 `<CitySearch />`를 써 넣었으니 당연히 부모-자식 관계라고 생각했다.

```vue
<BaseDashboardCard title="🔍 도시 검색">
  <CitySearch :find-city="findCity" @update-query="updateQuery" />
</BaseDashboardCard>
```

### 원인

DOM 위치와 컴포넌트 계층은 별개다.

| 관점           | 결과                                                   |
| -------------- | ------------------------------------------------------ |
| 렌더 트리(DOM) | `<slot />` 자리에 그려지므로 카드의 `<section>` **안** |
| 컴포넌트 계층  | 부모는 `BaseDashboardCard`가 아니라 `WeatherParent`    |

슬롯 콘텐츠는 **부모 스코프에서 컴파일되어 자식의 slot 위치에 렌더링**된다.
`:find-city="findCity"`의 `findCity`는 `WeatherParent`의 변수이고,
`BaseDashboardCard`는 이 값에 접근조차 못 한다.

근거는 세 가지로 확인했다.

- `BaseDashboardCard`는 `CitySearch`를 import 하지도 않는다
- `emit('select', city)`가 카드를 거치지 않고 `WeatherParent` 핸들러로 직행한다
- scoped 스타일 scope id가 카드가 아니라 `WeatherParent`의 것으로 붙는다

### 결론

이게 slot 패턴의 장점이다. 카드 디자인은 재사용하면서 데이터 흐름은
`WeatherParent ↔ CitySearch` 한 단계로 유지되어 **prop drilling이 생기지 않는다.**

---

## 2. 자식으로 만들면서 직접 바인딩을 유지하려면

### 시도

"진짜 자식으로 만들되 부모가 직접 통신"하도록 바꿔봤다.
중계 코드를 손으로 쓰지 않으려면 `$attrs` 패스스루가 필요하다.

```js
// BaseDashboardCard.vue
defineOptions({ inheritAttrs: false })
defineProps({ title: {...}, content: { type: [Object, Function], default: null } })
```

```vue
<component :is="content" v-bind="$attrs" v-if="content" />
<slot v-else />
```

`inheritAttrs: false`가 핵심이다. 끄지 않으면 `find-city` 같은 값이
최상위 `<section>`에 **DOM 속성으로 붙어버린다.**
Vue 3에서는 이벤트 리스너도 `onUpdateQuery` 형태로 `$attrs`에 담기므로
`@update-query`까지 한 번에 전달된다.

### 알게 된 부작용

1. **scoped 스타일 범위가 넓어진다.** 자식의 루트 엘리먼트는 부모의 scope id를 함께 갖는다.
   SSR 렌더 결과에서 `.list-section`이 `data-v-865bcb26`(CityList) +
   `data-v-3209937f`(BaseDashboardCard) 두 개를 다는 것을 확인했다.
   카드에 스타일을 추가하면 자식 루트까지 걸릴 수 있다.
2. **props 이름이 충돌하면 값이 가로채인다.** 카드가 선언한 `title`/`content`는
   `$attrs`에서 빠지므로, `title` prop을 가진 컴포넌트를 `content`로 넣으면
   그 값이 자식까지 도달하지 못한다.

### 되돌린 이유

과제 명세를 다시 확인하니 **slot 방식이 요구사항**이었다.
명세 6번이 1번 항목에서 정리한 내용과 정확히 같은 이야기였다.
아직 커밋 전이라 `git checkout -- <file>` 두 개로 원복했다.

교훈: 구현 방향을 바꾸기 전에 명세를 먼저 확인할 것.

---

## 3. git rm이 거부됨

### 증상

```
error: the following file has local modifications:
    src/components/WeatherParent.vue
(use --cached to keep the file, or -f to force removal)
```

### 원인

작업 트리에 커밋되지 않은 수정이 남아 있는 파일은 git이 실수로 날리는 것을 막는다.

### 해결

수정 내용이 `WeatherHomeView.vue`로 이미 옮겨간 뒤라 버려도 되는 상태였으므로
`git rm -f`로 강제 삭제했다.

> 파일 내용은 남기고 추적만 끊고 싶다면 `--cached`, 정말 지울 거면 `-f`.

---

## 4. 파일명 변경 시 이력 보존과 일괄 치환

### 방법

`mv` 대신 `git mv`를 써서 rename으로 기록되게 했다.

```bash
git mv src/components/CitySearch.vue src/components/SearchBar.vue
git mv src/components/CityList.vue   src/components/WeatherCard.vue
```

`git status`에 `R` (rename)로 잡히면 이력이 이어진 것이다.

### 주의했던 부분

참조를 `sed`로 일괄 치환할 때 **부분 문자열 사고**를 조심해야 한다.

```bash
sed -i '' 's/WeatheCard/WeatherCard/g' src/components/WeatherParent.vue
```

`WeatheCard` → `WeatherCard` 치환은 이미 올바른 `WeatherCard`를
`Weatherr Card`로 만들지 않는다. 패턴의 `e` 다음이 `C`라서
`WeatherCard`(e 다음이 `r`)에는 매칭되지 않기 때문이다.
그래도 치환 후에는 반드시 확인했다.

```bash
grep -rn "Weathe" src/ --include="*.vue"   # 잔재/오타 동시 확인
```

치환 대상은 import 경로, 템플릿 태그, 주석까지 전부다. 주석을 빼먹으면
파일명과 설명이 어긋난 채로 남는다.

---

## 5. 리스트 컴포넌트를 카드 컴포넌트로 쪼갤 때

### 변경

`CityList`(배열을 받아 내부에서 `v-for`) → `WeatherCard`(도시 객체 1개)
로 단위를 바꾸고, 반복은 데이터 소유자인 부모로 올렸다.

```vue
<WeatherCard v-for="city in weatherList" :key="city.id" :city="city" ... />
```

### 확인한 것

래퍼 `<div class="list-section">`를 제거해도 되는지 걱정됐는데,
해당 클래스에 **CSS 규칙이 아예 없는 빈 래퍼**였다. 제거해도 레이아웃 변화 없음.

`.city:last-child { margin-bottom: 0 }`은 카드들이 카드 섹션 안에서
형제로 나열되므로 그대로 동작한다. (scoped 컴파일 결과는
`.city:last-child[data-v-xxx]`라 선택자 의미가 바뀌지 않는다)

---

## 6. SSR 스모크 테스트로 렌더링 검증하기

빌드가 통과해도 props가 실제로 자식까지 도달하는지는 알 수 없어서,
Vite의 `ssrLoadModule` + `@vue/server-renderer`로 HTML을 찍어봤다.

### 6-1. 모듈을 찾지 못함

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite'
imported from /.../scratchpad/smoke.mjs
```

**원인**: 스크립트를 프로젝트 밖(스크래치 디렉토리)에 두고 실행해서
Node가 `node_modules`를 위로 훑어 올라가도 찾지 못했다.

**해결**: 스크립트를 프로젝트 루트로 복사해서 실행하고 끝나면 지웠다.

### 6-2. `window is not defined`

라우터를 붙이고 같은 방식으로 테스트하려 하자 실패했다.

```
ReferenceError: window is not defined
    at useHistoryStateNavigation (vue-router.js:102)
    at createWebHistory (vue-router.js:162)
```

**원인**: `createWebHistory()`는 브라우저의 `window.history`에 의존한다.
Node에는 `window`가 없다. `src/router/index.js`를 import 하는 순간
모듈 평가 단계에서 터진다.

**해결 방향 두 가지**

| 방법                                                           | 평가                                              |
| -------------------------------------------------------------- | ------------------------------------------------- |
| `window`/`document` 스텁을 만들고 `createMemoryHistory`로 교체 | 가능하지만 스텁이 늘어나고, 결국 진짜 환경이 아님 |
| **실제 브라우저에서 검증**                                     | 채택                                              |

localStorage 의존(즐겨찾기 스토어)까지 겹쳐서 스텁이 더 늘어날 상황이었다.
라우팅·localStorage·클릭이 모두 얽힌 기능은 **실제 브라우저로 확인하는 편이
빠르고 정확하다**고 판단해 dev 서버를 띄우고 6개 경로를 직접 열어 확인했다.

> SSR 스모크 테스트는 라우터가 없는 순수 컴포넌트 렌더 검증에는 여전히 유용하다.
> 1~5번 항목은 이 방법으로 검증했다.

---

## 7. Vue Router 버전 확인

`package.json`에 `"vue-router": "^5.0.4"`, 실제 설치는 `5.2.0`이었다.
v4 문법이 그대로 통하는지 확신이 없어 공식 문서를 확인했다.

결론: **Catch-all과 Lazy Loading 문법은 v4와 동일하다.**

```js
// Catch-all — 반드시 routes 배열의 마지막에
{ path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('...') }

// Lazy Loading — 동적 import 함수를 그대로 component에
{ path: '/', component: () => import('@/views/WeatherHomeView.vue') }
```

- 마지막 `*`가 있으면 params가 배열(`['not','found']`)로 들어와
  이름으로 이동할 때 `/`가 인코딩되지 않는다.
- Catch-all을 위에 두면 다른 경로를 전부 가로챈다.

지연 로딩이 실제로 걸렸는지는 빌드 산출물로 확인했다.
뷰별로 청크가 쪼개져 있으면 성공이다.

```
dist/assets/WeatherHomeView-CMyaJhQB.js     2.88 kB
dist/assets/WeatherDetailView-DIKQbyd5.js   1.94 kB
dist/assets/NotFoundView-Bcb--spB.js        0.74 kB
```

---

## 8. 검색어가 목록에 반영되지 않던 문제

### 증상

`filteredWeatherList`를 computed로 만들어 뒀는데 화면 목록은 그대로 4개였다.

### 원인

계산만 해두고 템플릿에서는 `weatherList`(전체)를 렌더하고 있었다.
`filteredWeatherList`는 안내 문구 분기(`isCity`)에만 쓰이고 있었다.

### 해결

실제로 그릴 목록을 별도 computed로 분리했다.

```js
const displayList = computed(() =>
  keyword.value === '' ? weatherList.value : filteredWeatherList.value,
)
```

검색 전에는 전체, 검색 중에는 걸러진 결과를 보여준다.

---

## 9. 검색어를 URL 쿼리와 동기화할 때 push vs replace

### 문제

`router.push`로 쿼리를 갱신하면 **글자 하나 칠 때마다 히스토리가 쌓인다.**
"부산"을 입력하면 뒤로가기를 두 번 눌러야 이전 화면으로 돌아간다.

### 해결

```js
watch(keyword, (value) => {
  router.replace({ query: value === '' ? {} : { q: value } })
})
```

`replace`는 현재 항목을 덮어쓰므로 기록이 쌓이지 않는다.

반대로 **초기값은 URL에서 읽어와야** 새로고침이나 링크 공유가 동작한다.

```js
const findCity = ref(typeof route.query.q === 'string' ? route.query.q : '')
```

`route.query.q`는 문자열 또는 배열(`?q=a&q=b`)일 수 있어 타입 확인이 필요하다.

브라우저에서 "부산" 입력 → 주소가 `/?q=부산`으로 바뀌고 목록이 1개로
좁혀지는 것을 확인했다.

---

## 10. 즐겨찾기 상태를 어디에 둘 것인가

### 고민

이 프로젝트는 "부모가 상태를 소유하고 props/emit으로 주고받는다"는 원칙을 지켜왔다.
그런데 즐겨찾기는 **홈 화면과 즐겨찾기 화면이 함께 보는 상태**라
어느 한 부모가 소유할 수 없다.

### 선택

Pinia 스토어(`src/stores/favorites.js`)에 두고, 예외적으로
`WeatherCard`가 부모를 거치지 않고 스토어를 직접 읽고 쓴다.
그렇게 하지 않으면 카드를 쓰는 모든 뷰가 같은 배선을 반복해야 한다.

예외라는 사실은 컴포넌트 주석에 남겼다.

### localStorage 방어

JSON이 깨져 있으면 앱 전체가 죽으므로 읽기를 감쌌다.

```js
const loadIds = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}
```

`Array.isArray` 확인까지 넣은 이유는, 파싱은 성공하지만 배열이 아닌 값
(`"null"`, `"123"`)이 들어 있을 수 있기 때문이다.

저장은 `watch`로 자동화했다. 배열 자체를 교체(`filter`, 스프레드)하므로
`deep: true`가 필요 없다.

---

## 11. 없는 도시 코드로 상세 페이지에 들어왔을 때

`/weather/city_99`처럼 Mock에 없는 id로 들어오면 `findCityById`가 `null`을 준다.

두 가지 선택지가 있었다.

| 방법                              | 판단                                                             |
| --------------------------------- | ---------------------------------------------------------------- |
| Catch-all(404)로 `router.replace` | URL을 유지하려면 `pathMatch` params를 직접 만들어야 해서 복잡    |
| **뷰 안에서 안내 문구 표시**      | 채택. 어떤 코드가 잘못됐는지 화면에 보여줄 수 있어 디버깅에 유리 |

카드 하단 즐겨찾기 버튼은 도시를 못 찾았을 때 뜨면 안 되므로
슬롯 자체에 `v-if`를 걸었다.

```vue
<template #footer v-if="city"></template>
```

조건부 슬롯은 컴파일 시 동적 슬롯으로 처리되어, 조건이 거짓이면
`$slots.footer` 자체가 `undefined`가 된다.
따라서 카드의 `v-if="$slots.footer"` 분기가 의도대로 동작한다.
(브라우저에서 `city_99` 진입 시 footer 영역이 렌더되지 않는 것으로 확인)

---

## 12. 린터 오탐 두 건

기능 문제는 아니지만 에디터에 경고가 뜬 사례.

| 린터      | 경고                             | 실제                                                                              |
| --------- | -------------------------------- | --------------------------------------------------------------------------------- |
| SonarQube | `Remove this commented out code` | 한글 HTML 주석 안에 `v-bind="$attrs"` 같은 코드 조각이 있어서 오탐                |
| cSpell    | `"Weathe": Unknown word`         | 파일명 오타(`WeatheCard.vue`) 경유 시점의 경고. `WeatherCard.vue`로 정정하며 해소 |

주석에 코드 예시를 넣으면 정적 분석기가 "주석 처리된 코드"로 오해할 수 있다.
동작에는 영향이 없다.

---

## 13. 태양 섹션 마지막 줄이 비어 보이던 문제

### 증상

`/weather/:cityId`의 태양 카드에서 오른쪽 아래가 휑하게 비어 보였다.

```
일출 05:38    일몰 19:22    방위각 145°
고도 64°      (빈칸)        (빈칸)
```

### 원인

항목은 4개(`일출`/`일몰`/`방위각`/`고도`)인데 그리드를 3열로 잡았다.

```css
grid-template-columns: repeat(3, 1fr); /* 4개를 3열에 → 2행 2칸이 빔 */
```

CSS Grid는 남는 칸을 채우지 않는다. `4 % 3 = 1`이라 마지막 줄에 1칸만 놓이고
나머지 2칸은 그대로 빈 공간이 된다. 깨진 게 아니라 계산대로 나온 결과다.

### 해결

**열 수를 항목 수의 약수로 맞춘다.** 4의 약수 중 폭이 감당되는 2열을 골랐다.

```css
grid-template-columns: repeat(2, 1fr); /* 2×2로 두 줄이 정확히 참 */
```

### 곁다리로 같이 고친 것

기본이 2열이 되면서 기존 반응형 분기(`420px 이하 → 2열`)가 **아무 일도 하지 않는
죽은 규칙**이 됐다. 좁은 폭에서는 칸 padding까지 더해져 값이 좁아지므로 1열로 바꿨다.

```css
@media (max-width: 420px) {
  .sun-grid {
    grid-template-columns: 1fr;
  }
}
```

기본 레이아웃을 바꿀 때는 **미디어 쿼리도 같이 확인**해야 한다.
기본값과 분기값이 같아지면 규칙이 남아 있어도 효과가 없다.

### 교훈

고정 열 수 그리드는 `항목 수 % 열 수 == 0`인지 먼저 계산한다.
항목 수가 유동적이면 `repeat(auto-fit, minmax(...))`가 맞지만,
이번처럼 항목이 4개로 고정이면 명시적인 2열이 결과를 예측하기 쉽다.

---

## 14. API Key는 클라이언트 앱에서 완전히 숨길 수 없다

### 증상

`.env.local` 로 키를 옮겨 소스에서 걷어냈는데도,
브라우저 개발자도구 Network 탭에 키가 그대로 보인다.

```
https://api.openweathermap.org/data/2.5/weather?appid=f8c4...&lat=37.5665&lon=126.978
```

### 원인

**두 가지가 겹친다.**

1. Vite의 `VITE_` 변수는 "서버에서 숨겨 읽는 값"이 아니라
   **빌드 시 문자열로 치환**되는 값이다. `dist/assets/*.js` 를 열면 키가 평문으로 들어 있다.
2. OpenWeatherMap은 인증을 `appid` **쿼리 파라미터**로만 받는다.
   헤더로 보낼 방법이 없어 주소창·로그·프록시에 그대로 남는다.

즉 `.env.local` 이 막아주는 것은 **git 저장소에 커밋되는 것**까지다.
배포된 앱을 여는 사람에게는 어차피 보인다.

### 그래서 어떻게 했나

과제 범위에서는 `.env.local` + `.gitignore` 가 표준적인 답이고 그대로 두었다.
다만 이게 "안전하다"는 뜻은 아니라는 걸 기록해 둔다.

실제 서비스에서 키를 감추려면 클라이언트가 아니라 **서버를 거쳐야** 한다.

| 방법                          | 키 위치           |
| ----------------------------- | ----------------- |
| 지금 (클라이언트 직접 호출)   | 브라우저 (노출됨) |
| 백엔드 프록시 / 서버리스 함수 | 서버 (노출 안 됨) |

OpenWeatherMap 대시보드에서 키별 호출량을 볼 수 있으므로,
공개 저장소에 올렸거나 유출이 의심되면 **재발급 후 이전 키를 폐기**하는 게 맞다.

### 곁다리: `.gitignore` 예외 규칙의 순서

`!` 예외는 **무시 규칙보다 뒤에** 와야 한다. 순서가 바뀌면 예시 파일까지 무시된다.

```gitignore
.env
.env.*
!.env.example   # 이 줄이 위로 가면 .env.* 가 나중에 덮어써서 무효가 된다
```

확인은 `git check-ignore -v` 보다 실제 동작이 확실하다.

```bash
git add --dry-run .env.example   # add '.env.example'  -> 추적 가능
git add --dry-run .env.local     # ignored 안내         -> 무시됨
```

---

## 15. Mock을 API로 바꿀 때 깨진 전제들

동기 데이터를 비동기로 바꾸면 "값은 항상 거기 있다"는 전제가 깔린 코드가 전부 흔들린다.
컴파일은 통과하는데 화면만 비어 보이는 종류라 미리 훑어야 했다.

| 전제                            | Mock일 때             | API일 때              | 조치                                         |
| ------------------------------- | --------------------- | --------------------- | -------------------------------------------- |
| `findCityById(id)` 가 값을 준다 | 항상 성공             | 응답 전이면 없음      | "등록된 코드인가"와 "데이터가 왔는가"를 분리 |
| `selectedCity` 는 항상 객체     | `weatherMock[0]` 보장 | 초기엔 `null`         | 읽는 쪽에서 `null` 을 기본값으로 대체        |
| 목록이 비면 "검색 결과 없음"    | 맞음                  | 로딩 중에도 비어 있음 | 로딩 / 에러 / 빈 결과를 각각 분기            |

특히 두 번째가 성가셨다.
`city.status` 처럼 한 단계 더 들어가는 접근은 응답 전에 그대로 죽는다.
`city` 를 computed로 한 겹 두고 템플릿을 `v-if` 로 감싸야 했다.

### 없는 도시 코드 vs 아직 로딩 중

둘 다 "표시할 데이터가 없음"이지만 사용자에게 할 말이 다르다.
관측 데이터가 아니라 **도시 목록**으로 먼저 판단하면 응답을 기다리지 않고 가를 수 있다.

```js
const isKnownCity = computed(() => findCityById(cityId.value) !== null)
```

`city_99` 로 들어오면 요청을 보내지도 않고 바로 안내한다.

---

## 16. 상세 페이지에서 도시만 바뀌면 onMounted가 다시 안 돈다

### 증상

`/weather/city_01` 에서 `/weather/city_03` 으로 이동해도
예보가 이전 도시 그대로였다.

### 원인

라우트가 바뀌어도 **매칭되는 컴포넌트가 같으면** Vue Router는 컴포넌트를 재사용한다.
`onMounted` 는 처음 한 번만 돌기 때문에, 파라미터만 달라지는 이동에서는 실행되지 않는다.

### 해결

파라미터를 computed로 꺼내고 감시한다.

```js
const cityId = computed(() => route.params.cityId)

onMounted(load)
watch(cityId, load) // 같은 컴포넌트를 재사용하는 이동까지 커버
```

`route.params.cityId` 를 그대로 쓰지 않고 computed로 감싼 이유가 여기 있다.
표시용 값이면서 동시에 감시 대상이라, 한 번만 읽고 지역 변수에 넣어두면
이동했을 때 옛 값이 남는다.

---

## 17. 응답 필드에서 걸린 잔가시 세 개

기능이 안 되는 문제는 아니었지만 값이 틀리게 나올 뻔한 것들.

### PM2.5의 키 이름

`components.pm25` 가 아니라 **`components.pm2_5`** 다.
잘못 쓰면 `undefined` 가 넘어가고, 게이지 바 폭이 `NaN%` 가 되면서
CSS가 무시돼 "0인 것처럼" 그려진다. 에러가 안 나서 더 위험하다.

### 시각을 브라우저 시간대로 찍으면 안 된다

응답은 시각을 두 조각으로 준다.

```
dt       : UTC 기준 Unix 초
timezone : 그 도시의 UTC 오프셋 (초. 한국이면 32400)
```

`new Date(dt * 1000)` 을 로컬 시간대로 찍으면 **보는 사람이 있는 곳의 시각**이 나온다.
부산의 일출을 다른 시간대에서 열면 엉뚱한 값이 된다.
값을 미리 밀어두고 `getUTC*` 로 읽으면 브라우저와 무관하게 현지 시각이 나온다.

```js
const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000)
date.getUTCHours() // 그 도시의 현지 시
```

### `units=metric` 을 빼면 켈빈이 온다

기본 단위가 켈빈이라 28°C가 `301.6` 으로 온다.
숫자가 그럴듯해서 화면에 뜨기 전까지 눈치채기 어렵다.

### 곁다리: `.env` 값의 따옴표

`VITE_KEY='abc...'` 처럼 따옴표로 감싸도 dotenv가 벗겨내므로 동작한다.
다만 키 길이를 셀 때 34자(32 + 따옴표 2)로 보여서 잠깐 헷갈렸다.
따옴표 없이 쓰는 편이 확인하기 쉽다.

---

## 18. 태양 위치 계산 검산하기

API에 없는 값이라 직접 계산했는데, 공식이 맞는지 확인할 방법이 필요했다.
천문학에는 **암산으로 검증 가능한 기준점**이 있어서 그걸 썼다.

```
정오 태양 고도 = 90 − 위도 ± 23.44   (하지 +, 동지 −)
```

서울(위도 37.57)이면 하지 75.9°, 동지 29.0°.

```bash
node checkSun.mjs   # 프로젝트 루트에서 실행 (node_modules 경로 때문)
```

| 조건                  | 이론값    | 계산값              |
| --------------------- | --------- | ------------------- |
| 하지 정오 고도        | 75.9°     | 76°                 |
| 동지 정오 고도        | 29.0°     | 29°                 |
| 자정                  | 음수      | −40°, `isUp: false` |
| 춘분 일출 무렵 방위각 | ≈ 90°(동) | 88°                 |

화면에서도 교차 검증했다.
일몰 19:18인 시각에 방위각 284°(서) · 고도 2° 가 나왔고,
낮 길이 13시간 26분이 `19:18 − 05:52` 와 정확히 맞았다.

**교훈:** 직접 계산한 값은 "그럴듯해 보인다"로 넘기면 안 된다.
독립적으로 알 수 있는 기준값이 하나라도 있으면 그걸로 맞춰본다.

---

## 19. 도시를 20곳으로 늘리면서 미리 짚은 것들

기능이 깨지진 않았지만, 손대기 전에 확인하지 않았으면 조용히 틀렸을 지점들이다.

### id를 재정렬하면 즐겨찾기가 엉뚱한 도시를 가리킨다

도시를 20곳으로 늘리면서 `city_01` 부터 지역 순서대로 다시 매기고 싶었다.
그렇게 하면 **이미 저장된 즐겨찾기가 다른 도시를 가리킨다.**

즐겨찾기는 localStorage에 id 배열로만 저장된다.

```
weather-favorites: ["city_01","city_02"]
```

여기엔 "서울"이라는 정보가 없다. id가 무엇을 가리키는지는 `cities.js` 순서에 달려 있어서,
배열을 재정렬하면 저장된 값은 그대로인데 **가리키는 대상만 바뀐다.**
공유된 `/weather/city_03` 링크도 마찬가지다.

그래서 기존 4개는 번호를 고정하고 새 도시를 뒤에 붙였다.
번호와 지역 순서가 어긋나 보기엔 나쁘지만, 저장된 데이터를 깨는 것보다 낫다.

**교훈:** 외부에 저장되거나 공유된 식별자는 "보기 좋게" 정리하면 안 된다.
정렬이 필요하면 id가 아니라 표시 순서를 따로 두는 게 맞다.

### 호출량이 도시 수에 비례해 늘어난다

도시 한 곳당 2건(현재 날씨 + 대기오염)이라 목록 진입 시 **40건**이 나간다.
무료 플랜 한도는 분당 60건.

| 상황                  | 호출 | 한도 대비      |
| --------------------- | ---- | -------------- |
| 목록 진입 1회         | 40건 | 안전           |
| 1분 안에 새로고침 2회 | 80건 | **초과 → 429** |

스토어 캐시(10분)가 화면 이동으로 인한 재호출은 막지만,
수동 "↻ 새로고침"은 캐시를 무시하므로(`loadAll(true)`) 연타하면 한도에 닿는다.

429는 이미 안내 문장으로 바꿔두었다.
("API 호출 한도를 넘었습니다. 잠시 후 다시 시도해 주세요.")
지금은 이 정도로 두지만, 도시를 더 늘린다면 새로고침 버튼에 쿨다운을 두거나
화면에 보이는 도시만 요청하는 방식이 필요하다.

### 검증할 때 한글 입력이 안 되는 문제

브라우저 자동화로 검색창에 한글을 타이핑했더니 입력되지 않았다.
IME(한글 조합)를 거치는 입력이라 키 이벤트만으로는 글자가 만들어지지 않는다.

우회로: **쿼리 스트링으로 같은 상태를 만든다.**

```
http://localhost:5173/?q=%EC%A3%BC     # ?q=주
```

`WeatherHomeView` 가 `route.query.q` 로 검색어를 초기화하도록 되어 있어
타이핑 없이 검색 결과 화면을 그대로 확인할 수 있었다.
(원래는 링크 공유·새로고침 대응으로 넣은 기능인데 테스트에도 쓸모가 있었다)

---

## 20. PrimeVue를 설치했더니 "Invalid PrimeUI License" 배너가 뜬다

### 증상

`npm install primevue @primeuix/themes primeicons` 로 설치하고 화면을 열었더니
우측 하단에 빨간 배너가 계속 떠 있었다.

```
Invalid PrimeUI License
```

기능은 정상 동작하는데 배너만 사라지지 않는다.

### 원인

**PrimeVue 5부터 라이선스 모델이 바뀌었다.**
`npm install primevue` 는 최신인 5.0.1을 받아온다.

```
primevue 4.x  ->  license: MIT
primevue 5.x  ->  license: SEE LICENSE IN LICENSE.md  (PrimeUI 상용)
```

LICENSE.md를 읽어보면 개인·학생·비영리는 **Community License(무료)** 대상이지만,
그 등급도 **라이선스 키 발급이 필요**하고 키가 없으면 이 배너가 뜬다.

### 해결

학습용 과제라 키 발급 절차 없이 쓸 수 있어야 해서 **MIT인 4.5.5로 내렸다.**
테마·아이콘 패키지도 같이 확인해야 한다. 함께 최신을 받으면 그쪽도 상용이다.

| 패키지           | 받아온 버전 | 라이선스 | 내린 버전 | 라이선스 |
| ---------------- | ----------- | -------- | --------- | -------- |
| primevue         | 5.0.1       | 상용     | **4.5.5** | MIT      |
| @primeuix/themes | 3.0.0       | 상용     | **1.2.5** | MIT      |
| primeicons       | 8.0.0       | 상용     | **7.0.0** | MIT      |

```bash
npm install primevue@4.5.5 @primeuix/themes@1.2.5 primeicons@7
```

라이선스는 설치 후 바로 확인할 수 있다.

```bash
node -e "console.log(require('./node_modules/primevue/package.json').license)"
```

### 교훈

**메이저 버전이 올라가면 API뿐 아니라 라이선스도 바뀔 수 있다.**
`npm install <패키지>` 는 항상 최신을 받으므로,
문서를 보고 고른 버전과 실제 설치된 버전이 다를 수 있다.
설치 직후 `package.json` 의 `license` 를 확인하는 습관이 필요하다.

---

## 21. 고친 줄 알았는데 계속 옛 화면을 보고 있었다

### 증상

20번에서 MIT 버전으로 내리고 `node_modules` 어디에도
"Invalid PrimeUI License" 문구가 없는 것까지 확인했는데,
브라우저에는 배너가 그대로 떠 있었다. 하드 리로드(⌘⇧R)도 소용없었다.

### 원인

**보고 있던 주소가 다른 서버였다.**

dev 서버 로그를 그제야 확인했다.

```
Port 5173 is in use, trying another one...
Port 5174 is in use, trying another one...
  ➜  Local:   http://localhost:5175/
```

이전에 띄운 dev 서버가 종료되지 않고 5173을 잡고 있었고,
새로 띄운 서버는 5175로 올라갔다.
나는 계속 5173(= PrimeVue 5 시절의 옛 서버)을 열고 있었던 것이다.

실제로 세 개가 동시에 떠 있었다.

```
node  35317  TCP [::1]:5175 (LISTEN)
node  42712  TCP [::1]:5174 (LISTEN)
node  68695  TCP [::1]:5173 (LISTEN)
```

### 해결

남아 있는 dev 서버를 모두 정리하고 다시 띄운다.

```bash
lsof -nP -iTCP:5173 -iTCP:5174 -iTCP:5175 -sTCP:LISTEN   # 누가 잡고 있는지
pkill -f "node_modules/.bin/vite"                        # 정리
npm run dev                                              # 5173에서 다시
```

### 교훈

**고쳤는데 화면이 그대로면, 고친 것이 그 화면에 반영되는 경로인지 먼저 확인한다.**
캐시를 의심하기 전에 확인할 것이 몇 가지 있다.

| 확인                       | 방법                             |
| -------------------------- | -------------------------------- |
| 서버가 몇 번 포트에 떴는가 | dev 서버 시작 로그의 `Local:` 줄 |
| 그 포트를 내가 보고 있는가 | 브라우저 주소창                  |
| 이전 서버가 남아 있는가    | `lsof -iTCP:5173 -sTCP:LISTEN`   |

dev 서버 로그의 `Port ... is in use` 경고를 흘려보낸 것이 실수였다.
그 한 줄만 봤으면 바로 알 수 있었다.

---

## 22. PrimeVue로 바꾸면서 걸린 UI 문제 세 가지

기능이 깨지진 않았지만 화면이 어긋났던 것들.

### 내비게이션 글자가 중간에서 줄바꿈됐다

pi 아이콘과 Badge가 붙으면서 링크 폭이 늘었고, 세 링크가 좁은 폭을 나눠 가지자
`날씨 대시보 드` 처럼 글자가 잘렸다.

```css
.nav-bar a {
  white-space: nowrap;
}
```

그런데 이번엔 단위 설정이 다음 줄로 밀렸다.
560px 안에 링크 3개와 단위 영역이 다 들어가야 해서 폭을 더 줄였다.

| 조치                                        | 절약    |
| ------------------------------------------- | ------- |
| 링크 글자 14px → 13px                       | 약 20px |
| 링크 사이 간격 14px → 10px                  | 8px     |
| 단위 라벨 `날씨단위: 섭씨(°C)` → `섭씨(°C)` | 약 45px |
| 단위 버튼 아이콘 제거                       | 약 20px |

### Toast에 지정한 글자 크기가 먹지 않았다

`assets/theme.css` 에서 `.p-toast-message-text` 를 겨냥했는데 적용되지 않았다.

원인은 **`#message` 슬롯으로 내용을 직접 그렸기 때문**이다.
슬롯을 쓰면 PrimeVue 기본 구조(`.p-toast-message-text`)가 렌더링되지 않는다.
슬롯 안에 직접 만든 요소를 겨냥해야 한다.

```css
.p-toast .toast-body {
  /* 기본 클래스가 아니라 내가 넣은 클래스 */
  font-size: 22px;
}
```

### `asChild` 로 감싼 버튼이 밑줄 링크로 보였다

```html
<!-- 버튼 모양이 나오지 않는다 -->
<button as-child>
  <RouterLink to="/">대시보드 홈으로 이동</RouterLink>
</button>
```

`asChild` 는 버튼의 클래스를 슬롯 props로 넘겨줄 뿐, 자식에 자동으로 붙여주지 않는다.
`v-slot` 으로 받아 직접 넘기지 않으면 스타일이 하나도 적용되지 않는다.

`as` prop을 쓰면 렌더 태그만 바뀌고 스타일은 그대로 유지된다.

```html
<button as="router-link" to="/" label="대시보드 홈으로 이동" />
```

---

## 23. 하늘 배경과 유리 재질을 얹으면서 걸린 것들

배경을 시간대별 하늘(낮/노을/밤)로 바꾸고 카드를 반투명 유리로 만드는 작업
(`customization.md` 20번)에서 실제로 막혔던 지점들.

### 23-1. 내가 정한 팔레트가 통째로 무시됐다

#### 증상

`glass.css` 에서 `:root { --p-surface-800: #f4f8ff }` 처럼 밤용 램프를 정의했는데
화면은 계속 Aura 기본값(어두운 회색)을 썼다. 개발자도구로 보면
내가 쓴 선언에 취소선이 그어져 있었다.

#### 원인

PrimeVue는 테마 변수를 **CSS 파일이 아니라 런타임에 `<style>` 태그로 주입**한다.
그것도 `:root` 로.

```js
// 실제로 무엇이 주입되는지 직접 확인해봤다
import Aura from '@primeuix/themes/aura'
import { Theme } from '@primeuix/styled'
Theme.setTheme({ preset: Aura, options: { prefix: 'p', cssLayer: false } })
console.log(Theme.getCommonStyleSheet().slice(0, 160))
```

```
<style data-primevue-style-id="primitive-variables">:root,:host{--p-stone-50:#fafaf9; ...
```

`:root` 대 `:root` 는 **특이도가 같다.** 같으면 나중에 들어온 쪽이 이긴다.
그런데 내 CSS는 빌드된 `<link>`, PrimeVue는 앱이 뜬 뒤 `<head>` 끝에 붙는
`<style>` 이라 **항상 PrimeVue가 나중**이다. 이길 방법이 없다.

#### 해결

선택자를 한 번 더 겹쳐 특이도를 한 단계 올렸다.

```css
/* :root(0,1,0) → :root:root(0,2,0). 순서와 무관하게 이긴다 */
:root:root,
:root[data-sky='day'] {
  --p-surface-800: #16283a;
}
```

`[data-sky]` 가 붙은 블록들은 원래부터 `(0,2,0)` 이라 그대로 두면 된다.
기본값 블록만 이 처리가 필요했다.

같은 이유로 컴포넌트 규칙도 클래스를 하나씩 더 붙였다.
(`.p-card` → `.p-card.p-component`, `.p-message-info` → `.p-message.p-message-info`)

#### 곁다리 — 토큰 참조가 보존되는지도 확인했다

램프만 갈아끼우면 PrimeVue 컴포넌트가 다 따라오는지가 이 설계의 전제였다.
Aura가 값을 미리 풀어서 내보내면 성립하지 않는다.

```
--p-form-field-background:var(--p-surface-0);
--p-content-background:var(--p-surface-0);
```

참조를 `var()` 형태로 보존한 채 내보낸다. 전제가 맞았고,
그래서 입력창·다이얼로그마다 따로 색을 지정하지 않아도 됐다.

---

### 23-2. Message에 테두리가 두 줄로 겹쳤다

#### 증상

안내 문구 왼쪽에 색 막대를 넣으려고 `border-left: 3px` 를 줬더니
바깥에 얇은 선이 하나 더 생기고, 글자 시작점이 다른 문구들과 어긋났다.

#### 원인

PrimeVue의 Message는 테두리를 `border` 가 아니라 **`outline`** 으로 그린다.

```css
/* @primeuix/styles/dist/message */
.p-message {
  outline-width: dt('message.border.width');
  outline-style: solid;
}
.p-message-info {
  outline-color: dt('message.info.border.color');
}
```

`border` 를 더하면 outline(바깥) + border(안쪽)로 선이 두 겹이 된다.
게다가 `border-left: 3px` 는 **자리를 차지해서** 안쪽 내용을 3px 밀어낸다.
`variant="simple"` 문구와 나란히 두면 글자 시작점이 어긋난다.

#### 해결

outline은 그대로 쓰고 색만 바꾸고, 왼쪽 막대는 자리를 차지하지 않는
`inset box-shadow` 로 그렸다.

```css
.p-message.p-message-info {
  outline-color: color-mix(in srgb, var(--accent-info) 35%, transparent);
  box-shadow: inset 3px 0 0 var(--accent-info);
}
```

`variant="simple"` 은 PrimeVue 자신도 `background/outline-color/box-shadow` 를
지우는 방식이라 같은 세 가지를 지워 뒤에 뒀다.

> 같은 함정이 ProgressBar에도 있었다. `border: 1px` 를 주니
> `height: 8px` 로 맞춰둔 막대가 10px이 됐다. 여기도 `inset box-shadow` 로 바꿨다.

---

### 23-3. 유리를 겹쳐 쌓았더니 회색 죽이 됐다

#### 증상

카드마다 `backdrop-filter: blur()` 를 걸었더니 하늘색이 하나도 비치지 않고
전부 탁한 회색이 됐다. 스크롤도 눈에 띄게 버벅였다.

#### 원인

`backdrop-filter` 는 **그 요소 뒤에 이미 그려진 결과**를 흐리게 만든다.
껍데기가 한 번 흐린 것을 안쪽 카드가 또 흐리게 만들면 색이 두 번 뭉개진다.
채도가 빠지고 남는 건 회색뿐이다.

성능도 같은 이유다. 뒤쪽 픽셀을 매 프레임 다시 계산하므로
카드 20장이면 스크롤할 때마다 20번 돈다.

#### 해결

층은 세 개로 나누되 **블러는 최상위 한 장에만** 건다.

| 층 | 대상 | `backdrop-filter` |
|---|---|---|
| 1 | `App.vue` `.container` | O |
| 2 | `BaseDashboardCard` | X — 반투명 + 테두리로만 구분 |
| 3 | 도시 카드 · 예보 칸 | X |

색이 살아난 데는 `saturate` 도 컸다. `blur` 만 걸면 탁해지기만 한다.

```css
backdrop-filter: blur(20px) saturate(170%);
```

`Dialog` / `Toast` 는 Teleport로 `<body>` 끝에 붙어 1층 바깥에 있으므로
자기 블러를 따로 가져야 했다. (22번의 Toast 문제와 같은 뿌리)

---

### 23-4. 하늘이 바뀔 때 그라데이션이 툭 끊겼다

#### 증상

`data-sky` 가 바뀌는 순간 배경이 부드럽게 넘어가지 않고 딱 교체됐다.
`transition: background-image` 를 걸어도 아무 일도 일어나지 않았다.

#### 원인

CSS는 **그라데이션을 보간하지 못한다.** `background-image` 는
애니메이션 가능한 속성이 아니라서 트랜지션 대상이 되지 않는다.

#### 해결

색 하나하나를 `@property` 로 등록했다.
등록된 커스텀 속성은 타입이 `<color>` 로 정해져서 보간이 된다.

```css
@property --sky-1 {
  syntax: '<color>';
  inherits: true;
  initial-value: #1f6fd0;
}
```

```css
body::before {
  background-image: linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 42%, ...);
  transition: --sky-1 900ms, --sky-2 900ms, ...;
}
```

그라데이션은 그대로 두고 **그 안에 들어가는 색만** 전환시키는 방식이다.
해·달의 위치(`--sky-orb-x/y`)도 `<percentage>` 로 등록해서
하늘이 바뀔 때 빛무리가 함께 옮겨간다.

미지원 브라우저에서는 보간 없이 즉시 바뀐다. 화면이 깨지지는 않는다.

> 별의 `opacity` 는 반짝임 애니메이션이 잡고 있어서 트랜지션이 먹지 않았다.
> 대신 그 애니메이션이 참조하는 `--sky-stars` 를 `<number>` 로 등록해
> 값 자체를 전환시켰다.

---

### 23-5. 알약 내비게이션이 "한 줄" 제약을 먹었다

#### 증상

유리 위에서는 1~2px 밑줄이 배경에 묻혀 활성 링크가 잘 안 보였다.
알약 배경으로 바꿨더니 이번엔 단위 설정이 다음 줄로 밀렸다.

#### 원인

22번에서 560px 안에 링크 3개 + 단위 설정을 밀어 넣느라
글자 크기·간격·라벨을 깎아 여유가 거의 없는 상태였다.
좌우 패딩 8px씩만 붙어도 링크 3개면 48px이 늘어난다.

#### 해결

눈으로는 한 줄에 들어가 보여서 브라우저에서 직접 재봤다.

```js
// 링크 3개 + 간격 + 단위 영역이 .nav-row 폭 안에 들어가는지
const links = [...document.querySelectorAll('.nav-bar a')]
const gap = parseFloat(getComputedStyle(document.querySelector('.nav-bar')).gap)
const linksTotal = links.reduce((s, a) => s + a.getBoundingClientRect().width, 0) + gap * 2
const unit = document.querySelector('.unit-toggler').getBoundingClientRect().width
const row = document.querySelector('.nav-row').getBoundingClientRect().width
row - linksTotal - 10 - unit // ← 남는 여유
```

**여유가 4.6px 밖에 없었다.** 지금은 한 줄이지만 즐겨찾기가 두 자리 수가 되는
순간 뱃지가 넓어져 접힌다. 실제로 `localStorage` 에 12개를 넣어 재현했다.

늘어난 만큼 다른 데서 덜어냈다.

| 조치 | 폭 |
|---|---|
| 링크 좌우 패딩 2px → 7px | +30px |
| 링크 사이 간격 10px → 6px | −8px |
| 링크 테두리를 `border` → `inset box-shadow` | −6px |

`border` 는 링크마다 좌우 1px씩 자리를 차지한다. 3개면 6px이다.
`box-shadow` 는 그리기만 하고 폭을 늘리지 않아 같은 모양을 공짜로 얻는다.

결과: **뱃지가 두 자리(`12`)일 때도 여유 14.7px, 줄바꿈 없음.**

#### 교훈

**폭이 빠듯한 레이아웃에서는 "재질만 바꾸는" 변경도 폭을 먹는다.**
배경·테두리를 추가하는 것은 색만 바꾸는 일처럼 보이지만
패딩이 따라 붙는 순간 레이아웃 문제가 된다.

그리고 **한 줄에 "들어간다"는 지금 데이터 기준일 뿐이다.**
최악의 데이터(두 자리 뱃지)로 재봐야 실제로 안전한지 알 수 있다.

---

### 23-6. 노을 아래쪽에서 본문이 안 읽혔다

#### 증상

노을 팔레트에서 화면 위쪽 카드는 멀쩡한데 **아래쪽 카드의 글자가 흐릿**했다.
"현재 기온: 33°C" 같은 본문이 배경에 녹아들었다.

#### 원인

처음 노을 그라데이션은 맨 아래(`--sky-4`)가 가장 밝은 주황(`#f5a054`)이었다.
그 위에 어두운 유리를 얹으면 유리가 배경 쪽으로 밝아진다.

층을 쌓을수록 더 밝아진다는 것이 문제였다.

```
바탕 #f5a054
 → 껍데기(어두운 보라 58%)      rgb(128, 79, 69)
 → 섹션 카드(밝은 살구 10%)      rgb(141, 94, 84)
 → 도시 카드(밝은 살구 7%)       rgb(149, 104, 93)
```

본문색 `--p-surface-600`(#e6d5ee)과의 대비를 계산하면 **3.4:1**.
WCAG AA 기준(본문 4.5:1)에 못 미친다.

#### 해결

두 가지를 같이 고쳤다.

| 조치 | 값 |
|---|---|
| 지평선 아래를 다시 어둡게 | `--sky-4` `#f5a054` → `#4a1e34` |
| 지평선 주황을 한 단계 낮춤 | `--sky-3` `#d4574a` → `#d2634a` |
| 유리를 진하게 | `--glass-shell` 알파 `0.58` → `0.66` |
| 보조 문구를 밝게 | `--p-surface-400/500` 한 단계 위로 |
| 해를 지평선 높이로 | `--sky-orb-y` `94%` → `78%` |

첫 번째가 핵심이다. **해보다 아래가 더 밝은 하늘은 실제로 없다.**
가장 밝은 곳을 지평선(76%)에 두고 그 아래를 어둡게 하니
노을처럼 보이는 동시에 대비 문제도 함께 풀렸다.

#### 교훈

**밝기가 위아래로 크게 변하는 배경에서는 반투명 요소의 대비를 한 점에서만
확인하면 안 된다.** 화면 위쪽에서 통과한 대비가 아래쪽에서는 떨어진다.

---

### 23-7. 스크롤바만 유리 위에서 회색 판으로 남았다

#### 증상

밤하늘 위에 예보 목록의 가로 스크롤바가 **밝은 회색 막대**로 그대로 떠 있었다.
페이지 세로 스크롤바도 마찬가지였다.

#### 원인

`color-scheme: dark` 를 팔레트에 넣어뒀으니 스크롤바도 따라올 줄 알았다.
확인해보니 값은 제대로 적용돼 있었다.

```js
getComputedStyle(document.documentElement).colorScheme // "dark"
```

그런데도 윈도우 Chrome에서는 밝은 회색 막대가 남았다.
`color-scheme` 이 스크롤바에 어떻게 반영되는지는 플랫폼마다 다르다.
**믿고 맡길 수 있는 값이 아니다.**

#### 해결

스크롤 영역마다 직접 지정했다. 트랙을 비우면 하늘이 그대로 비친다.

```css
scrollbar-width: thin;
scrollbar-color: var(--p-surface-400) transparent;
```

손잡이 색을 `--p-surface-400` 으로 잡은 게 요점이다.
하늘이 바뀌면 램프가 뒤집히므로 낮에는 짙은 남색, 밤에는 밝은 은색이 되어
**어느 배경에서도 보인다.**

적용한 곳은 세 군데다. 축과 두께가 달라 공통 클래스로 묶지 않았다.

| 위치 | 축 |
|---|---|
| `html` (페이지) | 세로 |
| `WeatherHomeView` 도시 목록 | 세로 |
| `ForecastList` 예보 | 가로 |

스크롤바를 아예 감추지는 않았다. 더 있다는 걸 알려야 하기 때문이다.
(`customization.md` 15-2에서 정한 것과 같은 이유)

---

### 23-8. 낮 유리가 그냥 흰 판처럼 보였다

#### 증상

노을·밤은 유리 느낌이 확실한데 **낮만 흰 카드 같았다.** 하늘이 비치지 않았다.

#### 원인

낮 배경이 밝아서 흰 유리를 진하게(`0.62`) 잡았는데,
밝은 배경 위에 밝은 반투명을 얹으면 차이가 거의 없어 그냥 불투명해 보인다.

#### 해결

낮은 글자가 어두워서 대비 여유가 **12:1** 쯤 남아 있었다.
그 여유만큼 투명도를 올렸다.

| | 전 | 후 |
|---|---|---|
| 껍데기 | 0.62 | 0.55 |
| 섹션 카드 | 0.44 | 0.36 |
| 안쪽 항목 | 0.34 | 0.26 |

세 층이 겹치면 실효 불투명도는 약 0.8이라 본문 대비는 여전히 넉넉하다.
같이 손댄 것으로, 햇빛 무리(`--sky-glow`)를 `0.85` → `0.68` 로 낮췄다.
너무 밝아 화면 오른쪽이 흰색으로 날아가면서 카드 오른쪽 모서리가 묻혔다.

#### 교훈

**대비 여유는 남겨두는 게 아니라 쓰라고 있는 것이다.**
어두운 배경에서는 가독성이 투명도의 상한을 정하지만,
밝은 배경 + 어두운 글자 조합에서는 그 상한이 훨씬 높다.
팔레트마다 투명도를 따로 잡아야 하는 이유다.

---

## 24. 환율 API(ExchangeRate-API)를 붙이면서 걸린 것들

### 24-1. 국기 이모지가 "KR" 두 글자로 나왔다

#### 증상

`data/currencies.js` 에 🇰🇷 🇺🇸 🇯🇵 를 넣었는데 윈도우 Chrome에서 국기가 안 보이고
`KR` `US` `JP` 라는 회색 두 글자가 나왔다. 맥에서는 국기가 정상으로 나온다.

#### 원인

버그가 아니라 **윈도우의 의도된 동작**이다.

국기 이모지는 그 자체로 하나의 글자가 아니라, 지역 표시 문자(Regional Indicator)
두 개를 이어 붙인 것이다. 🇰🇷 는 `U+1F1F0`(K) + `U+1F1F7`(R) 이다.
폰트가 이 조합에 대응하는 글리프를 갖고 있으면 국기로 합쳐 그리고, 없으면
두 글자를 그대로 그린다.

마이크로소프트는 Segoe UI Emoji 에 국가 국기 글리프를 **일부러 넣지 않았다.**
그래서 윈도우에서는 언제나 두 글자로 떨어진다. Windows 11 에서도 마찬가지다.
웹폰트를 얹지 않는 한 CSS로는 해결할 수 없다.

#### 해결

없애는 대신 **떨어진 모습이 의도한 것처럼 보이게** 만들었다.
34×24 고정 폭 칸에 넣어 국가 표시 칸으로 읽히게 한다.

```css
.rate-flag {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--glass-border-soft);
  background: var(--glass-panel);
  font-size: 16px;
  font-weight: 600;
}
```

맥에서는 칸 안에 국기가, 윈도우에서는 칸 안에 `KR` 이 들어간다.
두 경우 다 "나라를 가리키는 칸"으로 읽히고, 폭이 고정이라 이름 열의 시작점도 흔들리지 않는다.

#### 교훈

이모지는 플랫폼마다 있고 없고가 갈린다. 특히 국기는 **없는 쪽이 다수**다.
이모지를 UI 요소로 쓸 거면 "안 나올 때 무엇이 대신 나오는지"까지 보고 배치를 정해야 한다.
(날씨 아이콘 ☀️ 🌧️ 은 기본 이모지라 모든 플랫폼에 있어서 이 문제가 없었다)

---

### 24-2. 키가 맞는데 `invalid-key` 가 돌아왔다

#### 증상

발급받은 키를 `.env.local` 에 넣었는데 계속 403이 떨어졌다.

```json
{ "result": "error", "error-type": "invalid-key" }
```

키를 다시 복사해 붙여도 같았다. 오타나 변수 이름 문제인 줄 알고 한참 봤다.

#### 원인

**이메일 인증이 안 끝난 계정**이었다.

`/latest/USD` 는 인증 전 계정에 `invalid-key` 를 준다. 문구만 보면 키가 틀린 줄 안다.
그런데 같은 키로 `/quota` 를 부르면 다른 답이 온다.

```bash
curl "https://v6.exchangerate-api.com/v6/$KEY/quota"
# {"result":"error","error-type":"inactive-account","extra-info":"Please contact support."}
```

`inactive-account` 는 문서상 "이메일 주소가 확인되지 않았다"는 뜻이다.
즉 **키 자체는 서버가 알아보고 있다.** 엔드포인트마다 같은 상태를 다른 이름으로 알려준 것뿐이다.

#### 해결

가입할 때 온 확인 메일의 링크를 눌러 인증을 끝내면 된다.

화면 쪽에서는 이 상황을 그냥 "오류"로 뭉뚱그리지 않도록 `error-type` 을 문장으로 옮겨뒀다.
이 API는 실패를 HTTP 상태 코드가 아니라 **본문의 `error-type`** 으로 알려주고,
상태 코드는 대부분 403 하나로 뭉쳐 있어서 코드만 봐서는 원인을 알 수 없다.

```js
const EXCHANGE_ERROR_TEXT = {
  'invalid-key': 'ExchangeRate-API 키가 유효하지 않습니다. .env.local 의 키를 확인해 주세요.',
  'inactive-account': 'ExchangeRate-API 계정이 아직 활성화되지 않았습니다. ...이메일 인증을 마쳐 주세요.',
  'quota-reached': '이번 달 환율 API 호출 한도를 모두 썼습니다. ...',
  'unsupported-code': '지원하지 않는 통화 코드를 요청했습니다.',
  'malformed-request': '환율 요청 형식이 올바르지 않습니다.',
}
```

```js
// error-type 은 하이픈이 들어간 키라 점 표기법(data.error-type)으로는 못 읽는다
const errorType = error.response.data?.['error-type']
```

#### 교훈

키가 안 먹을 때 `invalid-key` 를 액면 그대로 믿지 말 것.
**다른 엔드포인트를 한 번 더 찔러보면** 같은 상태를 더 정확한 이름으로 알려주는 경우가 있다.
`/quota` 처럼 계정 상태를 보는 엔드포인트가 있으면 그쪽이 진단에 더 쓸모 있다.

---

### 24-3. 원화 기준으로 요청했더니 환율이 1원씩 어긋났다

#### 증상

`latest/KRW` 로 받아 역수를 취했더니 1달러가 1385.04원으로 나왔다.
같은 시각 실제 값은 1385.74원이다. 0.7원 차이가 계속 났다.

#### 원인

이 API는 환율을 **소수점 여섯 자리**까지만 돌려준다.

```
latest/KRW  ->  "USD": 0.000722
```

여섯 자리는 절대 기준이라 값이 작을수록 유효숫자가 줄어든다.
0.000722 는 유효숫자가 세 자리뿐이다. 잘려나간 뒷자리의 폭이 그대로 오차가 된다.

| 실제 값이 이 범위면 | 역수는 |
|---|---|
| 0.0007215 | 1385.99원 |
| 0.0007225 | 1384.08원 |

원화처럼 1단위가 작은 통화는 역수를 취하는 순간 반올림 오차가 1000배 넘게 증폭된다.

#### 해결

값이 큰 쪽을 기준으로 받고 나눗셈으로 환산한다.

```js
// latest/USD -> KRW: 1385.741836 (유효숫자 10자리)
const krwPerUnit = (rates[DISPLAY_BASE_CODE] / rates[currency.code]) * currency.unit
```

호출 횟수는 그대로 한 번이다. 화면이 원화 기준이라고 해서 API도 원화 기준으로
부를 필요는 없었다.

#### 교훈

**고정 소수점으로 오는 값은 작을수록 정밀도가 낮다.**
그런 값을 역수로 뒤집으면 오차가 커진다. 나눗셈의 분모로 쓸 값은
되도록 큰 쪽을 받아오는 편이 안전하다.

---

### 24-4. "기준" 표시가 밤하늘에서 혼자 튀었다

#### 증상

기준 통화 줄에 PrimeVue `Tag`(`severity="info"`)를 붙였다.
낮에는 자연스러웠는데 `data-sky="night"` 로 바꾸니 어두운 유리 위에
밝은 파란 판 하나만 형광펜처럼 남았다. 목록에서 가장 덜 중요한 줄이
가장 눈에 띄었다.

#### 원인

23-1 에서 surface 램프는 하늘 따라 뒤집어뒀지만, Aura 의 Tag 는
surface 램프가 아니라 **고정된 blue 팔레트**(`--p-blue-*`)를 쓴다.
하늘이 바뀌어도 색이 그대로다.

About 화면의 `<code>` 가 노란 형광펜처럼 보였던 것과 같은 문제다.

#### 해결

같은 방법으로 고쳤다. Tag 를 걷어내고, 하늘 따라 밝기가 뒤집히는
`--accent-info` 를 옅게 깔아 유리 위에 얹는다.

```css
.rate-base-mark {
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent-info) 18%, transparent);
  font-size: 10px;
  font-weight: 600;
  color: var(--accent-info);
}
```

덤으로 `primevue/tag` 청크(17.9 kB)가 빌드에서 빠졌다.

#### 교훈

**PrimeVue 컴포넌트를 새로 가져다 쓸 때는 그것이 어느 토큰을 보는지 먼저 확인한다.**
surface 램프를 보는 것은 하늘을 따라오지만, 고정 팔레트(blue/green/yellow)를 보는 것은
낮에서만 맞고 밤에서 깨진다. 확인은 `data-sky="night"` 로 바꿔보는 것 한 번이면 된다.

---

## 25. 환율 버튼을 넣은 뒤 내비게이션이 다시 두 줄이 됐다

### 25-1. 즐겨찾기가 0개일 때는 안 보이던 폭

#### 증상

`customization.md` 21-6 에서 껍데기를 640px 로 넓혀 링크 3개 + 환율 버튼 + 단위 설정이
한 줄에 들어가는 것을 확인했다. 그런데 실제로 쓰다 보니 단위 설정이 다시 다음 줄로 밀렸다.

#### 원인

**즐겨찾기 Badge**다.

```html
<Badge v-if="favoriteStore.favoriteCount > 0" :value="favoriteStore.favoriteCount" />
```

`v-if` 가 걸려 있어 즐겨찾기가 0개면 아예 렌더링되지 않는다.
개발 중에는 즐겨찾기를 비워둔 상태로 확인해서 이 폭이 계산에 안 들어갔다.
하나라도 담는 순간 Badge(24px)와 간격(5px)이 링크에 붙어 약 29px 이 늘어난다.

브라우저에서 잰 값. 여유가 14.3px **모자랐다.**

| 항목 | 폭 |
|---|---|
| 내비게이션 링크 3개 (배지 없음) | 321.2px |
| 내비게이션 링크 3개 (배지 한 자리) | 350.2px |
| 내비게이션 링크 3개 (배지 두 자리) | 356.1px |
| 환율 보기 버튼 | 104.9px |
| 단위 설정 | 133.2px |
| 항목 사이 간격 10 × 2 | 20.0px |
| **필요한 줄 폭** (배지 두 자리) | **614.2px** |
| 640px 껍데기가 주는 줄 폭 | 594.0px |

#### 재현·측정 방법

눈으로 보고 폭을 고르면 또 틀린다. 콘솔에서 직접 쟀다.

```js
// nav-bar 는 flex:1 이라 늘어나 있다. content 폭을 재려면 잠깐 grow 를 끈다
const row = document.querySelector('.nav-row')
const nav = row.querySelector('.nav-bar')
nav.style.flex = '0 0 auto'
const navContent = nav.getBoundingClientRect().width
nav.style.flex = ''

// 줄바꿈 여부는 자식들의 top 이 같은지로 판정한다
const tops = [...row.children].map((el) => Math.round(el.getBoundingClientRect().top))
new Set(tops).size === 1 // true 면 한 줄
```

최악 케이스는 즐겨찾기 20곳(배지 `20`, 두 자리)이다. 그 상태로 폭을 바꿔가며 쟀다.

| 껍데기 폭 | 줄 폭 | 한 줄? |
|---|---|---|
| 640px | 594.0px | ✗ |
| 660px | 614.0px | ✗ (0.2px 차이) |
| 680px | 634.0px | ✓ (여유 19.8px) |
| **700px** | **654.0px** | **✓ (여유 39.8px)** |

#### 해결

700px 로 넓혔다. 680px 도 들어가지만 여유가 19.8px뿐이다.
560px 시절에 4.6px 여유로 한 번, 640px 시절에 -14.3px 로 또 한 번 깨졌다.
글꼴 렌더링이 조금만 달라져도 다시 넘어가는 폭은 고른 게 아니라 운에 맡긴 것이다.

#### 교훈

**조건부로 렌더링되는 요소(`v-if`)는 "보이는 상태"로 폭을 재야 한다.**
비어 있을 때만 보고 레이아웃을 맞추면, 데이터가 들어찬 실사용에서 깨진다.
배지·카운터·뱃지 숫자처럼 **자릿수가 늘 수 있는 것은 최대 자릿수로** 확인한다.

한 줄에 뭔가를 더 넣을 때는 남은 여유부터 재고, 그 여유가 20px 미만이면
"들어간다"가 아니라 "지금은 우연히 들어간다"로 읽는 게 맞다.

---

### 25-2. 낮 길이가 1분 어긋나 보였다 (버그 아님)

#### 증상

상세 화면에 일출 `05:53`, 일몰 `19:17`, 낮 길이 `13시간 23분` 이 떴다.
표시된 두 시각을 빼면 13시간 **24**분이라 계산이 틀린 것처럼 보인다.

#### 원인

**표시는 초를 버리고, 계산은 초까지 쓴다.** 둘 다 맞다.

API 원본을 확인했다.

```
sunrise 05:53:34   -> 표시 05:53 (초 버림)
sunset  19:17:03   -> 표시 19:17 (초 버림)
실제 차이 13시간 23분 29초 -> 반올림 13시간 23분
```

`formatLocalTime` 은 `getUTCMinutes()` 로 분까지만 찍고, `formatDuration` 은
`Math.round((to - from) / 60)` 으로 초를 포함해 계산한다.
표시값끼리 빼면 최대 1분까지 어긋날 수 있다.

#### 결론

고치지 않았다. 낮 길이를 표시값에 맞추려면 일출·일몰을 분 단위로 자른 뒤 계산해야 하는데,
그러면 실제 낮 길이가 최대 1분 부정확해진다. 보이는 숫자끼리의 산수보다
실제 값이 맞는 쪽이 낫다.

대신 `customization.md` 의 확인 항목 문구를 고쳤다.
"일몰 − 일출과 표시값이 일치" 는 이 반올림 때문에 통과하지 못하는 검증이었다.

---

## 26. 단위 설정을 숨겼더니 내비게이션이 화면마다 흔들렸다

### 증상

기온을 보여주지 않는 화면(`/exchange` · `/about` · 404)에서 단위 설정을 `v-if` 로 감췄다.
의도한 대로 사라지긴 했는데, 화면을 옮길 때마다 **남은 항목들이 옆으로 미끄러졌다.**

측정값 (`getBoundingClientRect().left`).

| | `/` (단위 설정 있음) | `/exchange` (없음) | 차이 |
|---|---|---|---|
| 첫 번째 링크 | 650.9px | 722.5px | **+71.6px** |
| 환율 보기 버튼 | 1033.9px | 1177.1px | **+143.2px** |

### 원인

두 가지가 겹쳤다.

**1) `.nav-bar { flex: 1; justify-content: center }`**

`flex: 1` 이라 이 영역은 줄에 남는 폭을 전부 흡수한다. 단위 설정(133.2px + 간격 10px)이
빠지면 흡수하는 폭이 그만큼 늘고, 안쪽 내용이 **가운데 정렬**이라 늘어난 폭의 절반인
71.6px 만큼 링크 세 개가 통째로 오른쪽으로 밀린다.

**2) 사라지는 항목이 줄의 맨 끝에 있었다**

`[링크들][환율 버튼][단위 설정]` 순서였다. 오른쪽 끝을 잡고 있던 단위 설정이 없어지면
그 자리를 환율 버튼이 물려받아 143.2px 옆으로 이동한다.

### 해결

레이아웃이 **사라지는 항목의 앞뒤를 붙잡고 있게** 만들었다.

```css
.nav-bar {
  /* 가운데 정렬이면 흡수 폭이 바뀔 때 안쪽 내용이 따라 움직인다 */
  justify-content: flex-start;
  flex: 1;
}
```

```html
<!-- 사라지는 것을 가운데로, 항상 있는 것을 양 끝으로 -->
<nav class="nav-bar">…</nav>
<UnitToggler v-if="showsTemperature" />
<Button ... class="exchange-link" />
```

- 링크는 왼쪽에 고정되어 흡수 폭과 무관해진다.
- 환율 버튼은 모든 화면에 있는 유일한 오른쪽 항목이라 오른쪽 끝을 계속 잡는다.
- 사라지는 단위 설정은 가운데에 있어, 접힐 때 앞뒤가 모두 제자리에 남는다.

여섯 경로에서 다시 쟀다. **전부 같은 값이다.**

| 경로 | 단위 설정 | 첫 링크 | 환율 버튼 |
|---|---|---|---|
| `/` | 1033.9px | 628px | 1177.1px |
| `/weather/city_01` | 1033.9px | 628px | 1177.1px |
| `/favorites` | 1033.9px | 628px | 1177.1px |
| `/about` | 없음 | 628px | 1177.1px |
| `/exchange` | 없음 | 628px | 1177.1px |
| 404 | 없음 | 628px | 1177.1px |

### 교훈

**요소를 조건부로 없앨 때는 "없어진 자리를 누가 메우는가"를 먼저 정한다.**

`v-if` 는 요소를 지우는 것으로 끝나지 않는다. 그 폭을 이웃이 나눠 갖고,
`flex-grow` 나 `justify-content` 가 그 배분 방식을 정한다.
지워도 흔들리지 않게 하려면 사라지는 것을 **양 끝이 아니라 가운데**에 두고,
양 끝은 항상 존재하는 것으로 고정하면 된다.

`visibility: hidden` 으로 자리를 비워두는 방법도 있지만, 그러면 133px 짜리 빈 구멍이
계속 남는다. 순서를 바꾸는 편이 낭비 없이 같은 결과를 낸다.

---

## 27. 빌드는 성공했는데 새로고침하면 404 가 난다

`npm run build` 가 깨끗하게 끝났다고 배포 준비가 된 게 아니었다.
올리기 전에 `dist/` 를 정적 서버에 물려봤더니 첫 화면 말고는 전부 죽었다.

### 27-1. 증상

`dist/` 를 그냥 정적 파일로 서빙하는 최소 서버를 하나 띄우고
경로마다 상태 코드를 찍어봤다.

| 요청 | 응답 |
|---|---|
| `/` | 200 |
| `/assets/index-*.js` | 200 |
| `/favicon.ico` | 200 |
| `/about` | **404** |
| `/exchange` | **404** |
| `/weather/city_01` | **404** |
| `/favorites` | **404** |

개발 서버에서는 멀쩡하던 것들이다.
링크를 눌러서 들어가면 되는데, **그 상태에서 새로고침하면 죽는다.**
주소를 복사해서 붙여넣어도 죽는다.

### 27-2. 왜 개발 중에는 안 보였나

라우터를 히스토리 모드로 쓰고 있기 때문이다.

```js
history: createWebHistory(import.meta.env.BASE_URL),
```

이 모드에서 `/exchange` 는 **서버에 있는 파일 이름이 아니다.**
브라우저 주소창에만 존재하는 값이고, 화면을 고르는 건 JS 가 한 일이다.

- 링크 클릭: 요청이 안 나간다. 이미 떠 있는 JS 가 주소만 바꾸고 화면을 갈아끼운다. → 잘 된다
- 새로고침 / 직접 입력: 브라우저가 서버에 `GET /exchange` 를 **진짜로 보낸다**

서버 입장에서 `dist/exchange` 라는 파일은 없다. 그래서 404.

`vite dev` 와 `vite preview` 는 이 폴백을 **기본으로 넣어준다.**
그래서 개발 내내 한 번도 안 걸렸고, `npm run preview` 로만 확인했으면
배포하고 나서야 알았을 문제다.
확인은 폴백이 없는 맨 정적 서버로 해야 진짜 확인이다.

### 27-3. 고치는 자리는 코드가 아니라 서버 설정이다

"없는 경로는 `index.html` 을 돌려줘라" 한 줄이면 된다.
그러면 JS 가 뜨고, 라우터가 주소를 보고 알아서 화면을 고른다.
같은 서버에 폴백만 켜서 다시 재보면 전부 200 이 된다.

| 요청 | 폴백 없음 | 폴백 있음 |
|---|---|---|
| `/exchange` | 404 | 200 |
| `/weather/city_01` | 404 | 200 |
| `/no-such-page/deep` | 404 | 200 → 앱의 NotFoundView 가 뜬다 |

맨 마지막 줄이 헷갈릴 수 있다.
폴백을 켜면 **서버는 모든 주소에 200 을 준다.** 없는 주소도 마찬가지다.
"없는 페이지"라는 판단은 이제 서버가 아니라 앱이 한다(Catch-all 라우트).
사람 눈에는 똑같이 "페이지를 찾을 수 없습니다" 가 보이지만,
검색엔진과 모니터링 도구는 200 으로 읽는다. SPA 라면 원래 그렇다.

서버별로 넣을 설정은 이렇게 다르다.

```nginx
# nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

```apache
# Apache - .htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

```
# Netlify - public/_redirects
/*  /index.html  200
```

```json
// Vercel - vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

GitHub Pages 는 설정 파일을 못 넣는다.
대신 없는 주소에 `404.html` 을 주는 성질을 이용해
`dist/index.html` 을 `dist/404.html` 로 복사해두는 방법을 쓴다.

### 27-4. 배울 것

빌드 성공은 "문법이 맞다"까지고, 배포 성공은 "서버가 이 구조를 안다"까지다.
그 사이에 서버 설정이 하나 끼어 있는데,
개발 서버가 그걸 대신 해주고 있어서 있는 줄도 몰랐다.

**개발 서버가 조용히 해주던 일**은 배포하면 내가 해야 한다.
확인할 때는 편의 기능이 없는 환경에서 해봐야 그게 드러난다.

### 27-5. 실제로 적용한 것 (Vercel)

배포처가 Vercel 로 정해져서 27-3 의 목록 중 `vercel.json` 을 넣었다.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Vercel 이 Vite 프로젝트를 자동 인식해도 이건 안 붙여준다.**
Vercel 의 Vite 프레임워크 문서가 이 설정을 직접 요구한다.

> Add this configuration to the project root to ensure all routes are
> served by index.html

빌드 명령과 출력 폴더(`dist`)는 자동으로 잡아주기 때문에
"프레임워크를 알아서 인식했으니 라우팅도 됐겠지" 라고 넘어가기 쉽다.
그 착각이 정확히 27-1 의 증상으로 돌아온다.

`/(.*)` 가 모든 주소를 먹는 것처럼 보이지만 자산은 안전하다.
rewrites 는 **파일시스템에서 찾지 못했을 때만** 적용되므로
`/assets/index-XXXXXXXX.js` 는 그대로 서빙된다.
(자산까지 가로챘다면 Vercel 이 SPA 표준 설정으로 권장할 리가 없다)

---

## 28. 품질 도구를 붙이면서 걸린 것들

### 28-1. `npm run lint` 는 점검이 아니라 수리다

```json
"lint:oxlint": "oxlint . --fix",
"lint:eslint": "eslint . --fix --cache",
```

둘 다 `--fix` 가 붙어 있다.
"lint 가 통과했다"가 "고칠 게 없었다"가 아니라
**"고칠 수 있는 건 이미 고쳐놨다"** 일 수 있다.
소스가 조용히 바뀐 뒤라 diff 를 보기 전까지는 눈치채기 어렵다.

제출 전 점검은 `--fix` 없이 따로 돌린다.

```bash
npx eslint . --max-warnings=0
```

`--max-warnings=0` 까지 붙여야 경고도 실패로 잡힌다.

### 28-2. `--fix` 가 붙어 있는데 eqeqeq 는 안 고쳐졌다

규칙 확인용으로 `if (userAge == 20)` 을 넣고 `npm run lint` 를 돌렸더니
에러는 나는데 코드는 그대로였다.

```
> eslint . --fix --cache
  37:13  error  Expected '===' and instead saw '=='  eqeqeq
ERROR: "lint:eslint" exited with 1.
```

```js
// 실행 후에도 그대로
if (userAge == 20) {
```

`eqeqeq` 는 fixable 로 표시돼 있지만, ESLint 는 **의미가 안 바뀐다고 확신할 때만** 고친다.
`userAge` 가 어떤 타입인지 ESLint 는 모른다(변수 간 타입 추론을 하지 않는다).
`==` 를 `===` 로 바꾸면 결과가 달라질 수 있으니 손대지 않고 사람에게 넘긴다.

**교훈:** 자동 수정은 안전한 것만 한다.
"lint 를 돌렸으니 다 고쳐졌겠지"는 성립하지 않는다. 종료 코드를 봐야 한다.

### 28-3. 커스텀 규칙을 넣었는데 안 잡힐 수 있는 자리

flat config 는 배열이고 **뒤가 앞을 덮는다.**
`eslint.config.js` 중간에 이 줄이 있다.

```js
...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
```

oxlint 가 이미 보는 규칙을 ESLint 쪽에서 꺼서 중복 보고를 막는 역할이다.
커스텀 규칙을 이 줄 **앞에** 두면 조용히 덮여서 무효가 될 수 있다.

지금은 어떤지 직접 확인했다.

```js
const blocks = pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json')
// eqeqeq / no-console 을 끄는 항목: 없음
```

현재 `.oxlintrc.json` 은 `correctness` 만 켜고,
`eqeqeq`(pedantic)·`no-console`(restriction) 은 그 밖이라 안 꺼진다.
**즉 지금은 순서를 안 지켜도 동작한다.** 처음에 설정 파일 주석에
"순서 때문에 꺼진다"라고 단정해 적었다가, 확인해보니 사실이 아니라 고쳤다.

그래도 블록은 맨 뒤에 뒀다.
`.oxlintrc.json` 에 카테고리를 하나 켜는 순간 조건이 바뀌는데,
그때 증상이 "에러가 안 난다"라서 **아무도 문제라고 인식하지 못한다.**
규칙이 사라진 건 화면에 아무것도 안 뜨는 것과 구분이 안 간다.

### 28-4. Prettier 가 백틱을 안 바꾼다

```js
const     myRegion    = `Suwon` ;   // 전
const myRegion = `Suwon`            // 후
```

공백과 세미콜론은 정리됐는데 백틱은 그대로다.
`.prettierrc.json` 에 `"singleQuote": true` 가 있는데도 안 바뀐다.

`singleQuote` 는 **문자열 리터럴** 옵션이고 템플릿 리터럴은 대상이 아니다.
Prettier 는 백틱을 따옴표로 바꾸지 않는다 — 줄바꿈을 품을 수 있고,
태그드 템플릿이면 의미가 완전히 달라지기 때문이다.

**교훈:** 포매터는 **의미가 100% 같을 때만** 손댄다.
"코드 스타일은 Prettier 가 다 잡아주겠지"는 절반만 맞다.
치환 없는 백틱, `==`, 죽은 변수 — 이런 건 포매터가 아니라 린터 몫이고,
린터도 안전할 때만 고친다. 결국 남는 건 사람이 본다.

### 28-5. `.gitignore` 의 `.env.*` 가 새로 만든 파일까지 먹었다

`.env.staging` / `.env.production` 을 만들었는데 `git status` 에 안 떴다.

```
.env
.env.*          <- 여기에 걸린다
!.env.example
```

`.env.*` 는 이름이 `.env.` 로 시작하는 걸 전부 무시한다.
비밀값이 있든 없든 상관하지 않는다.

예외를 두 줄 추가해서 풀었다.

```
!.env.staging
!.env.production
```

판단 기준은 파일 이름이 아니라 **비밀값이 들어 있는가**다.

| 파일 | 커밋 | 이유 |
|---|---|---|
| `.env.local` | 안 함 | 실제 API Key |
| `.env.staging` / `.env.production` | 함 | URL 뿐. 팀이 같은 값으로 빌드해야 한다 |
| `.env.*.local` | 안 함 | 모드별 비밀값 자리 (`*.local` 규칙에도 걸린다) |

모드별 설정을 안 올리면 다른 사람이 받아서 빌드했을 때 값이 비고,
"내 컴퓨터에서는 되는데"가 시작된다.

확인은 `git status` 보다 이쪽이 확실하다.

```bash
git check-ignore -v .env.staging     # 아무것도 안 나오면 추적 대상
```

### 28-6. 안 건드린 파일의 청크 해시가 같이 바뀌었다

`App.vue` 에 `console.log` 한 줄만 넣고 다시 빌드했더니
손대지도 않은 `WeatherCard` 청크의 파일명이 바뀌었다.

```
WeatherCard-BLfyFUfW.js   ->  WeatherCard-fFP9adVD.js    (크기는 1604 bytes 로 동일)
```

크기가 같은데 이름이 다르다는 게 이상해서, 먼저 소스가 바뀐 건 아닌지 봤다.

```bash
find src -newermt "2026-08-22 19:55" -type f
#   src/App.vue      <- 이것 하나뿐
```

`--fix` 가 다른 파일을 건드린 게 아니었다. 청크 안을 열어보니 답이 있었다.

```bash
grep -o 'from"\./index-[A-Za-z0-9_-]*\.js"' dist/assets/WeatherCard-*.js
#   from"./index-DsiS8293.js"
```

**청크는 다른 청크의 파일명을 문자열로 품고 있다.**
`App.vue` 가 바뀌어 `index` 청크의 해시가 바뀌면,
그 이름을 적어둔 청크들도 내용이 달라져서 해시가 연쇄로 바뀐다.
`index` 를 직접 참조하지 않는 `ExchangeRateView` 는 그대로였다(`wI7j247B` 유지).

빌드 자체가 비결정적인 건 아니다. 같은 소스로 두 번 돌리면 이름이 완전히 같다.

```
1회차 파일명 집합 해시: 823f8435ecca
2회차 파일명 집합 해시: 823f8435ecca
```

**교훈:** "안 건드린 파일의 해시가 바뀌었다"를 곧바로 이상 징후로 보면 안 된다.
다만 그럴 때 **소스가 정말 안 바뀌었는지는 확인해야 한다.**
그 둘을 구분하지 않으면 `--fix` 가 조용히 고친 경우를 놓친다.

---

## 29. 문서의 파일 트리가 실제 구조와 어긋나 있었다

### 증상

`customization.md` 맨 뒤 "파일 단위 변경 요약" 트리를 실제 디렉터리와 대조했더니
여섯 군데가 달랐다.

| 어긋난 내용 | 실제 |
|---|---|
| `stores/toast.js` 가 `[신규]` 로 있음 | 없는 파일 (19번에서 삭제) |
| `ToastMessage.vue` 가 `[신규]` 로 있음 | 없는 파일 (19번에서 삭제) |
| `stores/counter.js` 가 트리에 없음 | 실재. Pinia 스캐폴드 기본 스토어 |
| 삭제한 파일 3개가 어디에도 없음 | `DashboardStatus.vue` · `StatusFormatDialog.vue` · `statusFormats.js` |
| `public/` 노드가 없음 | `public/favicon.ico` 실재 |
| `cities.js` 가 "도시 4곳" | 20곳 (같은 문서 다른 줄에는 20곳으로 적혀 있었다) |

### 왜 생겼나

**기능을 지울 때 본문에는 적고 트리는 안 고쳤다.**
19번 본문에는 "`stores/toast.js` 와 `ToastMessage.vue` 는 `Toast` 로 대체되어 삭제했다"가
분명히 적혀 있다. 같은 문서 안에서 앞뒤가 어긋난 셈이다.

두 가지가 성격이 다르다.

- **본문**은 시간순 기록이다. 그 시점에 뭘 왜 했는지가 남는 게 맞다.
  18번이 `toast.js` 를 현재형으로 설명하는 건 고칠 대상이 아니다.
- **트리**는 현재 상태를 보는 자리다. 여기가 틀리면 없는 파일을 찾으러 간다.

그래서 18번은 내용을 그대로 두고 맨 앞에 "지금 구조는 다르다"는 안내만 달았고,
트리는 현재 기준으로 다시 썼다.

### 같이 정리한 것

`stores/counter.js` 는 Pinia 스캐폴드가 만들어준 기본 스토어였고 쓰는 곳이 없었다.

```bash
grep -rn "counter" src/ | grep -v "^src/stores/counter.js"   # 결과 없음
```

`index.html` 의 "Vite App" 제목과 같은 성격이라 지웠다. (23-2)
지운 뒤 lint · format · build 전부 그대로 통과했다.

삭제한 파일은 트리 아래 별도 블록으로 이유까지 남겼다.
특히 "대시보드 상태" 기능은 화면뿐 아니라
`configStore` 의 state · getter · action 과 `weather-status-format` 저장 키까지
함께 걷어낸 것을 적어뒀다. **기능을 지울 때는 그 기능이 만든 저장 키까지 따라가야 한다.**

### 다시 어긋나지 않게

트리와 실제를 기계로 대조할 수 있다. 문서를 고친 뒤 한 번 돌려보면 된다.

```bash
# 트리(현재 상태) 블록만 잘라서, 적힌 파일명이 실재하는지 본다.
# "### 삭제한 파일" 앞까지만 보는 게 핵심 - 그 뒤는 일부러 없는 파일을 적는 자리다.
sed -n '/## 파일 단위 변경 요약/,/### 삭제한 파일/p' customization.md |
  grep -oE "[A-Za-z0-9_-]+[.](vue|js|css|json|html|ico)" | sort -u |
  while read f; do
    [ -n "$(find . -name "$f" -not -path "./node_modules/*" -not -path "./dist/*" -not -path "./.git/*")" ] ||
      echo "문서에만 있음: $f"
  done
```

지금 돌리면 세 줄이 나오는데 전부 정상이다. 이게 "깨끗한 상태"의 모습이다.

| 나오는 것 | 이유 |
|---|---|
| `CitySearch.vue` | `SearchBar.vue [이동/개명] CitySearch.vue 에서` 의 옛 이름 |
| `weatherMock.js` | `cities.js ... (weatherMock.js 대체)` 의 옛 이름 |
| `config.js` | `eslint.config.js` 가 정규식에 잘려서 잡힌 것 |

넷째 줄부터가 진짜 어긋난 것이다.

**교훈:** 파일을 지울 때 지워야 할 것이 하나 더 있다 — **그 파일을 가리키는 문서 줄.**
코드는 참조가 남으면 빌드가 깨져서 알려주지만, 문서는 아무 말도 하지 않는다.

---

## 30. 커밋 직전 점검에서 나온 두 가지

커밋 전에 전체를 훑었다. 막을 만한 건 없었지만 두 가지가 걸렸다.
하나는 진짜였고 하나는 착시였다.

### 30-1. `index.html` 만 Prettier 규격에서 벗어나 있었다

`npx prettier --check .` 이 4개 파일을 실패로 보고했다.

    eslint.config.js
    index.html
    package.json
    vite.config.js

이 중 `index.html` 이 진짜였다. 줄바꿈이 아니라 내용 차이다.

    -<!DOCTYPE html>            +<!doctype html>
    -<meta charset="UTF-8">     +<meta charset="UTF-8" />
    -<link rel="icon" ...>      +<link rel="icon" ... />

원인은 포맷 스크립트의 범위다.

    "format": "prettier --write --experimental-cli src/"

`src/` 만 본다. 루트에 있는 `index.html` · `vite.config.js` ·
`eslint.config.js` · `package.json` 은 `npm run format` 을 몇 번 돌리든
대상이 된 적이 없다. 23-2 에서 `lang` 과 `<title>` 을 고치느라 이 파일을
직접 건드렸는데, 그때도 포맷에는 손이 닿지 않았다.

`npx prettier --write index.html` 로 정리하고 커밋했다.

스크립트 범위는 그대로 뒀다. `src/` 밖 파일은 거의 안 바뀌고, 범위를
넓히면 `dist/` 같은 생성물까지 신경 써야 한다. 대신 체크리스트에 한 줄 넣었다.

`vite.config.js` 도 위반이지만 스캐폴드 때부터 그랬고 이번에 건드리지
않아 커밋 대상이 아니다. 그래서 같이 고치지 않았다.

### 30-2. 나머지 3개는 실패가 아니었다 — CRLF 착시

`eslint.config.js` 와 `package.json` 은 Prettier 출력과 비교하면
**모든 줄이** 다르게 나왔다. 내용이 통째로 바뀔 리는 없으니 줄바꿈이다.

줄바꿈만 무시하고 다시 비교하면 차이가 0줄이다.

    diff --strip-trailing-cr -u eslint.config.js <(npx prettier eslint.config.js)
    (출력 없음)

상태를 정리하면 이렇다.

| 파일               | 작업트리  | 커밋되는 blob |
| ------------------ | --------- | ------------- |
| `eslint.config.js` | CRLF 53줄 | **LF 53줄**   |
| `package.json`     | CRLF 42줄 | **LF 42줄**   |
| `.gitignore`       | CRLF 58줄 | **LF 58줄**   |
| `src/App.vue`      | LF 372줄  | LF 372줄      |

작업트리는 CRLF 인데 저장소에 들어가는 건 LF 다. `.gitattributes` 때문이다.

    * text=auto eol=lf

커밋 시점에 git 이 정규화한다. 그래서 **저장소는 깨끗하고, 로컬에서만
`prettier --check .` 이 계속 빨갛게 보인다.** 고칠 게 없는 실패다.

Windows 에서 파일을 새로 쓰는 도구가 CRLF 로 저장해서 생겼다.
`src/` 파일들은 LF 라 `npm run format` 은 조용하다.

### 30-3. "커밋되는 내용" 은 작업트리가 아니라 blob 으로 봐야 한다

30-2 의 결론은 작업트리를 봐서는 나오지 않는다. `.gitattributes` 가
중간에 끼어들기 때문에 디스크의 바이트와 저장소의 바이트가 다르다.
index 에 등록된 blob 을 직접 꺼내야 한다.

    h=$(git ls-files -s eslint.config.js | awk '{print $2}')
    git cat-file blob "$h" | perl -e 'local $/; my $d=<>;
      my $crlf = () = $d =~ /\r\n/g;
      my $lf   = () = $d =~ /(?<!\r)\n/g;
      print "CRLF=$crlf LF=$lf\n"'

`git show :파일` 도 비슷해 보이지만 변환이 끼는 경우가 있어
`ls-files -s` 로 해시를 얻어 `cat-file` 로 꺼내는 쪽이 확실하다.

### 30-4. 빈 패턴은 "전부 매치" 로 나타난다

여기서 한 번 헛짚었다. 처음에는 CRLF 를 이렇게 셌다.

    grep -c $'\r$' eslint.config.js

이게 **모든 파일에서 전체 줄 수를 그대로 돌려줬다.** `App.vue` 도 372/372 라
전부 CRLF 인 줄 알고 "작업트리 전체가 CRLF" 라는 잘못된 결론을 냈다.

이 셸에서 `$'\r'` 이 빈 문자열로 확장돼 패턴이 `$` 하나가 됐고,
그건 모든 줄 끝에 매치된다. `od -c` 로 실제 바이트를 보고서야
`App.vue` 는 LF 인 걸 알았다.

    head -c 60 src/App.vue | od -c
    ... <   !   -   -  \n ...        <- \r 이 없다

같은 종류의 사고를 이 프로젝트에서 두 번 겪었다. `.env.local` 의 키를
파싱할 때도 변수가 빈 문자열이 되는 바람에 `grep -F ""` 가 모든 줄에
매치돼 500KB 넘는 출력이 나왔다.

교훈은 하나다. **검사 결과가 "전부 해당" 으로 나오면 대상을 의심하기 전에
패턴이 비었는지부터 본다.** 빈 패턴은 에러를 내지 않고 조용히 전부
매치시키기 때문에, 겉보기에는 아주 그럴듯한 발견처럼 보인다.
확인은 간단하다 — 절대 매치되면 안 되는 파일에 같은 명령을 걸어본다.

## 31. id 는 살아 있는데 가리키는 것이 바뀌면 아무도 안 알려준다

`cities.js` 의 다섯 개 id 를 해외 도시로 교체하면서 (`customization.md` 27)
기록해 둘 만한 함정이 나왔다. 지금 당장 문제가 터진 건 아니고,
**터져도 조용할 종류**라 미리 적어 둔다.

### 31-1. 두 가지 참조 깨짐, 다른 대접

id 로 무언가를 찾는 코드에서 참조가 깨지는 방식은 두 가지다.

| 상황                       | `findCityById` | 화면                    | 알 수 있나 |
| -------------------------- | -------------- | ----------------------- | ---------- |
| id 가 없어졌다             | `null`         | 404 (`NotFoundView`)    | **알려준다** |
| id 는 있는데 내용이 바뀌었다 | 정상 객체      | 다른 도시가 멀쩡히 뜬다 | **모른다** |

8 번에서 없는 도시 코드를 방어해 뒀다. 그건 첫 줄만 막는다.
두 번째 줄은 방어할 대상이 아니다 — **코드 입장에서는 정상 동작이다.**

`city_02` 를 즐겨찾기해 둔 브라우저는 `weather-favorites` 에
`['city_02']` 를 들고 있다. 이 값은 여전히 유효하다.
다만 그게 이제 수원이 아니라 뉴욕일 뿐이다.

### 31-2. 왜 이런 게 조용한가

깨진 참조는 대개 어딘가에서 터진다. import 가 없으면 빌드가 실패하고,
없는 키를 읽으면 `undefined` 가 흘러가다 어디선가 예외가 난다.

**값이 바뀐 참조는 그렇지 않다.** 타입도 맞고 형식도 맞다.
틀린 것은 "이 id 가 무엇을 뜻하기로 했는가" 라는 약속 하나뿐인데,
그 약속은 코드 어디에도 적혀 있지 않다. 사람 머릿속에만 있다.

30-4 의 빈 패턴과 같은 계열이다. 에러를 내지 않고 그럴듯한 결과를 내놓는 종류.
**검사가 통과했다는 사실이 아무것도 보장하지 않는 자리**를 알아보는 게 핵심이다.

### 31-3. 실제 서비스라면

새 도시에는 새 id 를 발급하고, 옛 id 는 둘 중 하나로 처리한다.

- 목록에서 빼되 `findCityById` 가 계속 찾을 수 있게 남겨 둔다 (링크는 살아 있음)
- 새 id 로 리다이렉트한다

과제용 앱이라 감수하고 넘어갔다. 다만 **감수한 것과 몰랐던 것은 다르므로**
`cities.js` 주석 맨 위에도 같은 내용을 적어 뒀다.

## 예방 차원으로 넣어둔 것 (문제가 발생하진 않았음)

### 내비게이션 활성 링크

`RouterLink`는 현재 경로와 맞으면 `router-link-active`를 자동으로 붙인다.
`to="/"` 링크가 하위 경로에서도 켜지는 경우를 대비해 exact 조합을 넣어뒀다.

```css
.nav-bar a[href='/'].router-link-active:not(.router-link-exact-active) {
  color: #6c757d;
  border-bottom: none;
}
```

실제로는 `/`와 `/about`이 서로 부모-자식 라우트가 아니라서
이 프로젝트에서는 문제가 발생하지 않았다. 중첩 라우트를 추가하면 필요해진다.

### 상세 화면 `displayTemp`의 null 가드

단위 변환 computed를 상세 화면에 붙일 때, 참조 대상이 `null`일 수 있다.

```js
const displayTemp = computed(() => {
  if (city.value === null) return null // 없는 도시 코드로 들어온 경우
  const rawTemp = city.value.temp
  ...
})
```

`city`는 `onMounted`에서 채워지고, 없는 도시 코드로 들어오면 `null`로 남는다.
computed는 **lazy**라서 템플릿의 `v-if="city"` 블록 안에서만 읽히는 한
실제로 평가되지 않아 에러가 나지 않는다.

그래도 가드를 넣은 이유는, 나중에 누군가 `{{ displayTemp }}`를
`v-if` 바깥(예: 카드 제목)으로 옮기는 순간 조용히 터지기 때문이다.
평가 시점이 템플릿 구조에 의존하는 코드는 그 구조가 바뀌면 무너진다.

`/weather/city_99`로 확인했을 때 콘솔 에러는 없었다.

---

## 검증 체크리스트

작업 후 매번 돌린 순서.

```bash
npx eslint . --max-warnings=0   # 문법/스타일 (--fix 없이 점검만)
npx vite build                  # 컴파일 + 청크 분리 확인
npm run dev                     # 실제 브라우저 확인
```

제출 전에는 여기에 배포 확인이 하나 더 붙는다.
`npm run preview` 는 SPA 폴백을 내장하고 있어서 27번 문제를 가려버린다.
폴백이 **없는** 정적 서버로 한 번 받아봐야 서버 설정이 필요한지 드러난다.

브라우저에서 확인한 경로.

| 경로                  | 확인 내용                                                             |
| --------------------- | --------------------------------------------------------------------- |
| `/`                   | 카드 4개, 검색 필터링, `?q=` 동기화                                   |
| `/weather/city_01`    | 상세보기 클릭으로 진입(`router.push`), 관측 항목, 미세먼지 게이지     |
| `/weather/city_04`    | PM10 158 → "매우 나쁨" 등급/색상                                      |
| 태양 그리드           | 4개 항목이 2×2로 채워지고 빈 칸이 없는지 (city_01 / city_04)          |
| `/weather/city_99`    | 없는 코드 안내 문구                                                   |
| `/favorites`          | 새로고침 후에도 유지(localStorage), nav 뱃지                          |
| `/about`              | 정적 안내, 홈 이동 링크                                               |
| `/no-such-page/deep`  | Catch-all 404                                                         |
| 단위 변경             | 상단 "단위변경" → 목록/상세 기온 °C ↔ °F, 새로고침 후에도 유지        |
| 실제 API 호출         | Network 탭에 `api.openweathermap.org` 40건(도시 20 × 2 API) 200       |
| 도시 검색             | `/?q=주` → 광주·청주·전주·제주 (한글 타이핑 대신 쿼리로)              |
| 라이선스 배너 없음    | 화면 어디에도 "Invalid PrimeUI License" 가 없는지                     |
| dev 서버 포트         | 시작 로그의 `Local:` 이 5173인지 (다른 포트면 옛 서버를 보고 있는 것) |
| 내비게이션 한 줄      | 링크 3개 + 단위 설정이 줄바꿈 없이 한 줄에 들어가는지                 |
| 토스트                | 두 번 눌러도 하나만, 큰 글씨로, 우측 하단에 뜨는지                    |
| 중복 호출 없음        | 홈 진입 시 Network 요청이 40건을 넘지 않는지                          |
| 지평선 아래 분기      | 일몰 이후 도시에서 고도 음수 + 안내 문구가 뜨는지                     |
| 예보 섹션             | `/weather/city_01` — 3시간 간격 8칸, 가로 스크롤                      |
| 시각 정합성           | 낮 길이 = 일몰 − 일출, 예보 시각이 현지 기준인지                      |
| Key 미설정            | `.env.local` 을 비우고 재시작 → 안내 문구 + "다시 시도"               |
| 키 커밋 방지          | `git status` 에 `.env.local` 이 안 뜨고 `.env.example` 만 뜨는지      |
| 하늘 배경             | 카드 뒤로 하늘 그라데이션이 비치는지 (회색 단색이 아님)               |
| 하늘 3종              | Elements에서 `<html data-sky>` 를 day/sunset/night 로 바꿔 각각 확인  |
| 밤 가독성             | `night` 에서 본문·라벨·입력창·뱃지가 전부 읽히는지                    |
| 유리 층 구분          | 껍데기 > 섹션 카드 > 도시 카드 순으로 옅어지는 경계가 보이는지        |
| 블러 한 장            | Layers/Performance에서 blur가 껍데기에만 걸려 있는지, 스크롤이 매끄러운지 |
| 토스트 색 유지        | 어떤 하늘에서도 안내 문구가 `#c8e3d4` 인지 (일부러 유리로 안 바꿈)    |
| 등급 색 유지          | 미세먼지 막대 4색이 하늘과 무관하게 그대로인지                        |
| 내비게이션 한 줄      | 알약 배경이 붙은 뒤에도 링크 3개 + 환율 버튼 + 단위 설정이 한 줄인지 (23-5, 21-6) |
| 내비게이션 최악 폭    | **즐겨찾기 20곳**(배지 두 자리)에서도 한 줄인지 — 배지가 폭을 늘린다 (25-1) |
| 단위 설정 노출 범위   | `/` · `/weather/:id` · `/favorites` 에만 있고 `/about` · `/exchange` · 404 에는 없는지 |
| 내비게이션 흔들림 없음 | 위 여섯 경로를 오갈 때 링크·환율 버튼의 x 좌표가 그대로인지 (26) |
| `/exchange`           | 10개국 목록, 맨 위가 대한민국 KRW "기준", 엔·동은 100단위 표기        |
| 환율 호출 1회         | Network 탭에 `v6.exchangerate-api.com` 요청이 1건인지 (10개국 한 응답) |
| 빌드본 딥링크 404     | 폴백 없는 정적 서버에서 `/exchange` 직접 접속 → 404 가 재현되는지 (27) |
| 빌드본 폴백 후        | 폴백을 켜면 같은 주소가 200 + 환율 실데이터까지 그려지는지 (27-3)     |
| 빌드본 탭 제목        | 탭이 "Vite App" 이 아니라 "날씨 대시보드" 인지 (23-2)                 |
| 빌드 산출물 청결      | `dist/` 에 `.map` 파일과 vue-devtools 흔적이 없는지 (23-4)            |
| 커스텀 규칙 살아있음  | `==` 를 하나 넣었을 때 `npx eslint` 가 에러로 잡는지 (28-3)           |
| 제출 전 순수 점검     | `npx eslint . --max-warnings=0` 종료 코드 0 (`npm run lint` 는 --fix 라 점검이 아님, 28-1) |
| 임시 코드 잔여 없음   | 확인용으로 넣은 `userAge` / `myRegion` 이 소스에 안 남았는지 (24-3, 24-4) |
| 모드 전환             | `npm run build:staging` 과 `npm run build` 의 콘솔 값이 서로 다른지 (28-5) |
| 모드 파일 추적        | `git check-ignore -v .env.staging` 이 조용한지, `.env.local` 은 걸리는지 (28-5) |
| 해시 재현성           | 같은 소스로 두 번 빌드했을 때 `dist/assets/` 파일명이 동일한지 (28-6)  |
| 문서 트리 대조        | `customization.md` 트리의 파일명이 전부 실재하는지, 실재 파일이 전부 트리에 있는지 (29) |
| 환율 캐시             | `/exchange` ↔ `/` 를 오가도 재요청이 없는지 (다음 갱신 시각 전까지)   |
| 환율 실패 안내        | 키를 지우거나 인증 전 키로 → error-type 별 안내 문장이 뜨는지 (24-2)  |
| 환율 밤 가독성        | `night` 에서 금액·국가 칸·"기준" 표시가 전부 읽히는지 (24-4)          |
| 루트 파일 포맷        | `npx prettier --check .` 에서 `index.html` 이 통과하는지 (`npm run format` 은 `src/` 만 본다, 30-1) |
| CRLF 착시 구분        | `prettier --check .` 이 실패하면 `diff --strip-trailing-cr` 로 **진짜 차이인지** 먼저 가른다 (30-2) |
| 커밋될 내용 확인      | 작업트리 말고 `git ls-files -s` → `git cat-file blob` 으로 본다 (`.gitattributes` 가 변환한다, 30-3) |
| 커밋 전 키 검색       | 스테이징 파일 전수에서 `.env.local` 의 실제 값이 0건인지 (값은 찍지 말고 길이만, `customization.md` 25-1) |
| 배포본 딥링크         | 배포 주소의 `/exchange` 를 주소창에 직접 입력 → 200 인지 (`vercel.json` 없으면 404, 27-5) |
| 배포본 키 주입        | 배포본에 실데이터가 뜨는지 — "Key가 설정되지 않았습니다" 면 Vercel 환경변수 문제 (`customization.md` 26-2) |
| 옛 즐겨찾기 확인      | 교체한 5개 id 를 예전에 담아뒀다면 다른 도시가 조용히 뜬다 — 오류가 아니다 (31) |

콘솔 에러 없음까지 확인했다.

### 단위 변환 확인값

암산으로 검산할 수 있게 기록해 둔다. `(°C × 9 / 5) + 32` 후 반올림.

| 도시 | 섭씨 | 화씨 | 분류      |
| ---- | ---- | ---- | --------- |
| 서울 | 28°C | 82°F | 🔥 더움   |
| 수원 | 24°C | 75°F | ❄️ 선선함 |
| 부산 | 26°C | 79°F | ❄️ 선선함 |
| 광주 | 30°C | 86°F | 🔥 더움   |

화씨로 바꿔도 분류가 그대로인지가 핵심 확인 지점이다.
(판단은 섭씨 원본으로 하기 때문 — `customization.md` 10-4 참고)
