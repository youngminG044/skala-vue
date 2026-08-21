<!--
  NotFoundView.vue
  - 라우터의 Catch-all Route("/:pathMatch(.*)*")가 잡아주는 404 화면.
  - 정의되지 않은 주소로 들어왔을 때만 보인다.
  - PrimeVue 적용: 안내 상자 -> Card, 홈 이동 링크 -> Button (as="router-link")
-->
<script setup>
import Button from 'primevue/button'
import Card from 'primevue/card'
</script>

<template>
  <div class="not-found-view">
    <Card class="not-found-card">
      <template #content>
        <p class="not-found-emoji">🌞<span class="mark">❓</span></p>
        <h2 class="not-found-title">페이지를 찾을 수 없습니다.</h2>
        <p class="not-found-desc">
          요청하신 주소가 존재하지 않거나,<br />
          아직 개발되지 않았습니다.
        </p>

        <!-- as="router-link" 라서 버튼 모양 그대로 라우터 이동이 된다 -->
        <Button as="router-link" to="/" label="날씨 메인으로 이동" rounded class="not-found-link" />
      </template>
    </Card>
  </div>
</template>

<style scoped>
.not-found-view {
  display: flex;
  justify-content: center;
  padding: 40px 16px;
  background-color: var(--p-surface-50);
  border-radius: var(--p-border-radius-lg);
}

.not-found-card {
  width: min(360px, 100%);
  text-align: center;
}

.not-found-emoji {
  margin: 0 0 10px;
  font-size: 40px;
  line-height: 1;
}

.mark {
  margin-left: 4px;
  color: var(--p-red-500);
}

.not-found-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--p-surface-800);
}

.not-found-desc {
  margin: 0 0 18px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--p-surface-500);
}

.not-found-link {
  text-decoration: none;
}
</style>
