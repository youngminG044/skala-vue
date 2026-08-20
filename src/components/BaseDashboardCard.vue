<!--
  BaseDashboardCard.vue
  - 대시보드 카드의 "디자인 껍데기"만 담당하는 공통 컴포넌트.
  - 자신은 어떤 상태도 갖지 않고, 내용은 전부 부모가 <slot>으로 주입.
    -> 도시 검색 / 날씨 현황처럼 내용이 달라도 같은 카드 디자인을 재사용 할 수 있음.
-->
<script setup>
defineProps({
  // 카드 상단에 표시할 제목. 넘기지 않으면 제목 영역 자체가 렌더링 X.
  title: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="dash-board-section">
    <!--
      제목 영역: title prop이 있거나 부모가 #title 슬롯을 넘겼을 때만 그림.
      $slots는 부모가 어떤 슬롯을 넘겼는지 담고 있는 객체.
    -->
    <h2 class="card-title" v-if="title || $slots.title">
      <slot name="title">{{ title }}</slot>
    </h2>

    <!-- 이름 없는 기본 슬롯: 부모(WeatherParent)가 도시 검색 / 날씨 현황을 주입하는 자리 -->
    <slot />

    <!-- 선택적 하단 영역. 부모가 #footer 슬롯을 넘겼을 때만 그림. -->
    <div class="card-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </section>
</template>

<style scoped>
.dash-board-section {
  background-color: #f8f9fa;
  border: 1px solid #e6eaed;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 14px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px;
}

.card-footer {
  margin-top: 12px;
}
</style>
