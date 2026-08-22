<!--
  DustGauge.vue
  - 미세먼지 수치 하나를 "숫자 + 막대 바 + 상태 뱃지"로 보여주는 표시 전용 부품.
  - 자신은 상태를 갖지 않고 props로 받은 값만 그린다.

  - PrimeVue 적용
      막대 바   -> ProgressBar
      상태 뱃지 -> Tag
-->
<script setup>
import { computed } from 'vue'

import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'

import { DUST_SPEC, getDustGrade } from '@/data/dustGrade'

const props = defineProps({
  // 'pm10'(미세먼지) 또는 'pm25'(초미세먼지). 항목마다 등급 기준이 다르다.
  type: {
    type: String,
    required: true,
    validator: (value) => ['pm10', 'pm25'].includes(value),
  },
  // 관측 수치 (㎍/㎥)
  value: {
    type: Number,
    required: true,
  },
})

const spec = computed(() => DUST_SPEC[props.type])

// 등급 계산은 dustGrade 모듈이 담당한다. (어느 화면에서 읽어도 같은 기준을 쓰기 위해)
const grade = computed(() => getDustGrade(props.type, props.value))

// 막대 바 채움 비율. 기준값을 넘어도 100%를 넘지 않도록 자른다.
const percent = computed(() => Math.min((props.value / spec.value.max) * 100, 100))
</script>

<template>
  <div class="dust-gauge">
    <div class="dust-head">
      <span class="dust-label">{{ spec.label }}</span>
      <span class="dust-value">
        {{ value }}<span class="dust-unit">㎍/㎥</span>
        <!-- 등급에 따라 뱃지 색이 바뀜 -->
        <Tag :value="grade.text" :severity="grade.severity" rounded />
      </span>
    </div>

    <!--
      수치 bar.
      ProgressBar의 채움 색은 테마 토큰(--p-progressbar-value-background)으로 정해진다.
      등급마다 색이 달라야 해서 그 변수만 인라인으로 덮어쓴다.
      showValue를 끈 이유는 수치를 이미 위에 크게 적어두었기 때문.
    -->
    <ProgressBar
      class="dust-bar"
      :value="percent"
      :show-value="false"
      :style="{ '--p-progressbar-value-background': grade.color }"
    />
  </div>
</template>

<style scoped>
.dust-gauge {
  margin-bottom: 14px;
}

.dust-gauge:last-child {
  margin-bottom: 0;
}

.dust-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 7px;
}

.dust-label {
  font-size: 14px;
  color: var(--p-surface-600);
}

.dust-value {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--p-surface-800);
  white-space: nowrap;
}

.dust-unit {
  margin-left: 2px;
  font-size: 12px;
  font-weight: 400;
  color: var(--p-surface-500);
}

.dust-bar {
  height: 8px;
}
</style>
