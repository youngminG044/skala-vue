<!--
  App.vue
  - 앱의 바깥 껍데기.
  - 모든 페이지가 공유하는 내비게이션 바(<RouterLink>)를 두고,
    실제 페이지는 <RouterView />가 있는 자리에 갈아 끼워진다.

  - PrimeVue 적용
      바깥 카드      -> Card
      구분선         -> Divider
      즐겨찾기 개수  -> Badge
      환율 보기      -> Button (as="router-link")
      안내 문구      -> Toast (bottom-right)
-->
<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import Badge from 'primevue/badge'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Toast from 'primevue/toast'

import UnitToggler from '@/components/exercise/UnitToggler.vue'
import { useSkyTheme } from '@/composables/useSkyTheme'
import { useFavoriteStore } from '@/stores/favorites'
import { useWeatherStore } from '@/stores/weather'

/*
  빌드 모드에 따라 어떤 .env 파일이 실렸는지 확인하는 출력.

    npm run dev             MODE=development  VITE_API_URL=undefined
                            (.env.development 을 만들지 않아서 값이 없다.
                             값이 모드 파일에서만 온다는 증거이기도 하다)
    npm run build:staging   MODE=staging      https://api-stage.skala-weather.com
    npm run build           MODE=production   https://api-prod.skala-weather.com

  eslint.config.js 에서 no-console 을 'off' 로 둬서 ESLint 에 걸리지 않는다.
*/
console.log('[env] MODE =', import.meta.env.MODE, '| VITE_API_URL =', import.meta.env.VITE_API_URL)

// 내비게이션 바에 즐겨찾기 개수를 뱃지로 띄우기 위해 스토어를 읽는다.
const favoriteStore = useFavoriteStore()
const weatherStore = useWeatherStore()

const route = useRoute()

/*
  기온 단위(°C/°F) 설정을 띄울지 여부.

  단위 설정은 기온이 화면에 있어야 의미가 있다. 환율·서비스 소개·404 에서는
  눌러도 토스트만 뜨고 화면은 그대로라, 있어도 되는 게 아니라 있으면 헷갈린다.
  ("눌렀는데 아무 일도 안 일어나는 버튼"으로 읽힌다)

  경로 이름을 여기에 배열로 적지 않고 라우터의 meta 를 읽는다.
  화면이 늘 때 이 파일을 같이 고쳐야 하는 구조를 만들지 않기 위해서다.
  판단 근거는 router/index.js 의 meta.showsTemperature 주석에 적어두었다.
*/
const showsTemperature = computed(() => route.meta.showsTemperature === true)

/*
  배경 하늘(낮/노을/밤)을 선택된 도시의 일출·일몰 시각에 맞춘다.
  <html data-sky="..."> 에 표시만 남기고 색은 전부 assets/glass.css 가 정한다.
  앱 전체가 공유하는 배경이라 화면(뷰)이 아니라 여기서 한 번만 건다.
*/
useSkyTheme()

/*
  관측 데이터는 여기서 한 번만 요청한다.

  화면별로 부르던 것을 여기로 올린 이유:
  - 관측 데이터를 쓰는 화면이 홈/상세/즐겨찾기 셋이라 같은 호출이 세 번 반복됐다.
  - 하늘 배경(useSkyTheme)도 이 데이터를 보는데, 그것은 경로와 무관하게 늘 떠 있다.
    화면이 부르는 구조로 두면 /about 처럼 요청하지 않는 경로에서 배경 판단이 멈춘다.
  - 화면이 늘어날 때마다 loadAll 호출을 잊지 않아야 하는 부담도 없어진다.

  스토어가 캐시(10분)를 확인하므로 화면을 오가도 재요청되지 않는다.
*/
onMounted(() => {
  weatherStore.loadAll()
})
</script>

<template>
  <Card class="container">
    <template #content>
      <h1>🌤️ 날씨 대시보드</h1>

      <Divider />

      <!--
        RouterLink는 a 태그로 렌더되지만 페이지를 새로 요청하지 않는다.
        현재 경로와 일치하면 router-link-active 클래스가 자동으로 붙는다.
      -->
      <div class="nav-row">
        <nav class="nav-bar">
          <RouterLink to="/">
            <i class="pi pi-cloud"></i>
            날씨 대시보드
          </RouterLink>

          <RouterLink to="/favorites">
            <i class="pi pi-star"></i>
            즐겨찾기
            <Badge
              v-if="favoriteStore.favoriteCount > 0"
              :value="favoriteStore.favoriteCount"
              severity="warn"
            />
          </RouterLink>

          <RouterLink to="/about">
            <i class="pi pi-info-circle"></i>
            서비스 소개
          </RouterLink>
        </nav>

        <!--
          내비게이션 바 옆에 단위 설정 영역 배치.
          기온을 보여주는 화면(대시보드 · 상세 · 즐겨찾기)에서만 나타난다.

          환율 버튼보다 앞에 두는 이유는 사라졌다 나타나기 때문이다.
          맨 끝에 두면 이 영역이 빠질 때 오른쪽 끝을 잡고 있던 것이 없어져
          환율 버튼이 143px 옆으로 미끄러진다. 가운데에 두면 앞뒤가 모두
          제자리에 남고 이 자리만 접힌다. (troubleshooting.md 26)
        -->
        <UnitToggler v-if="showsTemperature" />

        <!--
          환율 화면으로 가는 버튼. (과제 요구사항 3번 - 외부 API 확장)

          내비게이션의 세 항목과 달리 링크가 아니라 버튼으로 둔 이유:
          - 저 셋은 같은 날씨 대시보드 안의 페이지들이라 한 묶음으로 읽혀야 한다.
            환율은 날씨와 무관한 별도 기능이라 같은 알약 모양으로 섞이면
            "네 번째 날씨 페이지"처럼 보인다.
          - as="router-link" 라서 버튼 모양은 그대로 두고 라우터 이동만 한다.
            (asChild 슬롯 방식은 버튼 클래스를 자식에 직접 넘겨줘야 해서
             그냥 밑줄 링크로 보이는 실수를 하기 쉽다. troubleshooting.md 22)

          줄의 오른쪽 끝을 이 버튼이 잡는다. 모든 화면에 있는 유일한 오른쪽 항목이라
          여기 고정해두면 화면을 옮겨도 위치가 흔들리지 않는다.
        -->
        <Button
          as="router-link"
          to="/exchange"
          label="환율 보기"
          icon="pi pi-dollar"
          size="small"
          severity="secondary"
          outlined
          class="exchange-link"
        />
      </div>

      <Divider />

      <!-- 라우트에 매칭된 페이지 컴포넌트가 이 자리에 렌더링된다. -->
      <RouterView />
    </template>
  </Card>

  <!--
    안내 문구. 여기 한 번만 두어 어느 화면에서 띄우든 같은 자리에 하나만 뜬다.
    Toast는 Teleport로 <body> 끝에 붙기 때문에 이 컴포넌트의 scoped 스타일이
    닿지 않는다. 모양은 assets/theme.css 에서 지정한다.
  -->
  <Toast position="bottom-right">
    <!--
      기본 렌더링은 severity 아이콘 + summary + detail 구조인데,
      이 앱의 문구는 이모지를 포함한 한 줄이라 그대로 보여주는 편이 깔끔하다.
    -->
    <template #message="{ message }">
      <span class="toast-body">{{ message.summary }}</span>
    </template>
  </Toast>
</template>

<style scoped>
/*
  앱 껍데기 = 하늘 위에 떠 있는 유리판 한 장.

  이 화면에서 backdrop-filter 를 거는 곳은 여기 하나뿐이다.
  안쪽 카드들은 이미 흐려진 이 판 위에 반투명으로만 얹힌다.
  (유리 위에 유리를 겹쳐 블러를 두 번 먹이면 색이 죽어 회색으로 탁해진다)

  선택자에 .p-card 를 함께 적은 이유:
  glass.css 가 Aura 의 흰 카드 배경을 지우려고 .p-card.p-component 를 잡아둔다.
  여기가 .container 하나뿐이면 특이도가 같아 어느 CSS가 나중에 들어오느냐에
  따라 배경이 사라질 수 있다. 한 단계 올려 순서와 무관하게 만든다.
*/
.p-card.container {
  position: relative;
  /*
    560px -> 640px -> 700px 로 두 번 넓혔다.

    내비게이션 줄에 "환율 보기" 버튼이 들어가면서 한 줄에 담을 것이 하나 늘었다.
    처음에는 버튼 폭(104.9px)만 보고 640px 로 잡았는데, 즐겨찾기가 하나라도 있으면
    Badge(24px + 간격 5px)가 링크에 붙으면서 단위 설정이 다음 줄로 밀렸다.
    Badge 는 즐겨찾기가 0개일 때 렌더링되지 않아서(v-if) 개발 중에는 안 보였다.
    (troubleshooting.md 25-1)

    브라우저에서 실측한 값. 즐겨찾기 20곳(배지 "20", 두 자리)이 가장 넓다.

      내비게이션 링크 3개  356.1px   (배지 두 자리 포함)
      환율 보기 버튼       104.9px
      단위 설정            133.2px
      항목 사이 간격 10 x 2  20.0px
      ---------------------------------
      필요한 줄 폭         614.2px
      카드 좌우 여백 22 x 2  44.0px
      ---------------------------------
      필요한 껍데기 폭     658.2px

    660px 이면 0.2px 차이로 또 넘어간다. 그 정도 여유는 글꼴 렌더링이 조금만
    달라져도 다시 깨지므로(560px 시절에 4.6px 여유로 겪은 일이다.
    troubleshooting.md 23-5) 40px 가량 남도록 700px 로 잡았다.

    안쪽 카드들은 폭을 % 나 flex 로 쓰고 있어 이 값만 바꾸면 따라 늘어난다.
    도시 목록의 max-height 는 세로 기준이라 영향이 없다.
  */
  max-width: 700px;
  margin: 48px auto 64px;
  background: var(--glass-shell);
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius-lg);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  /* 자체 합성 레이어로 올려 스크롤 중 블러를 다시 계산하지 않게 한다 */
  transform: translateZ(0);
  transition:
    background var(--sky-transition),
    border-color var(--sky-transition),
    box-shadow var(--sky-transition);
}

/*
  위 모서리 광택 1px.
  실제 유리는 위쪽에서 빛을 받는다. 이 선이 없으면 그냥 반투명 사각형으로 보인다.
*/
.p-card.container::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, var(--glass-sheen), transparent);
  pointer-events: none;
}

/*
  Card는 안쪽 여백을 자기 내부 요소(.p-card-body)에 준다.
  scoped 스타일은 자식 컴포넌트의 내부까지 닿지 않으므로 :deep()으로 지정한다.
  유리판은 여백이 넉넉해야 "얇은 판" 느낌이 살아서 기존보다 조금 넓혔다.
*/
.container :deep(.p-card-body) {
  padding: 22px;
  gap: 0;
}

/* Divider 기본 상하 여백도 카드 안에서는 과하다 */
.container :deep(.p-divider-horizontal) {
  margin: 16px 0;
}

h1 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 21px;
  margin: 0;
  color: var(--p-surface-800);
  /* 유리 너머로 하늘이 비쳐 자간이 좁으면 글자가 뭉쳐 보인다 */
  letter-spacing: -0.3px;
}

/* 내비게이션과 단위 설정을 한 줄에. 폭이 좁으면 자연스럽게 줄바꿈된다. */
.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.nav-bar {
  display: flex;
  align-items: center;
  /*
    가운데 정렬이 아니라 왼쪽 고정이다.

    flex: 1 이라 이 영역은 줄에 남는 폭을 전부 흡수한다. 가운데 정렬로 두면
    단위 설정이 빠지는 화면에서 흡수하는 폭이 133px 늘고, 그 절반인 71px 만큼
    링크 세 개가 통째로 오른쪽으로 밀린다. 화면을 옮길 때마다 내비게이션이
    흔들려 보인다. (troubleshooting.md 26)

    왼쪽에 붙이면 위의 제목("🌤️ 날씨 대시보드")과 시작점도 맞는다.
  */
  justify-content: flex-start;
  flex: 1;
  /*
    알약 배경이 생기면서 링크마다 좌우 여백이 늘었다.
    링크 3개 + 환율 버튼 + 단위 설정이 한 줄로 들어가야 하므로
    (troubleshooting.md 22) 늘어난 만큼 링크 사이 간격에서 덜어낸다.
    560px 시절에는 여유가 4.6px밖에 없어 6px까지 줄였다 (troubleshooting.md 23-5).
    껍데기를 700px 로 넓힌 지금은 여유가 있지만 값은 그대로 둔다.
    간격을 다시 벌리면 링크 3개가 한 덩어리로 안 읽히고 흩어져 보인다.
  */
  gap: 6px;
}

/*
  링크를 밑줄 대신 알약 모양으로 바꿨다.
  유리판 위에서는 1~2px 밑줄이 배경 그라데이션에 묻혀 잘 안 보이는 반면,
  옅은 유리 알약은 층이 하나 더 얹히는 것이라 어디가 선택됐는지 바로 읽힌다.
*/
.nav-bar a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  /*
    테두리를 border 대신 inset box-shadow 로 그린다.
    border 는 링크마다 좌우 2px씩 자리를 차지해 3개면 6px을 먹는데,
    이 줄은 그만큼의 여유가 없다. box-shadow 는 폭을 늘리지 않는다.
  */
  border-radius: 999px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--p-surface-500);
  /* 링크 3개가 좁은 폭을 나눠 가지면 글자가 중간에서 줄바꿈된다 */
  white-space: nowrap;
  transition:
    color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.nav-bar a:hover {
  color: var(--p-surface-800);
  background: var(--glass-inset);
  box-shadow: inset 0 0 0 1px var(--glass-border-soft);
}

.nav-bar a.router-link-active {
  color: var(--p-primary-color);
  background: var(--glass-panel);
  box-shadow: inset 0 0 0 1px var(--glass-border);
}

/*
  환율 버튼.
  as="router-link" 로 a 태그가 되면서 브라우저 기본 밑줄이 따라붙는다.
  옆의 알약 링크들과 달리 버튼이라 밑줄이 있으면 재질이 어긋나 보인다.
*/
.exchange-link {
  flex: 0 0 auto;
  text-decoration: none;
  white-space: nowrap;
}

/*
  "/" 는 모든 경로의 앞부분과 일치해서 어디에 있든 활성으로 잡힌다.
  정확히 "/" 일 때만(exact-active) 표시되도록 되돌린다.
*/
.nav-bar a[href='/'].router-link-active:not(.router-link-exact-active) {
  color: var(--p-surface-500);
  background: transparent;
  box-shadow: none;
}
</style>
