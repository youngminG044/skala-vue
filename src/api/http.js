/*
  http.js
  - OpenWeatherMap 호출에 쓰는 axios 인스턴스 한 개.
  - 모든 요청에 공통으로 붙는 것(주소, API Key, 타임아웃)을 여기서 한 번만 정하고,
    개별 API 함수(api/weather.js)는 경로와 좌표만 신경 쓰게 한다.

  API Key는 소스에 하드코딩하지 않는다.
  프로젝트 루트의 .env.local 에 두고 Vite가 빌드 시 주입한다.
    VITE_OPENWEATHER_API_KEY=...
  (.env.local 은 .gitignore 대상. 형식은 .env.example 참고)
*/
import axios from 'axios'

// Vite는 VITE_ 접두사가 붙은 것만 import.meta.env에 넣어준다.
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

// 키를 아직 안 채운 상태를 화면에서 구분해 안내하기 위한 플래그.
// .env.example을 그대로 복사만 해두면 placeholder 문자열이 들어 있으므로 그것도 걸러낸다.
export const hasApiKey =
  typeof API_KEY === 'string' && API_KEY.trim() !== '' && !API_KEY.includes('여기에')

export const owmClient = axios.create({
  baseURL: 'https://api.openweathermap.org',
  timeout: 8000, // 응답이 없을 때 무한정 기다리지 않도록
  params: {
    appid: API_KEY, // 모든 요청에 공통으로 붙는 쿼리 파라미터
  },
})

/*
  axios가 던지는 에러는 화면에 그대로 보여주기엔 불친절하다.
  ("Request failed with status code 401")
  응답 인터셉터에서 사람이 읽을 수 있는 문장으로 바꿔 다시 던진다.
*/
const toReadableMessage = (error) => {
  // 1) 서버가 응답은 했지만 실패 상태 코드인 경우
  if (error.response) {
    const { status } = error.response
    if (status === 401) return 'API 키가 유효하지 않습니다. .env.local 의 키를 확인해 주세요.'
    if (status === 404) return '해당 좌표의 관측 정보를 찾을 수 없습니다.'
    if (status === 429) return 'API 호출 한도를 넘었습니다. 잠시 후 다시 시도해 주세요.'
    return `날씨 서버가 오류를 반환했습니다. (${status})`
  }

  // 2) 요청은 나갔는데 응답이 없는 경우
  if (error.code === 'ECONNABORTED') return '날씨 서버 응답이 너무 늦습니다. 다시 시도해 주세요.'
  return '날씨 서버에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.'
}

owmClient.interceptors.response.use(
  // 성공: 매번 response.data를 꺼내 쓰지 않도록 여기서 벗겨준다.
  (response) => response.data,
  // 실패: 읽을 수 있는 메시지로 바꿔 다시 던진다.
  (error) => Promise.reject(new Error(toReadableMessage(error))),
)
