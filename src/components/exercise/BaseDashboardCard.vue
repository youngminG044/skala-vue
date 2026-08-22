<!--
  BaseDashboardCard.vue
  - 대시보드 카드의 "디자인 껍데기"만 담당하는 공통 컴포넌트.
  - 자신은 어떤 상태도 갖지 않고, 내용은 전부 부모가 <slot>으로 주입.
    -> 도시 검색 / 날씨 현황처럼 내용이 달라도 같은 카드 디자인을 재사용 할 수 있음.

  - 안쪽을 PrimeVue의 Card로 바꿨다.
    바깥에서 쓰는 방법(title prop, 기본 슬롯, #footer)은 그대로 두었기 때문에
    이 카드를 쓰는 화면들은 한 줄도 고치지 않았다.
    공통 껍데기를 따로 둔 덕에 UI 라이브러리 교체가 이 파일 안에서 끝난다.
-->
<script setup>
import Card from 'primevue/card'

defineProps({
  // 카드 상단에 표시할 제목. 넘기지 않으면 제목 영역 자체가 렌더링 X.
  title: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <Card class="dash-board-section">
    <!--
      제목 영역: title prop이 있거나 부모가 #title 슬롯을 넘겼을 때만 그림.
      $slots는 부모가 어떤 슬롯을 넘겼는지 담고 있는 객체.
    -->
    <template #title v-if="title || $slots.title">
      <h2 class="card-title">
        <slot name="title">{{ title }}</slot>
      </h2>
    </template>

    <!-- 이름 없는 기본 슬롯: 부모가 도시 검색 / 날씨 현황을 주입하는 자리 -->
    <template #content>
      <slot />
    </template>

    <!-- 선택적 하단 영역. 부모가 #footer 슬롯을 넘겼을 때만 그림. -->
    <template #footer v-if="$slots.footer">
      <slot name="footer" />
    </template>
  </Card>
</template>

<style scoped>
/*
  유리 2층. 앱 껍데기(App.vue의 .container) 위에 얹히는 섹션 카드다.

  여기에는 일부러 backdrop-filter 를 걸지 않는다.
  껍데기가 이미 뒤를 흐려놨는데 여기서 또 흐리면 그 결과를 한 번 더 뭉개서
  색이 빠지고 회색으로 탁해진다. 층은 반투명도와 테두리만으로 나눈다.
  (블러가 화면당 한 장뿐이라 스크롤 성능도 그대로다)
*/
/* .p-card 를 함께 적어 glass.css 의 배경 초기화(.p-card.p-component)보다 위에 둔다 */
.p-card.dash-board-section {
  position: relative;
  margin-bottom: 14px;
  background: var(--glass-panel);
  border: 1px solid var(--glass-border-soft);
  border-radius: var(--glass-radius-md);
  box-shadow: var(--glass-shadow-sm);
  transition:
    background var(--sky-transition),
    border-color var(--sky-transition);
}

/* 위 모서리 광택. 껍데기와 같은 재질이라는 신호를 준다. */
.p-card.dash-board-section::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, var(--glass-sheen), transparent);
  opacity: 0.6;
  pointer-events: none;
}

/*
  Card는 안쪽 여백을 자기 내부 요소에 준다.
  scoped 스타일은 자식 컴포넌트 내부까지 닿지 않으므로 :deep()으로 지정한다.
*/
.dash-board-section :deep(.p-card-body) {
  padding: 16px;
  gap: 12px;
}

.dash-board-section :deep(.p-card-caption) {
  gap: 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--p-surface-800);
}
</style>
