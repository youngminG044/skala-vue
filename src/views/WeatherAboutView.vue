<!--
  WeatherAboutView.vue
  - "/about" 경로의 서비스 소개용 정적 페이지.
  - 상태 없이 안내 문구만 보여주고, 메인 대시보드로 돌아가는 링크를 제공한다.
  - PrimeVue 적용: 홈 이동 링크 -> Button (as="router-link" 로 렌더 태그만 바꾼다)
-->
<script setup>
import Button from 'primevue/button'

import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
</script>

<template>
  <div class="about-view">
    <BaseDashboardCard title="ℹ️ 서비스 소개">
      <div class="about-box">
        <p class="about-lead">
          본 앱은 Vue 3 및 Vue Router 5 기반 제작된 실습용 기상 관측 대시보드 시스템입니다.
        </p>

        <ul class="about-list">
          <li><code>components/exercise/</code> 폴더 내부의 독립 부품 연동</li>
          <li>클라이언트 사이드 라우팅을 통한 새로고침 없는 화면 전환</li>
          <li>URL 쿼리 스트링 매핑을 활용한 실시간 검색 상태 동기화</li>
          <li>동적 경로 매칭(<code>/weather/:cityId</code>) 기반 지역별 상세 관측 정보</li>
          <li>OpenWeatherMap 실시간 관측 · 대기오염 · 시간별 예보 연동</li>
          <li>ExchangeRate-API 연동 10개국 환율 조회(<code>/exchange</code>)</li>
          <li>PrimeVue(Aura) 기반 UI 구성</li>
        </ul>
      </div>

      <!--
        RouterLink는 a 태그로 렌더링되지만 페이지를 새로 받아오지 않고
        라우터가 화면만 바꿔치기한다.
        Button의 as prop에 router-link를 주면 버튼 스타일은 그대로 두고
        렌더되는 태그만 RouterLink로 바뀌어 라우팅 동작이 유지된다.
        (asChild 슬롯 방식은 버튼 클래스를 자식에 직접 넘겨줘야 해서
         그냥 밑줄 링크로 보이는 실수를 하기 쉽다)
      -->
      <template #footer>
        <Button as="router-link" to="/" label="대시보드 홈으로 이동" class="home-link" />
      </template>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
/* 유리 3층. 다른 화면의 내용 상자(.detail-box)와 같은 재질로 맞춘다. */
.about-box {
  background: var(--glass-inset);
  border: 1px solid var(--glass-border-soft);
  border-radius: var(--glass-radius-sm);
  padding: 16px;
}

.about-lead {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--p-surface-800);
}

.about-list {
  margin: 0;
  padding-left: 18px;
}

.about-list li {
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--p-surface-600);
}

.about-list li:last-child {
  margin-bottom: 0;
}

/*
  코드 조각.
  고정 노란색(yellow-100 판 + yellow-800 글자)이면 밤하늘에서 혼자 형광펜처럼 튄다.
  같은 노랑 계열을 쓰되 하늘에 따라 밝기가 뒤집히는 --accent-warn 으로 바꾸고,
  배경은 그 색을 옅게 섞어 유리 위에 떠 있게 둔다.
*/
code {
  padding: 2px 5px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--accent-warn) 18%, transparent);
  font-family: 'D2Coding', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  color: var(--accent-warn);
}

/* 카드 폭을 채워 누르기 쉽게 */
.home-link {
  width: 100%;
  justify-content: center;
  text-decoration: none;
}
</style>
