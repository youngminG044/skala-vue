<!--
  DashboardStatus.vue
  - 대시보드 제목 우측에 붙는 "대시보드 상태" 요약.
  - 지금 고른 도시의 날씨를 configStore가 가진 표시 형식대로 한 줄로 보여주고,
    클릭하면 형식 선택 다이얼로그가 열린다.
  - 도시 선택 상태와 표시 형식이 모두 스토어에 있어 부모에게 받을 props가 없다.
  - 날씨 값이 API 응답이라 도착 전에는 표시할 것이 없다. 그 동안은 안내 문구로 대체한다.

  - PrimeVue 적용
      요약 버튼   -> Button (rounded, secondary)
      응답 대기   -> ProgressSpinner
-->
<script setup>
import { ref, computed } from 'vue'

import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

import StatusFormatDialog from './StatusFormatDialog.vue'
import { getDustGrade } from '@/data/dustGrade'
import { useConfigStore } from '@/stores/configStore'
import { useSelectedCityStore } from '@/stores/selectedCity'

const configStore = useConfigStore()
const selectedCityStore = useSelectedCityStore()

const isDialogOpen = ref(false)

// 아직 응답이 오지 않았으면 null. 아래 계산과 템플릿이 모두 이 값을 먼저 확인한다.
const city = computed(() => selectedCityStore.selectedCity)

// 표시 형식들이 공통으로 참조하는 값 묶음.
// 단위 변환과 등급 계산을 여기서 한 번만 하고 형식은 조합만 한다.
const statusContext = computed(() => {
  if (city.value === null) return null
  return {
    status: city.value.status,
    temp: configStore.convertTemp(city.value.temp),
    unitSymbol: configStore.unitSymbol,
    humidity: city.value.humidity,
    pm10: city.value.pm10,
    pm25: city.value.pm25,
    pm10Grade: getDustGrade('pm10', city.value.pm10).text,
    pm25Grade: getDustGrade('pm25', city.value.pm25).text,
  }
})

// 현재 형식으로 렌더된 최종 문자열
const statusText = computed(() =>
  statusContext.value === null ? '' : configStore.currentStatusFormat.render(statusContext.value),
)
</script>

<template>
  <div class="dashboard-status">
    <!-- 데이터가 도착한 뒤에만 요약을 보여준다 -->
    <template v-if="city">
      <!-- 어느 도시 기준인지 밝혀두지 않으면 숫자만 떠서 오해하기 쉽다 -->
      <span class="status-city">{{ city.name }}</span>

      <Button
        :label="statusText"
        severity="secondary"
        size="small"
        rounded
        title="표시 형식 변경"
        @click="isDialogOpen = true"
      />

      <StatusFormatDialog v-model:open="isDialogOpen" :preview-context="statusContext" />
    </template>

    <!-- 응답 대기 중. 자리를 비워두면 제목 줄이 흔들려서 문구로 채운다. -->
    <span class="status-placeholder" v-else>
      <ProgressSpinner class="status-spinner" stroke-width="6" />
      날씨 정보를 불러오는 중…
    </span>
  </div>
</template>

<style scoped>
.dashboard-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.status-city {
  font-size: 12px;
  font-weight: 500;
  color: var(--p-surface-400);
  white-space: nowrap;
}

.status-placeholder {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--p-surface-400);
  white-space: nowrap;
}

/* ProgressSpinner 기본 크기가 100px이라 문구 옆에 들어가도록 줄인다 */
.status-spinner {
  width: 16px;
  height: 16px;
}
</style>
