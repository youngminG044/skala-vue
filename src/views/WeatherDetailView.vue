<!--
  WeatherDetailView.vue
  - "/weather/:cityId" 동적 경로에 매칭되는 지역별 상세 기상 관측 페이지.
  - 주소창의 cityId로 weather 스토어에서 해당 도시의 관측 데이터를 꺼내 표시한다.
  - 표시하는 항목과 출처
      기온/습도/풍속/일출/일몰   Current Weather API
      미세먼지 PM10 / PM2.5       Air Pollution API      (요구사항 2번 확장)
      3시간 간격 예보             5 Day / 3 Hour API      (요구사항 2번 확장)
      태양 방위각/고도            좌표와 시각으로 직접 계산 (API에 없는 값)
  - PrimeVue 적용: Button / Message / ProgressSpinner / Tag
-->
<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'

import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import DustGauge from '@/components/exercise/DustGauge.vue'
import ForecastList from '@/components/exercise/ForecastList.vue'
import { findCityById } from '@/data/cities'
import { getCompassDirection } from '@/utils/sunPosition'
import { formatDuration } from '@/utils/time'
import { useFavoriteStore } from '@/stores/favorites'
import { useConfigStore } from '@/stores/configStore'
import { useSelectedCityStore } from '@/stores/selectedCity'
import { useWeatherStore } from '@/stores/weather'
import { useNotice } from '@/composables/useNotice'

const route = useRoute()
const router = useRouter()
const favoriteStore = useFavoriteStore()
const configStore = useConfigStore()
const selectedCityStore = useSelectedCityStore()
const weatherStore = useWeatherStore()
const { notify } = useNotice()

// 주소창의 도시 코드. 이 화면에 머문 채로 다른 도시로 이동할 수도 있어 computed로 둔다.
const cityId = computed(() => route.params.cityId)

// 등록된 도시 코드인지. 관측 데이터가 도착하기 전에도 판단할 수 있어야
// "없는 코드"와 "아직 로딩 중"을 구분해 안내할 수 있다.
const isKnownCity = computed(() => findCityById(cityId.value) !== null)

// 화면에 그릴 관측 데이터. 아직 응답 전이면 null.
const city = computed(() => weatherStore.getCity(cityId.value))

// 이 도시의 예보. 아직 요청 전/응답 전이면 null.
const forecast = computed(() => weatherStore.getForecast(cityId.value))

// 화면에 표시할 기온. 목록 카드와 같은 변환을 상세 화면에도 적용한다.
const displayTemp = computed(() =>
  city.value === null ? null : configStore.convertTemp(city.value.temp),
)
const displayFeelsLike = computed(() =>
  city.value === null ? null : configStore.convertTemp(city.value.feelsLike),
)

// 일몰 - 일출. 데이터로 들고 있지 않고 받아온 값에서 파생시킨다.
const daylight = computed(() =>
  city.value === null ? '' : formatDuration(city.value.sunriseAt, city.value.sunsetAt),
)

// 방위각 숫자만으로는 방향이 안 잡혀 8방위 이름을 함께 보여준다.
const compass = computed(() => (city.value === null ? '' : getCompassDirection(city.value.azimuth)))

/*
  이 화면에서만 필요한 것을 요청한다.
  관측 데이터(loadAll)는 App.vue가 이미 요청했으므로 여기서 다시 부르지 않는다.
  예보는 상세 화면에서만 쓰는 데이터라 여기서 받아온다.
*/
const load = () => {
  if (isKnownCity.value) {
    weatherStore.loadForecast(cityId.value)
    // 상세 페이지를 보고 있는 동안에는 상단 요약도 이 도시를 가리키게 한다
    selectedCityStore.selectCity(cityId.value)
  }
}

onMounted(load)

// 같은 화면에 머문 채 /weather/city_01 -> /weather/city_03 으로 옮겨가면
// 컴포넌트는 재사용되고 onMounted는 다시 실행되지 않는다. 그래서 경로를 감시한다.
watch(cityId, load)

// 즐겨찾기를 토글하고 결과를 안내 문구로 알린다. (목록 카드와 같은 방식)
const toggleFavorite = () => {
  const added = favoriteStore.toggleFavorite(cityId.value)
  notify(added ? '⭐ 즐겨찾기에 추가되었습니다.' : '☆ 즐겨찾기에서 제외되었습니다.')
}

// 메인 대시보드로 돌아가기 (Programmatic Navigation)
const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="detail-view">
    <BaseDashboardCard title="📊 지역별 상세 기상 관측 정보">
      <!-- 목록에 없는 id로 들어온 경우. 로딩을 기다릴 필요가 없어 먼저 판단한다. -->
      <Message severity="warn" :closable="false" v-if="!isKnownCity">
        관측 정보를 찾을 수 없습니다. '{{ cityId }}' 는 등록되지 않은 도시 코드입니다.
      </Message>

      <!-- 호출 실패 -->
      <Message severity="error" :closable="false" v-else-if="weatherStore.error">
        {{ weatherStore.error }}
      </Message>

      <!-- 응답 대기 -->
      <div class="state-box" v-else-if="city === null">
        <ProgressSpinner class="state-spinner" stroke-width="4" />
        <span>실시간 관측 정보를 불러오는 중…</span>
      </div>

      <!-- 정상: 관측 항목을 흰 박스에 나열 -->
      <div class="detail-box" v-else>
        <p class="detail-region">📍 지정 지역: {{ city.fullName }}</p>
        <p class="detail-row">기상 현황: {{ city.icon }} {{ city.status }}</p>
        <p class="detail-row">실시간 기온: {{ displayTemp }}{{ configStore.unitSymbol }}</p>
        <p class="detail-row">체감 기온: {{ displayFeelsLike }}{{ configStore.unitSymbol }}</p>
        <p class="detail-row">대기 습도: {{ city.humidity }}%</p>
        <p class="detail-row">현재 풍속: {{ city.wind }}m/s</p>
      </div>

      <!-- 카드 하단 슬롯: 즐겨찾기 토글 -->
      <template #footer v-if="isKnownCity">
        <Button
          :label="favoriteStore.isFavorite(cityId) ? '즐겨찾기에서 빼기' : '즐겨찾기에 담기'"
          :icon="favoriteStore.isFavorite(cityId) ? 'pi pi-star-fill' : 'pi pi-star'"
          :severity="favoriteStore.isFavorite(cityId) ? 'warn' : 'secondary'"
          size="small"
          outlined
          @click="toggleFavorite"
        />
      </template>
    </BaseDashboardCard>

    <!-- 미세먼지 섹션: Air Pollution API (요구사항 2번 확장) -->
    <BaseDashboardCard title="🌫️ 미세먼지 관측" v-if="city">
      <div class="detail-box">
        <DustGauge type="pm10" :value="city.pm10" />
        <DustGauge type="pm25" :value="city.pm25" />
      </div>
    </BaseDashboardCard>

    <!-- 예보 섹션: 5 Day / 3 Hour Forecast API (요구사항 2번 확장) -->
    <BaseDashboardCard
      title="🕒 시간별 예보 (3시간 간격)"
      v-if="isKnownCity && !weatherStore.error"
    >
      <ForecastList :slots="forecast" />
    </BaseDashboardCard>

    <!-- 태양 섹션: 일출/일몰은 API, 방위각/고도는 좌표로 계산 -->
    <BaseDashboardCard title="☀️ 태양" v-if="city">
      <div class="detail-box">
        <dl class="sun-grid">
          <div class="sun-item">
            <dt class="sun-label">일출</dt>
            <dd class="sun-value">{{ city.sunrise }}</dd>
          </div>
          <div class="sun-item">
            <dt class="sun-label">일몰</dt>
            <dd class="sun-value">{{ city.sunset }}</dd>
          </div>
          <div class="sun-item">
            <dt class="sun-label">방위각 ({{ compass }})</dt>
            <dd class="sun-value">{{ city.azimuth }}<span class="sun-unit">°</span></dd>
          </div>
          <div class="sun-item">
            <dt class="sun-label">고도</dt>
            <dd class="sun-value">{{ city.altitude }}<span class="sun-unit">°</span></dd>
          </div>
        </dl>

        <!-- 낮 길이는 일출/일몰에서 바로 계산할 수 있어 별도 데이터를 두지 않는다 -->
        <p class="sun-daylight">
          🌤️ 낮 길이: {{ daylight }}
          <!-- 고도가 음수면 지금은 태양이 지평선 아래라는 뜻. 숫자만 보면 오해하기 쉽다. -->
          <Tag
            v-if="!city.isSunUp"
            value="현재 태양은 지평선 아래"
            severity="secondary"
            class="sun-note"
          />
        </p>
      </div>
    </BaseDashboardCard>

    <Button
      label="메인 대시보드로 돌아가기"
      icon="pi pi-arrow-left"
      class="back-btn"
      @click="goHome"
    />
  </div>
</template>

<style scoped>
.detail-box {
  background-color: var(--p-surface-0);
  border: 1px solid var(--p-surface-200);
  border-radius: var(--p-border-radius-md);
  padding: 16px;
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

.detail-region {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 500;
  color: var(--p-surface-800);
}

.detail-row {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--p-surface-600);
}

.detail-row:last-child {
  margin-bottom: 0;
}

/*
  일출/일몰/방위각/고도 4개를 2x2 그리드로.
  3열이면 마지막 '고도'만 둘째 줄에 혼자 남아 오른쪽이 비어 보이므로
  항목 수(4)의 약수인 2열을 써서 두 줄을 꽉 채운다.
*/
.sun-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 16px;
  margin: 0;
}

/* 각 칸을 옅은 박스로 감싸 그리드 경계를 눈에 보이게 한다 */
.sun-item {
  min-width: 0;
  padding: 12px 14px;
  background-color: var(--p-surface-50);
  border: 1px solid var(--p-surface-200);
  border-radius: var(--p-border-radius-md);
}

.sun-label {
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--p-surface-500);
}

.sun-value {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--p-surface-800);
  letter-spacing: -0.5px;
}

.sun-unit {
  margin-left: 1px;
  font-size: 18px;
  font-weight: 600;
}

.sun-daylight {
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--p-surface-200);
  font-size: 14px;
  color: var(--p-surface-600);
}

.sun-note {
  margin-left: 6px;
}

/* 아주 좁은 폭에서는 값이 잘리지 않도록 1열로 접는다 */
@media (max-width: 420px) {
  .sun-grid {
    grid-template-columns: 1fr;
  }
}

/* 카드 바깥에 놓이는 버튼이라 위쪽 여백만 준다 */
.back-btn {
  margin-top: 4px;
}
</style>
