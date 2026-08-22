<!--
  ForecastList.vue
  - OpenWeatherMap의 5 Day / 3 Hour Forecast 응답을 시간순으로 보여주는 컴포넌트.
    (과제 요구사항 2번 - 제공되는 API를 추가하여 기능 확장)
  - 데이터는 부모(상세 뷰)가 스토어에서 꺼내 props로 내려준다. 여기서는 표시만 담당.
  - PrimeVue 적용: 대기/실패 안내 -> Message, 색은 테마 토큰(--p-surface-*)으로
  - 항목이 8개(24시간치)라 세로로 쌓으면 화면이 너무 길어져 가로 스크롤 목록으로 둔다.
-->
<script setup>
import { computed } from 'vue'

import Message from 'primevue/message'

import { useConfigStore } from '@/stores/configStore'
import { formatLocalDayHour, formatLocalWeekday } from '@/utils/time'

const props = defineProps({
  // fetchForecast가 돌려준 배열. 아직 안 받아왔으면 null.
  slots: {
    type: Array,
    default: null,
  },
})

const configStore = useConfigStore()

/*
  표시에 필요한 값을 미리 만들어 둔다.
  템플릿에서 함수를 여러 번 호출하는 대신 한 번에 계산해두면
  단위가 바뀔 때 다시 계산되는 범위도 명확해진다.
*/
const displaySlots = computed(() => {
  if (props.slots === null) return []
  return props.slots.map((slot) => ({
    ...slot,
    // 기온은 섭씨 원본을 받아 현재 단위로 변환한다. (목록/상세 카드와 같은 규칙)
    temp: configStore.convertTemp(slot.temp),
    weekday: formatLocalWeekday(slot.at, slot.timezone),
    dayHour: formatLocalDayHour(slot.at, slot.timezone),
  }))
})
</script>

<template>
  <!-- 아직 응답 전 -->
  <Message v-if="slots === null" severity="secondary" variant="simple" class="forecast-message">
    예보를 불러오는 중…
  </Message>

  <!-- 예보만 실패한 경우. 상세 화면의 나머지는 그대로 보여야 하므로 여기서만 안내한다. -->
  <Message v-else-if="slots.length === 0" severity="warn" variant="simple" class="forecast-message">
    예보 정보를 가져오지 못했습니다.
  </Message>

  <ul class="forecast-list" v-else>
    <li class="forecast-item" v-for="slot in displaySlots" :key="slot.at">
      <p class="forecast-time">
        <span class="forecast-weekday">{{ slot.weekday }}</span>
        {{ slot.dayHour }}
      </p>
      <p class="forecast-icon">{{ slot.icon }}</p>
      <p class="forecast-temp">{{ slot.temp }}{{ configStore.unitSymbol }}</p>
      <p class="forecast-status">{{ slot.status }}</p>
      <!-- 강수확률은 0%일 때 굳이 표시하지 않는다. 줄마다 "0%"가 늘어서면 잡음이 된다. -->
      <p class="forecast-pop" v-if="slot.pop > 0">💧 {{ slot.pop }}%</p>
    </li>
  </ul>
</template>

<style scoped>
.forecast-message {
  justify-content: center;
  padding: 14px 0;
}

/*
  가로 스크롤 목록.
  카드 폭이 좁아 8칸을 한 화면에 넣을 수 없으므로 넘치는 만큼만 옆으로 민다.
  세로 스크롤은 생기지 않도록 overflow-y는 건드리지 않는다.
*/
.forecast-list {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0 0 6px;
  list-style: none;
  overflow-x: auto;
  /*
    기본 가로 스크롤바는 유리 위에서 회색 판처럼 통째로 튄다.
    (color-scheme: dark 만으로는 플랫폼마다 결과가 달랐다)
    트랙은 비우고 손잡이만 남겨 하늘이 그대로 비치게 한다.
    감추지는 않는다 — 옆으로 더 있다는 걸 알려야 하기 때문. (customization.md 15-2)
  */
  scrollbar-width: thin;
  scrollbar-color: var(--p-surface-400) transparent;
}

.forecast-list::-webkit-scrollbar {
  height: 8px;
}

.forecast-list::-webkit-scrollbar-track {
  background-color: transparent;
}

.forecast-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background-color: var(--p-surface-400);
}

.forecast-list::-webkit-scrollbar-thumb:hover {
  background-color: var(--p-surface-500);
}

/*
  예보 칸도 유리 3층. 가로로 8칸이 스크롤되므로 블러는 걸지 않는다.
  (가로 스크롤은 세로보다 프레임 예산이 더 빡빡하다)
*/
.forecast-item {
  flex: 0 0 auto; /* 칸이 찌그러지지 않도록 축소를 막는다 */
  width: 72px;
  padding: 10px 6px;
  border: 1px solid var(--glass-border-soft);
  border-radius: var(--glass-radius-sm);
  background: var(--glass-inset);
  text-align: center;
  transition:
    background 200ms ease,
    border-color 200ms ease;
}

.forecast-item:hover {
  background: var(--glass-panel);
  border-color: var(--glass-border);
}

.forecast-item p {
  margin: 0;
}

.forecast-time {
  font-size: 11px;
  color: var(--p-surface-500);
  white-space: nowrap;
}

.forecast-weekday {
  font-weight: 600;
  color: var(--p-surface-600);
}

.forecast-icon {
  margin-top: 6px;
  font-size: 20px;
  line-height: 1.2;
}

.forecast-temp {
  margin-top: 4px;
  font-size: 15px;
  font-weight: 700;
  color: var(--p-surface-800);
}

.forecast-status {
  margin-top: 2px;
  font-size: 11px;
  color: var(--p-surface-500);
}

.forecast-pop {
  margin-top: 3px;
  font-size: 11px;
  color: var(--p-primary-color);
}
</style>
