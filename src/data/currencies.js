/*
  currencies.js
  - 환율 화면이 다루는 10개국 통화 목록. (cities.js 와 같은 역할)
  - 여기에는 "무엇을 보여줄지"만 두고, 실제 환율 값은 ExchangeRate-API에서 받아온다.
      code    : ISO 4217 통화 코드. API 응답(conversion_rates)의 키이자 v-for의 :key
      country : 화면에 쓰는 국가/지역 이름
      name    : 통화 이름 ("달러", "엔")
      flag    : 국기 이모지. 이미지 없이 한 글자로 나라를 구분해준다
      unit    : 고시 단위 (아래 설명)

  unit(고시 단위)이 왜 필요한가:
  - 1엔은 8.7원, 1동은 0.05원이다. 1단위로 적으면 소수점 아래만 잔뜩 늘어서
    다른 통화와 자릿수가 어긋나 한눈에 비교가 안 된다.
  - 국내 은행 고시환율도 같은 이유로 이런 통화를 100단위로 적는다. (100엔 = 872원)
    그 관례를 그대로 따른다.

  왜 국가를 코드에 두는가:
  - API는 161개 통화를 한 번에 돌려준다. 그중 무엇을 보여줄지는 앱이 정할 몫이고,
    국기·한글 이름처럼 API가 주지 않는 정보도 여기서 함께 관리하는 편이 단순하다.
  - 목록에 나라를 더하고 싶으면 이 배열에 한 줄만 추가하면 된다. 호출은 그대로다.
*/
export const currencies = [
  // 기준 통화. 목록 맨 위에 고정으로 두어 "무엇을 기준으로 읽는 표인지" 먼저 보이게 한다.
  { code: 'KRW', country: '대한민국', name: '원', flag: '🇰🇷', unit: 1 },

  { code: 'USD', country: '미국', name: '달러', flag: '🇺🇸', unit: 1 },
  { code: 'JPY', country: '일본', name: '엔', flag: '🇯🇵', unit: 100 },
  { code: 'EUR', country: '유럽연합', name: '유로', flag: '🇪🇺', unit: 1 },
  { code: 'CNY', country: '중국', name: '위안', flag: '🇨🇳', unit: 1 },
  { code: 'GBP', country: '영국', name: '파운드', flag: '🇬🇧', unit: 1 },
  { code: 'AUD', country: '호주', name: '달러', flag: '🇦🇺', unit: 1 },
  { code: 'CAD', country: '캐나다', name: '달러', flag: '🇨🇦', unit: 1 },
  { code: 'CHF', country: '스위스', name: '프랑', flag: '🇨🇭', unit: 1 },
  { code: 'VND', country: '베트남', name: '동', flag: '🇻🇳', unit: 100 },
]

// 화면이 읽는 기준. "외화 1단위가 몇 원인가" 형태로 보여준다.
export const DISPLAY_BASE_CODE = 'KRW'

/*
  API에 실제로 요청하는 기준 통화.
  화면 기준(KRW)과 다른 이유는 api/exchange.js 의 주석에 적어두었다. (정밀도 문제)
*/
export const REQUEST_BASE_CODE = 'USD'
