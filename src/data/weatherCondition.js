/*
  weatherCondition.js
  - OpenWeatherMap의 날씨 상태 코드(weather[0].id)를 앱에서 쓰는 짧은 한글 단어로 바꾼다.

  왜 lang=kr 를 그대로 쓰지 않았나:
  - API의 한국어 번역은 길이와 말투가 들쭉날쭉하다.
    ("튼구름", "실 비", "온흐림", "약간의 구름이 낀 하늘")
    카드에 한 줄로 들어가야 하는데 길이가 제각각이면 레이아웃이 흔들리고,
    상단 상태 요약("맑음, 28° 55% 보통")에 넣기에도 어색하다.
  - 코드(id)는 언어와 무관한 숫자라 번역 표현이 바뀌어도 영향을 받지 않는다.

  코드 대역 (https://openweathermap.org/weather-conditions)
    2xx 뇌우 / 3xx 이슬비 / 5xx 비 / 6xx 눈 / 7xx 대기 현상 / 800 맑음 / 80x 구름
*/
export const getConditionText = (conditionId) => {
  if (conditionId >= 200 && conditionId < 300) return '뇌우'
  if (conditionId >= 300 && conditionId < 400) return '이슬비'
  if (conditionId >= 500 && conditionId < 600) return '비'
  if (conditionId >= 600 && conditionId < 700) return '눈'
  if (conditionId === 701 || conditionId === 741) return '안개'
  if (conditionId === 731 || conditionId === 751 || conditionId === 761) return '황사'
  if (conditionId >= 700 && conditionId < 800) return '연무'
  if (conditionId === 800) return '맑음'
  if (conditionId === 801 || conditionId === 802) return '구름'
  if (conditionId === 803 || conditionId === 804) return '흐림'
  return '알 수 없음' // 새 코드가 생겨도 화면이 빈칸이 되지 않도록
}

/*
  상태에 맞는 이모지.
  API가 주는 아이콘 이미지(openweathermap.org/img/wn/...)를 쓸 수도 있지만,
  이 앱은 이모지로 통일된 톤이라 외부 이미지를 끌어오지 않고 직접 매핑한다.
  isDay: 같은 '맑음'이라도 낮은 ☀️, 밤은 🌙 로 구분한다.
*/
export const getConditionIcon = (conditionId, isDay = true) => {
  if (conditionId >= 200 && conditionId < 300) return '⛈️'
  if (conditionId >= 300 && conditionId < 400) return '🌦️'
  if (conditionId >= 500 && conditionId < 600) return '🌧️'
  if (conditionId >= 600 && conditionId < 700) return '❄️'
  if (conditionId >= 700 && conditionId < 800) return '🌫️'
  if (conditionId === 800) return isDay ? '☀️' : '🌙'
  if (conditionId === 801 || conditionId === 802) return isDay ? '🌤️' : '☁️'
  if (conditionId >= 803 && conditionId < 900) return '☁️'
  return '🌡️'
}
