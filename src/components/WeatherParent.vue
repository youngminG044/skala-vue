<!--
  WeatherParent.vue
  - 대시보드의 부모(컨테이너) 컴포넌트.
  - 앱의 모든 반응형 데이터(상태)를 이 한 곳에서 유지하고,
    자식 컴포넌트에는 props로 내려주고 emit으로 변경 요청을 받는다.
-->
<script setup>
import { ref, computed, watchEffect } from 'vue'

import BaseDashboardCard from './BaseDashboardCard.vue' // 카드 디자인 껍데기(슬롯 제공)
import CitySearch from './CitySearch.vue' // 도시 검색 입력창
import CityList from './CityList.vue' // 지역별 날씨 목록
import SelectedInfo from './SelectedInfo.vue' // 하단 상태 바

// 실제 서비스라면 API 응답이 들어올 자리. id는 v-for의 :key로 사용.
const weatherList = ref([
  { id: 'city_01', name: '서울특별시', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원시', temp: 24, status: '비' },
  { id: 'city_03', name: '부산광역시', temp: 26, status: '구름' },
  { id: 'city_04', name: '광주광역시', temp: 30, status: '흐림' },
])

// 도시 검색 상태
// 사용자가 입력창에 친 원본 문자열
const findCity = ref('')

// 앞뒤 공백을 제거한 실제 검색어. findCity가 바뀔 때만 다시 계산.
const keyword = computed(() => findCity.value.trim())

// 검색어를 포함하는 도시만 걸러낸 목록. 검색어가 비어 있으면 빈 배열.
const filteredWeatherList = computed(() => {
  if (keyword.value === '') return []
  return weatherList.value.filter((city) => city.name.includes(keyword.value))
})

// 검색 결과가 하나라도 있는지 여부 -> CitySearch의 안내 문구 분기에 사용
const isCity = computed(() => filteredWeatherList.value.length > 0)

// 자식(CitySearch)이 update-query 이벤트로 올려보낸 검색어를 상태에 반영.
// 자식은 props를 직접 못 바꾸므로, 실제 값 변경은 소유자인 부모가 담당.
const updateQuery = (query) => {
  findCity.value = query
}

// 선택된 도시 상태
const cityStatus = ref(false) // 도시를 한 번이라도 선택했는지
const selectCity = ref('') // 선택된 도시 이름

// CityList의 select 이벤트 핸들러 — 카드를 클릭했을 때
const selectCityInfo = (city) => {
  cityStatus.value = true
  selectCity.value = city.name
}

// CityList의 detail 이벤트 핸들러 — 상세보기 버튼을 눌렀을 때
const showDetail = (city) => {
  window.alert(`${city.name}의 현재 날씨는 [${city.status}] 상태입니다.`)
}

// findCity를 참조하므로, 검색어가 바뀔 때마다 자동으로 다시 실행.
// (최초 1회도 실행, 별도의 감시 대상 지정이 필요 없음.)
watchEffect(() => {
  console.log(
    `[watchEffect 자동 호출] 현재 검색어 '${findCity.value}'에 매칭되는 API 데이터를 필터링 중...`,
  )
})
</script>

<template>
  <div class="container">
    <h1>🌤️ 날씨 대시보드</h1>
    <hr />

    <!-- BaseDashboardCard에 검색 컴포넌트를 슬롯으로 주입 -->
    <BaseDashboardCard title="🔍 도시 검색">
      <!-- 데이터는 props로 내려보내고, 변경 요청은 이벤트로 받음 -->
      <CitySearch
        :find-city="findCity"
        :keyword="keyword"
        :is-city="isCity"
        @update-query="updateQuery"
      />
    </BaseDashboardCard>

    <!-- BaseDashboardCard 재사용해 날씨 목록을 주입 -->
    <BaseDashboardCard title="🏙️ 지역 별 날씨 현황">
      <!-- CityList는 상태를 갖지 않고, 클릭 결과만 select/detail 이벤트로 올려보냄 -->
      <CityList :weather-list="weatherList" @select="selectCityInfo" @detail="showDetail" />
    </BaseDashboardCard>

    <!-- 선택 상태를 그대로 표시만 하는 하단 상태 바 (카드 바깥에 배치) -->
    <SelectedInfo :city-status="cityStatus" :select-city="selectCity" />
  </div>
</template>

<style scoped>
.container {
  max-width: 560px;
  margin: 40px auto;
  padding: 20px 22px;
  background-color: #fff;
  border: 1px solid #e6eaed;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  font-family:
    'Malgun Gothic',
    'Apple SD Gothic Neo',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  color: #2c3e50;
}

h1 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  margin: 0 0 12px;
}

hr {
  border: none;
  border-top: 1px solid #e9ecef;
  margin: 0 0 16px;
}
</style>
