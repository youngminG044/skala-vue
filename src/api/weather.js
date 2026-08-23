/*
  weather.js
  - OpenWeatherMap의 각 API를 호출하고, 응답을 이 앱이 쓰는 모양으로 바꿔주는 계층.

  사용하는 API (모두 무료 플랜 범위)
    1. Current Weather Data  /data/2.5/weather        현재 기온·습도·풍속·일출·일몰
    2. Air Pollution         /data/2.5/air_pollution  PM10 / PM2.5      (요구사항 2번 확장)
    3. 5 Day / 3 Hour        /data/2.5/forecast       3시간 간격 예보    (요구사항 2번 확장)

  이 파일이 따로 있는 이유:
  - 컴포넌트가 API 응답 구조(main.temp, weather[0].id 같은 것)를 직접 알면
    API가 바뀔 때 화면 코드까지 전부 손봐야 한다.
  - 여기서 앱 내부 형태로 한 번 번역해두면, 바깥은 이 파일만 고치면 된다.
*/
import { owmClient } from './http'
import { getConditionText, getConditionIcon } from '@/data/weatherCondition'
import { getSunPosition } from '@/utils/sunPosition'
import { formatLocalTime } from '@/utils/time'

// 세 API가 공통으로 쓰는 조회 조건.
// units=metric 이여야 기온이 섭씨로 온다. (기본값은 켈빈)
const metricParams = (city) => ({ lat: city.lat, lon: city.lon, units: 'metric' })

/*
  1) 현재 날씨.
  응답에서 화면에 필요한 것만 추려낸다.
    main.temp / main.humidity / wind.speed / weather[0].id
    sys.sunrise / sys.sunset  (UTC Unix 초)
    timezone                  (도시의 UTC 오프셋, 초)
*/
export const fetchCurrentWeather = async (city) => {
  const data = await owmClient.get('/data/2.5/weather', { params: metricParams(city) })

  const conditionId = data.weather[0].id
  const timezone = data.timezone
  // 관측 시각이 일출과 일몰 사이면 낮. 맑음 아이콘을 ☀️/🌙 로 가르는 데 쓴다.
  const isDay = data.dt >= data.sys.sunrise && data.dt < data.sys.sunset

  // 방위각·고도는 API에 없는 값이라 좌표와 지금 시각으로 직접 계산한다.
  const sun = getSunPosition(city.lat, city.lon, new Date())

  return {
    // 기온은 소수점이 딸려 오므로(28.47) 표시용으로 반올림한다.
    // 화씨 변환도 이 정수를 기준으로 하므로 여기서 한 번만 정리해둔다.
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    wind: data.wind.speed,
    status: getConditionText(conditionId),
    icon: getConditionIcon(conditionId, isDay),

    // 일출/일몰은 원본(Unix 초)과 표시용 문자열을 함께 둔다.
    // 낮 길이 계산에는 숫자가, 화면에는 "05:38"이 필요하기 때문.
    sunriseAt: data.sys.sunrise,
    sunsetAt: data.sys.sunset,
    sunrise: formatLocalTime(data.sys.sunrise, timezone),
    sunset: formatLocalTime(data.sys.sunset, timezone),

    azimuth: sun.azimuth,
    altitude: sun.altitude,
    isSunUp: sun.isUp,

    timezone,
    observedAt: data.dt,
  }
}

/*
  2) 대기 오염 (요구사항 2번 확장 API)
  list[0]가 현재 시점 관측치. components 안에 오염물질별 농도(㎍/㎥)가 들어 있다.
  PM2.5의 키가 pm2_5 라는 점만 주의.
*/
export const fetchAirPollution = async (city) => {
  const data = await owmClient.get('/data/2.5/air_pollution', {
    params: { lat: city.lat, lon: city.lon },
  })

  const components = data.list[0].components
  return {
    // 소수점이 딸려 오므로(32.41) 정수로 정리. 게이지 바와 등급 판정에 그대로 쓴다.
    pm10: Math.round(components.pm10),
    pm25: Math.round(components.pm2_5),
    aqi: data.list[0].main.aqi, // 1(좋음) ~ 5(매우 나쁨). OpenWeatherMap 자체 지수
  }
}

/*
  3) 5일 / 3시간 예보 (요구사항 2번 확장 API)
  40개(5일 x 8회)가 한 번에 오는데 화면에는 그만큼 필요하지 않다.
  가까운 미래부터 원하는 개수만 잘라서 돌려준다.
*/
export const fetchForecast = async (city, limit = 8) => {
  const data = await owmClient.get('/data/2.5/forecast', { params: metricParams(city) })

  const timezone = data.city.timezone

  return data.list.slice(0, limit).map((slot) => ({
    at: slot.dt,
    temp: Math.round(slot.main.temp),
    humidity: slot.main.humidity,
    status: getConditionText(slot.weather[0].id),
    // 예보는 각 시점이 낮인지 밤인지를 API가 아이콘 코드 끝 d/n으로 알려준다.
    icon: getConditionIcon(slot.weather[0].id, slot.sys.pod === 'd'),
    // pop = probability of precipitation. 0~1 비율이라 퍼센트로 바꾼다.
    pop: Math.round((slot.pop ?? 0) * 100),
    timezone,
  }))
}

/*
  한 도시의 화면을 그리는 데 필요한 두 API를 함께 호출한다.
  Promise.all 이라 두 요청이 순차가 아니라 동시에 나간다. (대기 시간이 절반)

  한쪽만 실패해도 전체가 실패하는 게 맞는지 고민했는데,
  미세먼지만 못 받아온 상태로 카드가 그려지면 "0㎍/좋음"으로 오해하기 쉬워
  차라리 그 도시를 통째로 에러 처리하는 쪽을 택했다.
*/
export const fetchCityWeather = async (city) => {
  const [current, air] = await Promise.all([fetchCurrentWeather(city), fetchAirPollution(city)])

  return {
    ...city, // id / name / fullName / lat / lon
    ...current,
    ...air,
  }
}
