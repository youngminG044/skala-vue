/*
  weather.js (store)
  - OpenWeatherMap에서 받아온 날씨 데이터를 앱 전체가 공유하는 Pinia 스토어.

  왜 각 화면에서 직접 호출하지 않고 스토어에 모았나:
  - 같은 데이터를 보는 화면이 여럿이다.
    목록(/), 상세(/weather/:id), 즐겨찾기(/favorites), 상단 상태 요약.
    화면마다 호출하면 라우터로 오갈 때마다 같은 요청이 반복된다.
  - 무료 플랜은 분당 호출 수 제한이 있다. 한 번 받아온 것은 재사용하는 편이 안전하다.
  - 로딩 중 / 실패 상태도 화면마다 따로 들고 있으면 표시가 제각각이 된다.
*/
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { fetchCityWeather, fetchForecast } from '@/api/weather'
import { hasApiKey } from '@/api/http'
import { cities, findCityById } from '@/data/cities'

// 받아온 데이터를 이 시간 동안은 다시 요청하지 않는다.
// 관측값이 그보다 자주 바뀌지도 않고, 화면을 오갈 때마다 깜빡이는 것도 막아준다.
const CACHE_DURATION = 10 * 60 * 1000 // 10분

export const useWeatherStore = defineStore('weather', () => {
  // 도시 id를 키로 하는 객체. 배열보다 조회가 단순하다.
  const weatherById = ref({})
  const forecastById = ref({})

  const isLoading = ref(false)
  const error = ref('')
  const loadedAt = ref(0)

  // 화면이 순회할 목록. cities 순서를 그대로 따라가고,
  // 아직 안 받아온 도시는 빼서 반쯤 그려지는 상태를 만들지 않는다.
  const weatherList = computed(() =>
    cities.map((city) => weatherById.value[city.id]).filter((city) => city !== undefined),
  )

  const isLoaded = computed(() => weatherList.value.length === cities.length)

  const getCity = (cityId) => weatherById.value[cityId] ?? null
  const getForecast = (cityId) => forecastById.value[cityId] ?? null

  const isFresh = () => isLoaded.value && Date.now() - loadedAt.value < CACHE_DURATION

  /*
    같은 시점에 여러 화면이 동시에 호출할 수 있다.
    (예: 상세 페이지 진입 시 뷰와 상단 상태 요약이 함께 요청)
    진행 중인 요청을 담아뒀다가 그대로 돌려주면 중복 호출이 생기지 않는다.
  */
  let pendingLoad = null

  const loadAll = (force = false) => {
    // API Key가 없으면 요청을 보내봐야 401이다. 그 전에 안내한다.
    if (!hasApiKey) {
      error.value =
        'OpenWeatherMap API Key가 설정되지 않았습니다. .env.local 에 VITE_OPENWEATHER_API_KEY 를 넣고 개발 서버를 다시 시작해 주세요.'
      return Promise.resolve()
    }

    if (!force && isFresh()) return Promise.resolve()
    if (pendingLoad !== null) return pendingLoad

    isLoading.value = true
    error.value = ''

    // 도시 4곳을 동시에 조회한다. 순서대로 기다리면 4배 느리다.
    pendingLoad = Promise.all(cities.map((city) => fetchCityWeather(city)))
      .then((results) => {
        const next = {}
        results.forEach((city) => {
          next[city.id] = city
        })
        weatherById.value = next
        loadedAt.value = Date.now()
      })
      .catch((caught) => {
        // http.js 인터셉터가 이미 읽을 수 있는 문장으로 바꿔 던진다.
        error.value = caught.message
      })
      .finally(() => {
        isLoading.value = false
        pendingLoad = null
      })

    return pendingLoad
  }

  /*
    예보는 상세 페이지에서만 쓰므로 그 화면에 들어갔을 때만 받아온다.
    목록에서 미리 4개 도시 예보까지 부르면 쓰지도 않을 요청이 늘어난다.
  */
  const loadForecast = async (cityId) => {
    if (!hasApiKey) return
    if (forecastById.value[cityId] !== undefined) return // 이미 받아둔 것은 그대로 사용

    const city = findCityById(cityId)
    if (city === null) return // 등록되지 않은 도시 코드

    try {
      const slots = await fetchForecast(city)
      // 객체 통째로 교체해야 화면이 변화를 알아챈다.
      forecastById.value = { ...forecastById.value, [cityId]: slots }
    } catch (caught) {
      // 예보는 보조 정보다. 실패해도 상세 페이지의 나머지는 계속 보여야 하므로
      // 전역 error를 덮어쓰지 않고 빈 배열로 표시해 "예보 없음" 상태로 둔다.
      forecastById.value = { ...forecastById.value, [cityId]: [] }
      console.warn('[weather] 예보를 불러오지 못했습니다:', caught.message)
    }
  }

  return {
    weatherById,
    forecastById,
    weatherList,
    isLoading,
    isLoaded,
    error,
    getCity,
    getForecast,
    loadAll,
    loadForecast,
  }
})
