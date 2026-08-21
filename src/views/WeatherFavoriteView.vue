<!--
  WeatherFavoriteView.vue
  - "/favorites" 경로. 즐겨찾기로 담아둔 도시만 모아 보여주는 추가 화면.
  - 즐겨찾기 id 목록은 Pinia 스토어(localStorage 저장)에 있고,
    관측 데이터는 weather 스토어가 OpenWeatherMap에서 받아둔 것을 그대로 쓴다.
    (이 화면 때문에 API를 다시 부르지 않는다)
  - 미세먼지는 여기서 보여주지 않는다. 상세 페이지의 "미세먼지 관측" 카드와
    같은 값을 두 번 그리게 되므로, 도시별 상세는 상세 화면 한 곳에서만 다룬다.
  - PrimeVue 적용: 대기/빈 목록 안내 -> Message
-->
<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import Message from 'primevue/message'

import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import { useFavoriteStore } from '@/stores/favorites'
import { useWeatherStore } from '@/stores/weather'

const router = useRouter()
const favoriteStore = useFavoriteStore()
const weatherStore = useWeatherStore()

// 즐겨찾기 id에 해당하는 도시 목록.
// 즐겨찾기 배열이나 관측 데이터가 바뀌면 자동으로 다시 계산된다.
const favoriteCities = computed(() =>
  weatherStore.weatherList.filter((city) => favoriteStore.isFavorite(city.id)),
)

// 카드 클릭이든 상세보기 버튼이든 상세 페이지로 이동
const goDetail = (city) => {
  router.push('/weather/' + city.id)
}
</script>

<template>
  <div class="favorite-view">
    <BaseDashboardCard title="⭐ 즐겨찾기 도시">
      <WeatherCard
        v-for="city in favoriteCities"
        :key="city.id"
        :city="city"
        @select-card="goDetail"
        @click-detail="goDetail"
      />

      <!-- 관측 데이터가 아직 없어 즐겨찾기를 그릴 수 없는 동안 -->
      <Message
        severity="secondary"
        variant="simple"
        class="empty-message"
        v-if="weatherStore.isLoading && !weatherStore.isLoaded"
      >
        실시간 관측 정보를 불러오는 중…
      </Message>

      <!-- 아직 아무것도 담지 않았을 때 -->
      <Message
        severity="secondary"
        variant="simple"
        class="empty-message"
        v-else-if="favoriteCities.length === 0"
      >
        담아둔 도시가 없습니다. 카드의 별 버튼으로 즐겨찾기에 추가해 보세요.
      </Message>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
.empty-message {
  justify-content: center;
  padding: 18px 0;
}
</style>
