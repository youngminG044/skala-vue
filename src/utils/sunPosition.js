/*
  sunPosition.js
  - 관측 지점의 위경도와 시각으로 태양의 방위각/고도를 계산한다.

  왜 계산하나:
  - 태양 섹션의 일출/일몰은 OpenWeatherMap이 준다(sys.sunrise / sys.sunset).
    하지만 방위각·고도는 무료 플랜은 물론 유료 플랜에도 없는 항목이다.
  - 이 값은 관측이 필요한 데이터가 아니라 위경도와 시각만 있으면 결정되는 천문 계산값이라,
    외부 API를 하나 더 붙이는 대신 순수 함수로 직접 구한다.
    (외부 API 추가는 과제 요구사항 3번의 몫이라 이번 범위에서 제외)

  알고리즘: 저정밀도 태양 위치 계산 (미국 해군 천문대 공식)
  - 오차가 각도로 0.01도 수준이라 화면 표시에는 충분하다.
  - 대기 굴절, 시차 같은 보정은 넣지 않았다. 지평선 근처에서 실제보다 0.5도쯤 낮게 나온다.
*/

const toRadians = (degrees) => (degrees * Math.PI) / 180
const toDegrees = (radians) => (radians * 180) / Math.PI

// 0 이상 360 미만으로 정규화
const normalizeDegrees = (degrees) => ((degrees % 360) + 360) % 360

/**
 * @param {number} latitude   위도 (북위 +)
 * @param {number} longitude  경도 (동경 +)
 * @param {Date}   when       관측 시각 (기본값: 지금)
 * @returns {{ azimuth: number, altitude: number, isUp: boolean }}
 *          azimuth  방위각 (북 0도, 동 90도, 남 180도, 서 270도)
 *          altitude 고도 (지평선 0도. 밤에는 음수)
 *          isUp     태양이 지평선 위에 있는지
 */
export const getSunPosition = (latitude, longitude, when = new Date()) => {
  // 1) J2000.0(2000-01-01 12:00 UT) 기준 경과 일수. 시각의 소수부까지 포함한다.
  const daysSinceJ2000 = when.getTime() / 86400000 - 10957.5

  // 2) 태양의 평균 근점이각과 평균 황경 (도)
  const meanAnomaly = toRadians(357.529 + 0.98560028 * daysSinceJ2000)
  const meanLongitude = 280.459 + 0.98564736 * daysSinceJ2000

  // 3) 타원 궤도 보정을 더한 진황경
  const eclipticLongitude = toRadians(
    meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly),
  )

  // 4) 황도경사각 -> 적경(RA)과 적위(dec)로 변환
  const obliquity = toRadians(23.439 - 0.00000036 * daysSinceJ2000)
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  )
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude))

  // 5) 그리니치 항성시 -> 지방 항성시 -> 시간각
  //    시간각은 "태양이 남중(정남)에서 얼마나 벗어나 있는가"를 각도로 나타낸 값.
  const greenwichSiderealTime = 18.697375 + 24.065709824419 * daysSinceJ2000
  const localSiderealDegrees = normalizeDegrees(greenwichSiderealTime * 15 + longitude)
  const hourAngle = toRadians(normalizeDegrees(localSiderealDegrees - toDegrees(rightAscension)))

  // 6) 적도좌표(적경/적위) -> 지평좌표(방위각/고도)
  const latitudeRad = toRadians(latitude)
  const altitude = Math.asin(
    Math.sin(latitudeRad) * Math.sin(declination) +
      Math.cos(latitudeRad) * Math.cos(declination) * Math.cos(hourAngle),
  )
  const azimuth = Math.atan2(
    -Math.sin(hourAngle),
    Math.tan(declination) * Math.cos(latitudeRad) - Math.sin(latitudeRad) * Math.cos(hourAngle),
  )

  const altitudeDegrees = toDegrees(altitude)

  return {
    azimuth: Math.round(normalizeDegrees(toDegrees(azimuth))),
    altitude: Math.round(altitudeDegrees),
    isUp: altitudeDegrees > 0,
  }
}

// 방위각 숫자만 보면 어느 쪽인지 감이 안 와서 8방위 이름을 함께 보여준다.
const COMPASS_POINTS = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']

export const getCompassDirection = (azimuthDegrees) => {
  // 45도씩 8구간. 22.5도를 더해 각 방위의 중심을 기준으로 반올림한다.
  const index = Math.round(normalizeDegrees(azimuthDegrees) / 45) % 8
  return COMPASS_POINTS[index]
}
