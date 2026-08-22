/*
  exchange.js (store)
  - ExchangeRate-API에서 받아온 환율을 앱 전체가 공유하는 Pinia 스토어.
  - 구조는 stores/weather.js 와 똑같이 맞췄다.
    같은 성격(외부 API + 캐시 + 로딩/실패 상태)의 스토어가 서로 다른 모양이면
    한쪽을 고칠 때 다른 쪽에도 같은 문제가 있는지 매번 다시 읽어봐야 한다.

  지금은 환율 화면 하나만 이 데이터를 쓰지만 스토어에 둔 이유:
  - 무료 플랜은 한 달 호출 수가 정해져 있다(1,500회). 화면이 소유하면 라우터로
    들어올 때마다 새로 부르게 되고, 값은 하루에 한 번만 바뀌므로 전부 낭비다.
  - 나중에 다른 화면(예: 상세 페이지의 현지 통화 안내)이 같은 값을 필요로 할 때
    호출 지점을 다시 옮기지 않아도 된다.
*/
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { fetchExchangeRates } from '@/api/exchange'
import { hasExchangeApiKey } from '@/api/http'

export const useExchangeStore = defineStore('exchange', () => {
  // fetchExchangeRates가 돌려준 통화 목록. 아직 안 받아왔으면 빈 배열.
  const rates = ref([])

  // 응답이 알려준 시각들 (UTC Unix 초)
  const updatedAt = ref(0)
  const nextUpdateAt = ref(0)

  const isLoading = ref(false)
  const error = ref('')

  const isLoaded = computed(() => rates.value.length > 0)

  /*
    캐시 만료 시점을 우리가 정하지 않고 응답이 알려준 값을 쓴다.

    날씨 스토어는 10분이라는 값을 직접 정했다. 관측값이 언제 바뀌는지 API가
    알려주지 않기 때문이다. 환율은 다르다. 무료 플랜은 하루 한 번 갱신되고
    응답의 time_next_update_unix 가 그 시각을 정확히 알려준다.
    그 전에 다시 불러봐야 같은 값이 돌아오므로 호출 수만 깎인다.
  */
  const isFresh = () => isLoaded.value && Date.now() < nextUpdateAt.value * 1000

  // 같은 시점에 여러 곳이 불러도 요청이 한 번만 나가도록 진행 중인 Promise를 들고 있는다.
  let pendingLoad = null

  /**
   * @param {boolean} force 캐시를 무시하고 다시 받아온다.
   *   값이 하루에 한 번만 바뀌므로 평소에 쓸 일은 없고, 실패한 뒤 "다시 시도"에 쓴다.
   */
  const load = (force = false) => {
    // 키가 없으면 요청을 보내봐야 403이다. 그 전에 안내한다.
    if (!hasExchangeApiKey) {
      error.value =
        'ExchangeRate-API Key가 설정되지 않았습니다. .env.local 에 VITE_ExchangeRate_API_KEY 를 넣고 개발 서버를 다시 시작해 주세요.'
      return Promise.resolve()
    }

    if (!force && isFresh()) return Promise.resolve()
    if (pendingLoad !== null) return pendingLoad

    isLoading.value = true
    error.value = ''

    pendingLoad = fetchExchangeRates()
      .then((result) => {
        rates.value = result.rates
        updatedAt.value = result.updatedAt
        nextUpdateAt.value = result.nextUpdateAt
      })
      .catch((caught) => {
        // http.js 인터셉터가 error-type을 이미 읽을 수 있는 문장으로 바꿔 던진다.
        error.value = caught.message
      })
      .finally(() => {
        isLoading.value = false
        pendingLoad = null
      })

    return pendingLoad
  }

  return {
    rates,
    updatedAt,
    nextUpdateAt,
    isLoading,
    error,
    isLoaded,
    load,
  }
})
