/*
  selectedCity.js
  - "지금 보고 있는/고른 도시"를 앱 전체가 공유하는 Pinia 스토어.
  - 하늘 배경(useSkyTheme)이 어느 도시의 일출·일몰을 기준으로 삼을지 결정하는 데 쓴다.
    목록에서 카드를 고르면 그 도시로, 상세 페이지에 들어가면 그 도시로 바뀐다.
  - 설정이 아니라 세션 상태라 localStorage에 저장하지 않는다.
    (새로 열면 대표 도시부터 보는 편이 자연스러움)

  - 도시 id만 들고 있고, 실제 날씨 값은 weather 스토어에서 꺼내 온다.
    id는 화면 조작으로 즉시 정해지지만 날씨 값은 API 응답을 기다려야 해서
    "무엇을 골랐나"와 "그 데이터가 도착했나"를 분리해 두는 편이 다루기 쉽다.
*/
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { useWeatherStore } from './weather'

export const useSelectedCityStore = defineStore('selectedCity', () => {
  const weatherStore = useWeatherStore()

  // 아직 아무것도 고르지 않았으면 null
  const selectedCityId = ref(null)

  /*
    화면에 보여줄 도시.
      1순위: 고른 도시의 날씨 데이터
      2순위: 아직 안 골랐으면 받아온 목록의 첫 도시를 대표로
      그것도 없으면(로딩 중이거나 실패) null -> 화면이 안내 문구로 대체한다.
  */
  const selectedCity = computed(
    () => weatherStore.getCity(selectedCityId.value) ?? weatherStore.weatherList[0] ?? null,
  )

  const selectCity = (cityId) => {
    selectedCityId.value = cityId
  }

  return { selectedCityId, selectedCity, selectCity }
})
