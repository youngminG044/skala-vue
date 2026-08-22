/*
  useSkyTheme.js
  - 지금 화면의 배경이 "낮 / 노을 / 밤" 중 무엇인지 정하고,
    그 결과를 <html data-sky="..."> 에 적어 둔다.
  - 실제 색은 전부 assets/glass.css 가 가지고 있다. 여기서는 어느 팔레트를
    쓸지만 고르므로, 색을 바꾸고 싶으면 CSS 한 곳만 보면 된다.

  왜 CSS 만으로는 안 되나:
  - CSS 에는 시계가 없다. 지금이 밤인지 낮인지 알 방법이 없다.
    (prefers-color-scheme 은 OS 설정이지 시각이 아니다)
  - 그래서 판단만 여기서 하고, 그 뒤는 전부 CSS 에 넘긴다.

  판단 기준을 브라우저 시각이 아니라 도시 데이터로 잡은 이유:
  - weather 스토어가 이미 일출/일몰(sunriseAt / sunsetAt)과 관측 시각(observedAt)을
    UTC Unix 초로 들고 있다. 계절과 위도에 따라 달라지는 진짜 일출·일몰이다.
  - "18시면 노을" 같은 고정 규칙을 쓰면 겨울 저녁 6시에 밤하늘이 아니라
    노을이 떠 버린다.
  - 선택한 도시를 따라가므로, 시차가 있는 도시를 고르면 하늘도 그 도시 기준이 된다.
*/
import { computed, watchEffect } from 'vue'

import { useSelectedCityStore } from '@/stores/selectedCity'

// 일출·일몰 앞뒤로 이만큼은 노을로 본다. (golden hour)
const GOLDEN_HOUR_SECONDS = 60 * 60

export const useSkyTheme = () => {
  const selectedCityStore = useSelectedCityStore()

  const skyPhase = computed(() => {
    const city = selectedCityStore.selectedCity

    // 첫 응답 전에는 판단 근거가 없다. 흰 화면이 번쩍이지 않도록 낮으로 시작한다.
    if (city === null) return 'day'

    const { observedAt, sunriseAt, sunsetAt } = city

    // 일출 직전/직후와 일몰 직전/직후는 둘 다 노을이다. (아침놀 / 저녁놀)
    const nearSunrise = Math.abs(observedAt - sunriseAt) <= GOLDEN_HOUR_SECONDS
    const nearSunset = Math.abs(observedAt - sunsetAt) <= GOLDEN_HOUR_SECONDS
    if (nearSunrise || nearSunset) return 'sunset'

    return observedAt > sunriseAt && observedAt < sunsetAt ? 'day' : 'night'
  })

  /*
    <html> 에 붙이는 이유:
    하늘은 body::before 가 화면 전체에 깔고, Dialog / Toast 는 Teleport 로
    body 끝에 붙는다. 앱 컴포넌트 안쪽에 붙이면 그 둘에 색이 닿지 않는다.
  */
  watchEffect(() => {
    document.documentElement.dataset.sky = skyPhase.value
  })

  return { skyPhase }
}
