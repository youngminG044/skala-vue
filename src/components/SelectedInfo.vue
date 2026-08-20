<script setup>
import { watch } from 'vue'

const props = defineProps({
  cityStatus: {
    type: Boolean,
    required: true,
  },
  selectCity: {
    type: String,
    required: true,
  },
})

watch(
  () => props.selectCity,
  (newValue) => {
    console.log(`[watch 감지] 상태 바 문구가 업데이트 되었습니다 -> "${newValue}가 선택되었습니다"`)
  },
  { deep: true },
)
</script>

<template>
  <div class="footer-message">
    <p v-if="props.cityStatus == false">카드를 클릭하거나 검색해 보세요.</p>
    <p v-else>{{ props.selectCity }}이(가) 선택되었습니다.</p>
  </div>
</template>

<style scoped>
.footer-message {
  margin-top: 16px;
  padding: 12px;
  background-color: #e5f6ea;
  color: #1f7a3f;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}
</style>
