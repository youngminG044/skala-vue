/*
  cities.js
  - 이 앱이 다루는 도시 목록. (기존 weatherMock.js를 대체)
  - 이제 날씨 값은 OpenWeatherMap에서 받아오므로, 여기에는 "무엇을 조회할지"만 남는다.
      id       : v-for의 :key이자 라우터 동적 경로(/weather/:cityId)의 값
      name     : 목록 카드에 쓰는 짧은 이름
      fullName : 상세 페이지 머리말
      lat/lon  : API 조회 좌표

  좌표를 코드에 두는 이유:
  - 도시 이름으로 조회하는 방식(q=Seoul)은 동명 지역이 있으면 엉뚱한 곳이 잡힌다.
    좌표로 조회하면 그럴 일이 없고, Geocoding API 호출도 아낄 수 있다.
  - 좌표는 공개 정보라 소스에 있어도 문제가 없다. (API Key와는 성격이 다르다)

  id 번호가 지역 순서와 어긋나는 이유:
  - city_01~04(서울/수원/부산/광주)는 도시를 늘리기 전부터 쓰던 값이다.
    id는 즐겨찾기 저장 키이자 공유된 URL의 일부라, 보기 좋게 재정렬하면
    이미 저장된 즐겨찾기가 엉뚱한 도시를 가리키고 링크도 깨진다.
    그래서 기존 4개는 그대로 두고 새 도시를 뒤에 붙였다.

  호출량 참고:
  - 도시 한 곳당 2건(현재 날씨 + 대기오염)이라 목록 화면 진입 시 40건이 나간다.
    무료 플랜 한도는 분당 60건. 스토어가 10분간 캐시하므로 화면을 오가는 것만으로는
    다시 호출되지 않지만, "↻ 새로고침"을 1분 안에 두 번 누르면 한도에 닿을 수 있다.
*/
export const cities = [
  // --- 기존 4개 (id 고정) ---
  { id: 'city_01', name: '서울', fullName: '대한민국 서울특별시', lat: 37.5665, lon: 126.978 },
  { id: 'city_02', name: '수원', fullName: '대한민국 경기도 수원시', lat: 37.2636, lon: 127.0286 },
  { id: 'city_03', name: '부산', fullName: '대한민국 부산광역시', lat: 35.1796, lon: 129.0756 },
  { id: 'city_04', name: '광주', fullName: '대한민국 광주광역시', lat: 35.1595, lon: 126.8526 },

  // --- 특별시 / 광역시 ---
  { id: 'city_05', name: '인천', fullName: '대한민국 인천광역시', lat: 37.4563, lon: 126.7052 },
  { id: 'city_06', name: '대구', fullName: '대한민국 대구광역시', lat: 35.8714, lon: 128.6014 },
  { id: 'city_07', name: '대전', fullName: '대한민국 대전광역시', lat: 36.3504, lon: 127.3845 },
  { id: 'city_08', name: '울산', fullName: '대한민국 울산광역시', lat: 35.5384, lon: 129.3114 },
  {
    id: 'city_09',
    name: '세종',
    fullName: '대한민국 세종특별자치시',
    lat: 36.48,
    lon: 127.289,
  },

  // --- 경기 / 강원 ---
  {
    id: 'city_10',
    name: '고양',
    fullName: '대한민국 경기도 고양시',
    lat: 37.6584,
    lon: 126.832,
  },
  { id: 'city_11', name: '용인', fullName: '대한민국 경기도 용인시', lat: 37.2411, lon: 127.1776 },
  { id: 'city_12', name: '성남', fullName: '대한민국 경기도 성남시', lat: 37.42, lon: 127.1265 },
  {
    id: 'city_13',
    name: '춘천',
    fullName: '대한민국 강원특별자치도 춘천시',
    lat: 37.8813,
    lon: 127.73,
  },
  {
    id: 'city_14',
    name: '강릉',
    fullName: '대한민국 강원특별자치도 강릉시',
    lat: 37.7519,
    lon: 128.8761,
  },

  // --- 충청 / 전라 / 경상 / 제주 ---
  {
    id: 'city_15',
    name: '청주',
    fullName: '대한민국 충청북도 청주시',
    lat: 36.6424,
    lon: 127.489,
  },
  {
    id: 'city_16',
    name: '천안',
    fullName: '대한민국 충청남도 천안시',
    lat: 36.8151,
    lon: 127.1139,
  },
  {
    id: 'city_17',
    name: '전주',
    fullName: '대한민국 전북특별자치도 전주시',
    lat: 35.8242,
    lon: 127.148,
  },
  {
    id: 'city_18',
    name: '목포',
    fullName: '대한민국 전라남도 목포시',
    lat: 34.8118,
    lon: 126.3922,
  },
  { id: 'city_19', name: '포항', fullName: '대한민국 경상북도 포항시', lat: 36.019, lon: 129.3435 },
  {
    id: 'city_20',
    name: '제주',
    fullName: '대한민국 제주특별자치도 제주시',
    lat: 33.4996,
    lon: 126.5312,
  },
]

// 라우터가 넘겨준 cityId로 도시 하나를 찾는다. 없으면 null.
export const findCityById = (cityId) => cities.find((city) => city.id === cityId) ?? null
