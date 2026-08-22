/*
  configStore.js
  - 날씨 단위(섭씨/화씨) 설정을 앱 전체가 공유하는 Pinia 스토어.
  - 메인 목록과 상세 화면이 같은 설정을 봐야 하므로 컴포넌트가 아니라 스토어가 소유한다.
  - state / getters / actions 세 구획이 요구사항 표와 1:1로 대응되도록
    Options 스타일로 작성했다. (프로젝트의 다른 스토어는 setup 스타일)
*/
import { defineStore } from 'pinia'

const STORAGE_KEY = 'weather-unit'

// 새로고침해도 단위가 유지되도록 localStorage에서 복원한다.
// 저장된 값이 없거나 이상하면 기본값 'celsius'.
const loadUnit = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'celsius' || saved === 'fahrenheit' ? saved : 'celsius'
}

export const useConfigStore = defineStore('config', {
  state: () => ({
    // 단위를 저장하는 변수 (초기값: celsius)
    unit: loadUnit(),
  }),

  getters: {
    // 현재 단위 상태에 맞는 기호
    unitSymbol: (state) => (state.unit === 'fahrenheit' ? '°F' : '°C'),
    // 화씨 여부. 버튼 문구/스타일 분기에 사용한다.
    isFahrenheit: (state) => state.unit === 'fahrenheit',
    // 섭씨 원본을 현재 단위로 변환해 주는 함수를 돌려주는 getter.
    // 나중에 붙은 화면(예보 칸 등)이 변환 규칙을 다시 쓰지 않도록 한다.
    convertTemp: (state) => (celsius) =>
      state.unit === 'fahrenheit' ? Math.round((celsius * 9) / 5 + 32) : celsius,
  },

  actions: {
    // 'celsius'와 'fahrenheit'를 토글(스위칭)하는 함수
    toggleUnit() {
      this.unit = this.unit === 'celsius' ? 'fahrenheit' : 'celsius'
      localStorage.setItem(STORAGE_KEY, this.unit)
    },
  },
})
