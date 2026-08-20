<!--
  SelectedInfo.vue
  - 대시보드 맨 아래의 상태 바.
  - 부모에게 받은 선택 상태를 표시만 하고, 스스로는 아무 상태도 갖지 않음.
-->
<script setup>
import { watch } from 'vue'

const props = defineProps({
  cityStatus: {
    // 도시를 한 번이라도 선택했는지 여부 -> 문구 분기에 사용
    type: Boolean,
    required: true,
  },
  selectCity: {
    // 선택된 도시 이름
    type: String,
    required: true,
  },
})

// 감시 대상을 () => props.selectCity 형태의 함수로 넘김.
// props.selectCity를 그대로 넘기면 값(문자열)만 전달되어 변화를 추적할 수 없음.
watch(
  () => props.selectCity,
  (newValue) => {
    console.log(`[watch 감지] 상태 바 문구가 업데이트 되었습니다 -> "${newValue}가 선택되었습니다"`)
  },
  { deep: true }, // 객체/배열의 내부 속성까지 감시하는 옵션 (문자열에는 영향 없음)
)
</script>

<template>
  <div class="footer-message">
    <!-- 아직 선택 전이면 안내 문구, 선택 후에는 선택된 도시 이름을 보여줌 -->
    <p v-if="props.cityStatus == false">카드를 클릭하거나 검색해 보세요.</p>
    <p v-else>{{ props.selectCity }}가 선택되었습니다.</p>
  </div>
</template>

<style scoped>
.footer-message {
  padding: 14px 12px;
  background-color: #e8f7ec;
  border-radius: 8px;
  text-align: center;
}

.footer-message p {
  margin: 0;
  color: #1f7a3f;
  font-weight: 600;
  font-size: 14px;
}
</style>
