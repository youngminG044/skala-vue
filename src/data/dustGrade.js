/*
  dustGrade.js
  - 미세먼지 등급 기준과 계산을 한 곳에 모은 모듈.
  - DustGauge(상세/즐겨찾기 화면)와 DashboardStatus(상단 요약)가
    같은 기준을 봐야 해서 컴포넌트 밖으로 뺐다.
    같은 수치를 두 곳이 다른 등급으로 말하는 일을 막기 위함.
*/

// 환경부 통합대기환경지수 기준.
// max는 막대 바를 100%로 채우는 기준값(그 이상은 100%로 고정).
export const DUST_SPEC = {
  pm10: { label: '미세먼지 (PM10)', good: 30, normal: 80, bad: 150, max: 200 },
  pm25: { label: '초미세먼지 (PM2.5)', good: 15, normal: 35, bad: 75, max: 100 },
}

/*
  수치를 4단계 등급으로 환산.
    color    : 막대 바 채움 색 (PrimeVue ProgressBar에 넘긴다)
    severity : PrimeVue Tag의 색 이름. 뱃지는 테마 색을 그대로 쓰는 편이
               앱 전체 톤과 어긋나지 않는다.
*/
export const getDustGrade = (type, value) => {
  const { good, normal, bad } = DUST_SPEC[type]
  if (value <= good) return { text: '좋음', color: '#4d94f0', severity: 'info' }
  if (value <= normal) return { text: '보통', color: '#38b26b', severity: 'success' }
  if (value <= bad) return { text: '나쁨', color: '#f0932b', severity: 'warn' }
  return { text: '매우 나쁨', color: '#fa5a5a', severity: 'danger' }
}
