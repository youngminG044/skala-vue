/*
  statusFormats.js
  - 대시보드 제목 우측에 표시할 "대시보드 상태"의 표시 형식 목록.
  - 형식이 10가지라 컴포넌트 안에 if/else로 늘어놓는 대신
    { id, label, render } 배열로 정의하고 화면은 순회만 한다.
    -> 형식을 추가할 때 컴포넌트를 건드리지 않아도 된다.

  render(ctx)의 ctx는 DashboardStatus가 만들어 넘기는 표시용 값 묶음:
    status      기상 현황 문자열 ('맑음')
    temp        현재 단위로 변환된 기온 숫자
    unitSymbol  '°C' / '°F'
    humidity    습도(%)
    pm10, pm25          미세먼지 수치(㎍/㎥)
    pm10Grade, pm25Grade 등급 문자열 ('보통')
*/

/*
  '날씨, 1.5° 높아요'(어제 대비 기온차) 형식은 뺐다.
  어제 기온은 History API로만 얻을 수 있는데 무료 플랜에 포함되지 않아,
  실제 데이터로는 채울 수 없는 형식이기 때문이다.
*/
export const STATUS_FORMATS = [
  {
    id: 'temp',
    label: '날씨, 온도°C',
    render: (ctx) => `${ctx.status}, ${ctx.temp}${ctx.unitSymbol}`,
  },
  {
    id: 'humidity',
    label: '날씨, 습도%',
    render: (ctx) => `${ctx.status}, ${ctx.humidity}%`,
  },
  {
    id: 'temp-humidity',
    label: '날씨, 온도° 습도%',
    render: (ctx) => `${ctx.status}, ${ctx.temp}° ${ctx.humidity}%`,
  },
  {
    id: 'temp-humidity-dust',
    label: '날씨, 온도° 습도% 미세먼지',
    render: (ctx) => `${ctx.status}, ${ctx.temp}° ${ctx.humidity}% ${ctx.pm10Grade}`,
  },
  {
    id: 'temp-humidity-dust-value',
    label: '날씨, 온도° 습도% 미세먼지값㎍',
    render: (ctx) => `${ctx.status}, ${ctx.temp}° ${ctx.humidity}% ${ctx.pm10}㎍`,
  },
  {
    id: 'dust-ultradust',
    label: '날씨, 미세먼지 초미세먼지',
    render: (ctx) => `${ctx.status}, ${ctx.pm10Grade} ${ctx.pm25Grade}`,
  },
  {
    id: 'dust-value-ultradust-value',
    label: '날씨, 미세먼지값㎍ 초미세먼지값㎍',
    render: (ctx) => `${ctx.status}, ${ctx.pm10}㎍ ${ctx.pm25}㎍`,
  },
  {
    id: 'dust-value-dust',
    label: '날씨, 미세먼지값㎍ 미세먼지',
    render: (ctx) => `${ctx.status}, ${ctx.pm10}㎍ ${ctx.pm10Grade}`,
  },
  {
    id: 'ultradust-value-ultradust',
    label: '날씨, 초미세먼지값㎍ 초미세먼지',
    render: (ctx) => `${ctx.status}, ${ctx.pm25}㎍ ${ctx.pm25Grade}`,
  },
]

// 저장된 형식 id가 사라졌거나 이상할 때 돌아갈 기본값.
export const DEFAULT_STATUS_FORMAT = 'temp-humidity-dust'

export const findStatusFormat = (id) =>
  STATUS_FORMATS.find((format) => format.id === id) ??
  STATUS_FORMATS.find((format) => format.id === DEFAULT_STATUS_FORMAT)
