<!--
  UnitToggler.vue
  - 대시보드 상단에서 온도 단위(섭씨/화씨)를 바꾸는 UI 버튼과 영역.
  - 자신은 상태를 갖지 않고 configStore의 값을 읽고 action만 호출한다.
    (단위는 여러 화면이 함께 보는 설정이라 부모가 소유할 수 없다)
  - 바꾼 직후의 안내 문구는 useNotice가 맡는다. 실제 표시는 App.vue의
    PrimeVue Toast가 하므로, 여기서는 "무슨 문구를 띄울지"만 정한다.

  - PrimeVue 적용: 단위변경 버튼 -> Button
-->
<script setup>
import { computed } from 'vue'

import Button from 'primevue/button'

import { useConfigStore } from '@/stores/configStore'
import { useNotice } from '@/composables/useNotice'

const configStore = useConfigStore()
const { notify } = useNotice()

// "화씨(°F)" / "섭씨(°C)" 형태의 현재 상태 표시 문구
const unitText = computed(
  () => `${configStore.isFahrenheit ? '화씨' : '섭씨'}(${configStore.unitSymbol})`,
)

const changeUnit = () => {
  configStore.toggleUnit()
  // toggleUnit이 끝난 뒤라 unitText는 이미 바뀐 단위를 가리킨다.
  // 순서를 바꾸면 "화씨로 바꿨는데 섭씨로 바뀌었습니다"라고 뜬다.
  notify(`🌡️ 단위가 ${unitText.value}로 바뀌었습니다.`)
}
</script>

<template>
  <div class="unit-toggler">
    <!-- 내비게이션과 한 줄에 들어가야 해서 라벨을 짧게 둔다 -->
    <span class="unit-label">{{ unitText }}</span>

    <!-- 클릭하면 toggleUnit action이 섭씨 <-> 화씨를 뒤집는다 -->
    <Button
      label="단위변경"
      size="small"
      :aria-label="configStore.isFahrenheit ? '섭씨로 변경' : '화씨로 변경'"
      @click="changeUnit"
    />
  </div>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit-label {
  font-size: 13px;
  color: var(--p-surface-600);
  white-space: nowrap;
}
</style>
