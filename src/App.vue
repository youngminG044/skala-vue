<!--
  App.vue
  - 앱의 바깥 껍데기.
  - 모든 페이지가 공유하는 내비게이션 바(<RouterLink>)를 두고,
    실제 페이지는 <RouterView />가 있는 자리에 갈아 끼워진다.

  - PrimeVue 적용
      바깥 카드      -> Card
      구분선         -> Divider
      즐겨찾기 개수  -> Badge
      안내 문구      -> Toast (bottom-right)
-->
<script setup>
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

import Badge from 'primevue/badge'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Toast from 'primevue/toast'

import DashboardStatus from '@/components/exercise/DashboardStatus.vue'
import UnitToggler from '@/components/exercise/UnitToggler.vue'
import { useFavoriteStore } from '@/stores/favorites'
import { useWeatherStore } from '@/stores/weather'

// 내비게이션 바에 즐겨찾기 개수를 뱃지로 띄우기 위해 스토어를 읽는다.
const favoriteStore = useFavoriteStore()
const weatherStore = useWeatherStore()

/*
  관측 데이터는 여기서 한 번만 요청한다.

  화면별로 부르던 것을 여기로 올린 이유:
  - 제목 옆 대시보드 상태(DashboardStatus)는 경로와 무관하게 늘 떠 있다.
    그런데 요청은 일부 화면(홈/상세/즐겨찾기)에서만 했기 때문에,
    /about 이나 없는 경로로 바로 들어오면 요청 자체가 시작되지 않아
    상단 요약이 "불러오는 중"에서 멈춘 채로 남았다.
  - 데이터를 쓰는 쪽(상단 요약)이 App에 있으니 확보하는 곳도 App인 편이 맞다.
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
      <div class="title-row">
        <h1>🌤️ 날씨 대시보드</h1>

        <!-- 제목 우측: 지금 고른 도시의 상태 요약 (클릭하면 표시 형식 선택) -->
        <DashboardStatus />
      </div>

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

        <!-- 내비게이션 바 옆에 단위 설정 영역 배치 -->
        <UnitToggler />
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
.container {
  max-width: 560px;
  margin: 40px auto;
}

/*
  Card는 안쪽 여백을 자기 내부 요소(.p-card-body)에 준다.
  scoped 스타일은 자식 컴포넌트의 내부까지 닿지 않으므로 :deep()으로 지정한다.
  기본값이 커서 대시보드 톤에 비해 헐거워 보인다.
*/
.container :deep(.p-card-body) {
  padding: 20px 22px;
  gap: 0;
}

/* Divider 기본 상하 여백도 카드 안에서는 과하다 */
.container :deep(.p-divider-horizontal) {
  margin: 14px 0;
}

/* 제목과 상태 요약을 한 줄에. 폭이 좁으면 상태가 아래로 내려간다. */
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
}

h1 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  margin: 0;
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
  justify-content: center;
  flex: 1;
  gap: 10px;
}

.nav-bar a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 2px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--p-surface-500);
  /* 링크 3개가 좁은 폭을 나눠 가지면 글자가 중간에서 줄바꿈된다 */
  white-space: nowrap;
}

.nav-bar a:hover {
  color: var(--p-surface-800);
}

.nav-bar a.router-link-active {
  color: var(--p-primary-color);
  border-bottom: 2px solid var(--p-primary-color);
}

/*
  "/" 는 모든 경로의 앞부분과 일치해서 어디에 있든 활성으로 잡힌다.
  정확히 "/" 일 때만(exact-active) 표시되도록 되돌린다.
*/
.nav-bar a[href='/'].router-link-active:not(.router-link-exact-active) {
  color: var(--p-surface-500);
  border-bottom: none;
}
</style>
