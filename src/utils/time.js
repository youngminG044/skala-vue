/*
  time.js
  - OpenWeatherMap의 시각 값을 화면 문자열로 바꾼다.

  API는 시각을 두 조각으로 준다.
    dt       : UTC 기준 Unix 초 (예: 1755..., 일출/일몰의 sys.sunrise 도 같은 형식)
    timezone : 그 도시의 UTC 오프셋 (초 단위. 한국이면 32400 = +9시간)

  주의할 점:
  브라우저의 로컬 시간대로 그냥 찍으면 "보는 사람이 있는 곳의 시각"이 나온다.
  부산의 일출을 미국에서 열면 엉뚱한 시각이 표시된다는 뜻이다.
  그래서 (dt + timezone)으로 값을 미리 밀어둔 뒤 getUTC* 로 읽는다.
  이러면 브라우저 시간대와 무관하게 항상 "그 도시의 현지 시각"이 나온다.
*/

// 도시 현지 시각으로 옮겨둔 Date. 반드시 getUTC* 로 읽어야 한다.
const toLocalDate = (unixSeconds, timezoneOffsetSeconds) =>
  new Date((unixSeconds + timezoneOffsetSeconds) * 1000)

const pad2 = (value) => String(value).padStart(2, '0')

// "05:38"
export const formatLocalTime = (unixSeconds, timezoneOffsetSeconds) => {
  const date = toLocalDate(unixSeconds, timezoneOffsetSeconds)
  return `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`
}

// "21일 15시" — 예보 목록처럼 날짜가 넘어가는 경우를 구분해야 할 때
export const formatLocalDayHour = (unixSeconds, timezoneOffsetSeconds) => {
  const date = toLocalDate(unixSeconds, timezoneOffsetSeconds)
  return `${date.getUTCDate()}일 ${date.getUTCHours()}시`
}

// "금" — 예보 목록의 요일 구분
export const formatLocalWeekday = (unixSeconds, timezoneOffsetSeconds) => {
  const date = toLocalDate(unixSeconds, timezoneOffsetSeconds)
  return ['일', '월', '화', '수', '목', '금', '토'][date.getUTCDay()]
}

// 일몰 - 일출을 "13시간 44분" 으로.
// 두 값 모두 같은 시간대의 Unix 초라 오프셋 없이 차이만 구하면 된다.
export const formatDuration = (fromUnixSeconds, toUnixSeconds) => {
  const totalMinutes = Math.round((toUnixSeconds - fromUnixSeconds) / 60)
  return `${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분`
}

/*
  "2026년 8월 22일 09:02" — 환율 고시 시각처럼 보는 사람 기준의 시각이 맞는 값.

  위의 formatLocal* 들과 다루는 방식이 정반대다.
  날씨는 "그 도시의 현지 시각"이라야 의미가 있어서 오프셋을 직접 더했지만,
  환율 고시 시각은 "내가 있는 곳에서 몇 시에 바뀌었나"가 알고 싶은 값이다.
  그래서 브라우저 시간대를 그대로 쓰는 getFullYear/getHours 계열로 읽는다.
*/
export const formatDateTime = (unixSeconds) => {
  const date = new Date(unixSeconds * 1000)
  const day = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  return `${day} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}
