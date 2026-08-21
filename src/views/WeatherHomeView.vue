<!--
  WeatherHomeView.vue
  - "/" 경로의 메인 날씨 대시보드 화면.
  - 날씨 값은 OpenWeatherMap에서 받아오므로 weather 스토어가 소유하고,
    이 뷰는 검색어처럼 이 화면에서만 쓰는 상태만 직접 들고 있는다.
  - 부품 컴포넌트에는 props로 내려주고 emit으로 변경 요청을 받는다.
  - PrimeVue 적용: 로딩 -> ProgressSpinner, 실패 -> Message, 버튼 -> Button
-->
<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import SelectedInfo from '@/components/exercise/SelectedInfo.vue'
import { useSelectedCityStore } from '@/stores/selectedCity'
import { useWeatherStore } from '@/stores/weather'

// 라우터 인스턴스: 코드에서 화면을 이동시킬 때(router.push) 사용
const router = useRouter()
// 상단 대시보드 상태가 어느 도시를 보여줄지 알려주기 위한 스토어
const selectedCityStore = useSelectedCityStore()
// 실제 관측 데이터를 들고 있는 스토어
const weatherStore = useWeatherStore()
// 현재 경로 정보: 주소창의 쿼리 스트링(?q=)을 읽을 때 사용
const route = useRoute()

// 화면에 그릴 원본 목록. 스토어가 API에서 채워준다.
const weatherList = computed(() => weatherStore.weatherList)

// 최초 요청은 App.vue가 한다. (경로와 무관하게 상단 요약이 늘 떠 있으므로)
// 여기서는 사용자가 직접 최신값을 요청할 때만 캐시를 무시하고 다시 받는다.
const refresh = () => {
  weatherStore.loadAll(true)
}

// 도시 검색 상태
// 주소창에 ?q=서울 로 들어오면 그 값으로 시작하도록 초기화 (새로고침/링크 공유 대응)
const findCity = ref(typeof route.query.q === 'string' ? route.query.q : '')

// 앞뒤 공백을 제거한 실제 검색어. findCity가 바뀔 때만 다시 계산.
const keyword = computed(() => findCity.value.trim())

// 검색어를 포함하는 도시만 걸러낸 목록. 검색어가 비어 있으면 빈 배열.
const filteredWeatherList = computed(() => {
  if (keyword.value === '') return []
  return weatherList.value.filter((city) => city.name.includes(keyword.value))
})

// 검색 결과가 하나라도 있는지 여부 -> SearchBar의 안내 문구 분기에 사용
const isCity = computed(() => filteredWeatherList.value.length > 0)

// 실제로 카드로 그릴 목록. 검색 전에는 전체, 검색 중에는 걸러진 결과.
const displayList = computed(() =>
  keyword.value === '' ? weatherList.value : filteredWeatherList.value,
)

/*
  카드 제목에 개수를 붙인다.
  목록이 스크롤 영역 안에 들어가면서 한 화면에 5~6곳만 보이게 됐다.
  개수가 없으면 "이게 전부"라고 오해하고 스크롤하지 않을 수 있다.
  검색 중에는 걸러진 개수가 나오므로 결과 수를 세는 역할도 겸한다.
*/
const listTitle = computed(() => {
  // 아직 첫 응답 전이면 0곳이라 붙여봐야 오해만 준다.
  if (!weatherStore.isLoaded) return '🏙️ 지역별 날씨 현황'
  return `🏙️ 지역별 날씨 현황 (${displayList.value.length}곳)`
})

// 자식(SearchBar)이 update-query 이벤트로 올려보낸 검색어를 상태에 반영.
// 자식은 props를 직접 못 바꾸므로, 실제 값 변경은 소유자인 이 뷰가 담당.
const updateQuery = (query) => {
  findCity.value = query
}

// 검색어를 주소창 쿼리 스트링과 동기화.
// push가 아니라 replace라서 글자마다 뒤로가기 기록이 쌓이지 않는다.
watch(keyword, (value) => {
  router.replace({ query: value === '' ? {} : { q: value } })
})

// 선택된 도시 상태
const cityStatus = ref(false) // 도시를 한 번이라도 선택했는지
const selectCity = ref('') // 선택된 도시 이름

// WeatherCard의 select-card 이벤트 핸들러 — 카드를 클릭했을 때
const selectCityInfo = (city) => {
  cityStatus.value = true
  selectCity.value = city.name
  // 화면 상단 요약도 고른 도시를 따라가게 한다
  selectedCityStore.selectCity(city.id)
}

// WeatherCard의 click-detail 이벤트 핸들러 — 상세보기 버튼을 눌렀을 때
// 동적 경로로 이동시킨다. (Programmatic Navigation)
const showDetail = (city) => {
  router.push('/weather/' + city.id)
}

// findCity를 참조하므로, 검색어가 바뀔 때마다 자동으로 다시 실행.
// (최초 1회도 실행, 별도의 감시 대상 지정이 필요 없음.)
watchEffect(() => {
  console.log(
    `[watchEffect 자동 호출] 현재 검색어 '${findCity.value}'에 매칭되는 데이터를 필터링 중...`,
  )
})
</script>

<template>
  <div class="home-view">
    <!-- BaseDashboardCard에 검색 컴포넌트를 슬롯으로 주입 -->
    <BaseDashboardCard title="🔍 도시 검색">
      <!-- 데이터는 props로 내려보내고, 변경 요청은 이벤트로 받음 -->
      <SearchBar
        :find-city="findCity"
        :keyword="keyword"
        :is-city="isCity"
        @update-query="updateQuery"
      />
    </BaseDashboardCard>

    <!-- BaseDashboardCard 재사용해 날씨 목록을 주입 -->
    <!-- 목록이 스크롤 영역 안에 들어가 한눈에 다 보이지 않으므로 제목에 개수를 붙인다 -->
    <BaseDashboardCard :title="listTitle">
      <!-- 호출이 실패했을 때. 무엇이 문제인지 알려주고 다시 시도할 길을 준다. -->
      <Message severity="error" :closable="false" v-if="weatherStore.error">
        <div class="state-error">
          <span>{{ weatherStore.error }}</span>
          <Button label="다시 시도" severity="danger" size="small" @click="refresh" />
        </div>
      </Message>

      <!-- 첫 응답을 기다리는 중. 이미 받아둔 값이 있으면 그대로 두고 갱신만 한다. -->
      <div class="state-box" v-else-if="weatherStore.isLoading && !weatherStore.isLoaded">
        <ProgressSpinner class="state-spinner" stroke-width="4" />
        <span>실시간 관측 정보를 불러오는 중…</span>
      </div>

      <template v-else>
        <!--
          도시가 20곳이라 카드를 그대로 쌓으면 페이지가 지나치게 길어진다.
          목록만 자체 스크롤 영역에 넣어 카드 바깥(검색창, 하단 상태 바)은
          항상 같은 자리에 머물게 한다.

          v-for로 배열을 순회해 도시 카드를 반복 생성. :key로 각 항목을 구분.
          데이터를 가진 부모가 반복을 담당하고, 카드는 도시 객체 하나만 받아 그림.
        -->
        <div class="city-scroll" v-if="displayList.length > 0">
          <WeatherCard
            v-for="city in displayList"
            :key="city.id"
            :city="city"
            @select-card="selectCityInfo"
            @click-detail="showDetail"
          />
        </div>

        <!-- 검색 결과가 하나도 없을 때만 안내 문구 (스크롤 영역 밖) -->
        <p class="empty-message" v-else>'{{ keyword }}'와 일치하는 도시가 없습니다.</p>
      </template>

      <!-- 카드 하단: 관측 출처와 수동 갱신 -->
      <template #footer>
        <div class="footer-row">
          <span class="source-note">OpenWeatherMap 실시간 관측</span>
          <Button
            :label="weatherStore.isLoading ? '갱신 중…' : '새로고침'"
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            outlined
            :loading="weatherStore.isLoading"
            @click="refresh"
          />
        </div>
      </template>
    </BaseDashboardCard>

    <!-- 선택 상태를 그대로 표시만 하는 하단 상태 바 (카드 바깥에 배치) -->
    <SelectedInfo :city-status="cityStatus" :select-city="selectCity" />
  </div>
</template>

<style scoped>
/*
  도시 목록만 자체 스크롤. 카드 바깥은 고정된다.

  높이를 clamp로 둔 이유:
  - 고정 px면 노트북에서는 화면을 다 먹고, 큰 모니터에서는 여백이 남는다.
  - 60vh를 기준으로 하되 아래위로 한계를 둔다.
      최소 320px : 이보다 작으면 카드 3개도 안 보여 스크롤이 답답하다
      최대 560px : 이보다 크면 하단 상태 바가 화면 밖으로 밀린다
  - height가 아니라 max-height라서 검색 결과가 1~2곳이면 그만큼만 차지한다.
*/
.city-scroll {
  max-height: clamp(320px, 60vh, 560px);
  overflow-y: auto;
  /* 스크롤바가 카드에 딱 붙지 않도록 */
  padding-right: 6px;
}

/*
  macOS는 스크롤바를 평소에 숨긴다(오버레이 방식).
  그대로 두면 목록이 더 있다는 걸 모르고 지나치기 쉬워 항상 보이도록 지정한다.
  표준 속성(Firefox, 최신 Chrome)과 WebKit 확장(Safari)을 함께 둔다.
*/
.city-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--p-surface-300) var(--p-surface-100);
}

.city-scroll::-webkit-scrollbar {
  width: 8px;
}

.city-scroll::-webkit-scrollbar-track {
  border-radius: 4px;
  background-color: var(--p-surface-100);
}

.city-scroll::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: var(--p-surface-300);
}

.city-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--p-surface-400);
}

.empty-message {
  margin: 0;
  padding: 18px 0;
  text-align: center;
  font-size: 14px;
  color: var(--p-surface-500);
}

/* 로딩 표시: 스피너와 문구를 세로로 가운데 모은다 */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px;
  font-size: 14px;
  color: var(--p-surface-500);
}

.state-spinner {
  width: 34px;
  height: 34px;
}

/* 실패 안내: 문구와 재시도 버튼을 한 줄에 두되 좁으면 접힌다 */
.state-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.source-note {
  font-size: 12px;
  color: var(--p-surface-400);
}
</style>
