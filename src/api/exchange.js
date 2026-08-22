/*
  exchange.js
  - ExchangeRate-API를 호출하고, 응답을 이 앱이 쓰는 모양으로 바꿔주는 계층.
    (과제 요구사항 3번 - 기타 외부 API를 추가하여 Application 기능을 확장)

  사용하는 API (무료 플랜)
    Standard  /v6/{API_KEY}/latest/{BASE}   기준 통화 1단위에 대한 161개 통화 환율

  api/weather.js 와 같은 이유로 따로 둔 계층이다.
  화면이 conversion_rates 같은 응답 구조를 직접 알면 API가 바뀔 때 화면까지 손봐야 한다.
*/
import { erClient } from './http'
import { currencies, DISPLAY_BASE_CODE, REQUEST_BASE_CODE } from '@/data/currencies'

/*
  화면은 원화 기준("1달러 = 1,385원")인데 왜 API에는 USD를 기준으로 요청하나.

  latest/KRW 로 부르면 원하는 값을 나눗셈 없이 바로 얻을 것 같지만 정밀도가 무너진다.
  이 API는 환율을 소수점 여섯 자리까지만 돌려준다.
    latest/KRW  ->  USD: 0.000722          유효숫자가 세 자리뿐이다
                    뒤집으면 1 / 0.000722 = 1385.04원
    latest/USD  ->  KRW: 1385.741836
                    1달러는 1385.74원

  0.7원 차이가 난다. 원화는 값이 작은 통화라 역수를 취하는 순간 반올림 오차가
  1000배 넘게 증폭된다. 그래서 값이 큰 쪽(USD 기준)으로 받아 나눗셈으로 환산한다.
    1 X = (KRW/USD) / (X/USD) 원
  호출 횟수는 그대로 한 번이다.
*/
const toKrwPerUnit = (rates, currency) => {
  const perRequestBase = rates[currency.code]
  // 목록에 없는 통화 코드를 적어두면 여기서 undefined가 된다. 조용히 NaN을 그리지 않게 막는다.
  if (typeof perRequestBase !== 'number' || perRequestBase === 0) return null

  // unit을 곱해 고시 단위(100엔, 100동)로 맞춘다. 1단위 통화는 unit이 1이라 영향이 없다.
  return (rates[DISPLAY_BASE_CODE] / perRequestBase) * currency.unit
}

/*
  환율 한 벌을 받아 화면이 쓸 모양으로 돌려준다.

  갱신 시각을 함께 돌려주는 이유:
  - 무료 플랜은 하루에 한 번만 값이 바뀐다. 언제 기준의 값인지 안 보이면
    사용자가 실시간 시세로 오해한다.
  - time_next_update_unix는 스토어의 캐시 만료 시점으로도 그대로 쓴다.
    (그 전에 다시 불러봐야 같은 값이 온다)
*/
export const fetchExchangeRates = async () => {
  const data = await erClient.get(`/latest/${REQUEST_BASE_CODE}`)

  const rates = data.conversion_rates
  if (rates === undefined || rates[DISPLAY_BASE_CODE] === undefined) {
    throw new Error('환율 응답에서 원화 환율을 찾지 못했습니다.')
  }

  return {
    // 화면이 순회할 목록. currencies 순서를 그대로 따라간다.
    rates: currencies.map((currency) => ({
      ...currency, // code / country / name / flag / unit
      krw: toKrwPerUnit(rates, currency),
    })),

    // 둘 다 UTC Unix 초. 표시용 변환은 화면에서 한다.
    updatedAt: data.time_last_update_unix,
    nextUpdateAt: data.time_next_update_unix,
  }
}
