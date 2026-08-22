/*
  http.js
  - 이 앱이 부르는 외부 API마다 axios 인스턴스를 하나씩 만들어 두는 곳.
      owmClient  OpenWeatherMap  (현재 날씨 / 대기오염 / 예보)
      erClient   ExchangeRate-API (환율)                     <- 요구사항 3번 확장
  - 모든 요청에 공통으로 붙는 것(주소, API Key, 타임아웃)을 여기서 한 번만 정하고,
    개별 API 함수(api/weather.js, api/exchange.js)는 경로와 파라미터만 신경 쓰게 한다.

  API Key는 소스에 하드코딩하지 않는다.
  프로젝트 루트의 .env.local 에 두고 Vite가 빌드 시 주입한다.
    VITE_OPENWEATHER_API_KEY=...
    VITE_ExchangeRate_API_KEY=...
  (.env.local 은 .gitignore 대상. 형식은 .env.example 참고)
*/
import axios from 'axios'

// Vite는 VITE_ 접두사가 붙은 것만 import.meta.env에 넣어준다.
// 접두사 뒤쪽은 대소문자를 그대로 쓰므로 이름이 한 글자만 달라도 undefined가 된다.
const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const ER_KEY = import.meta.env.VITE_ExchangeRate_API_KEY

/*
  키를 아직 안 채운 상태를 화면에서 구분해 안내하기 위한 판정.
  .env.example을 그대로 복사만 해두면 placeholder 문자열이 들어 있으므로 그것도 걸러낸다.
  두 API가 같은 규칙을 쓰므로 함수로 뽑아 둔다.
*/
const hasKey = (key) => typeof key === 'string' && key.trim() !== '' && !key.includes('여기에')

export const hasWeatherApiKey = hasKey(OWM_KEY)
export const hasExchangeApiKey = hasKey(ER_KEY)

/*
  성공 응답 처리는 두 API가 같다.
  매번 response.data를 꺼내 쓰지 않도록 여기서 한 번 벗겨준다.
  덕분에 호출부는 `const data = await client.get(...)` 로 끝난다.
*/
const unwrapData = (response) => response.data

/* ────────────────────────────────────────────────
   OpenWeatherMap
   키를 쿼리 파라미터(appid)로 받는다.
   ──────────────────────────────────────────────── */
export const owmClient = axios.create({
  baseURL: 'https://api.openweathermap.org',
  timeout: 8000, // 응답이 없을 때 무한정 기다리지 않도록
  params: {
    appid: OWM_KEY, // 모든 요청에 공통으로 붙는 쿼리 파라미터
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
  unwrapData,
  // 실패: 읽을 수 있는 메시지로 바꿔 다시 던진다.
  (error) => Promise.reject(new Error(toReadableMessage(error))),
)

/* ────────────────────────────────────────────────
   ExchangeRate-API
   ──────────────────────────────────────────────── */

/*
  이쪽은 키를 쿼리가 아니라 URL 경로에 끼워 넣는다.
    https://v6.exchangerate-api.com/v6/{API_KEY}/latest/{BASE}
  그래서 owmClient 처럼 params 로 붙일 수 없고 baseURL 에 미리 포함시킨다.
  호출부(api/exchange.js)는 '/latest/USD' 만 적으면 되고 키는 보이지 않는다.

  키가 없으면 baseURL이 '.../v6/undefined' 가 되지만, 스토어가 hasExchangeApiKey를
  먼저 확인하고 요청 자체를 보내지 않으므로 그 주소로 나갈 일은 없다.
*/
export const erClient = axios.create({
  baseURL: `https://v6.exchangerate-api.com/v6/${ER_KEY}`,
  timeout: 8000,
})

/*
  ExchangeRate-API는 실패를 HTTP 상태 코드가 아니라 본문의 error-type 으로 알려준다.
    { "result": "error", "error-type": "inactive-account" }
  상태 코드는 대부분 403 하나로 뭉뚱그려져서, 코드만 보면 무엇이 문제인지 알 수 없다.
  공식 문서에 정의된 다섯 가지를 그대로 우리말 안내로 옮겨둔다.
*/
const EXCHANGE_ERROR_TEXT = {
  'invalid-key': 'ExchangeRate-API 키가 유효하지 않습니다. .env.local 의 키를 확인해 주세요.',
  'inactive-account':
    'ExchangeRate-API 계정이 아직 활성화되지 않았습니다. 가입할 때 받은 메일의 확인 링크를 눌러 이메일 인증을 마쳐 주세요.',
  'quota-reached': '이번 달 환율 API 호출 한도를 모두 썼습니다. 다음 달에 다시 시도해 주세요.',
  'unsupported-code': '지원하지 않는 통화 코드를 요청했습니다.',
  'malformed-request': '환율 요청 형식이 올바르지 않습니다.',
}

const toReadableExchangeMessage = (error) => {
  if (error.response) {
    // error-type 은 하이픈이 들어간 키라 점 표기법(data.error-type)으로는 못 읽는다.
    const errorType = error.response.data?.['error-type']
    if (errorType !== undefined && EXCHANGE_ERROR_TEXT[errorType] !== undefined) {
      return EXCHANGE_ERROR_TEXT[errorType]
    }
    return `환율 서버가 오류를 반환했습니다. (${error.response.status})`
  }

  if (error.code === 'ECONNABORTED') return '환율 서버 응답이 너무 늦습니다. 다시 시도해 주세요.'
  return '환율 서버에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.'
}

erClient.interceptors.response.use(unwrapData, (error) =>
  Promise.reject(new Error(toReadableExchangeMessage(error))),
)
