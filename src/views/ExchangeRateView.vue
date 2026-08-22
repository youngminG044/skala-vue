<!--
  ExchangeRateView.vue
  - "/exchange" 경로의 환율 화면.
    (과제 요구사항 3번 - 기타 외부 API를 추가하여 Application 기능을 확장)
  - ExchangeRate-API에서 받은 값을 "외화 1단위 = 몇 원" 형태로 보여준다.
  - 값과 호출은 exchange 스토어가 소유하고, 이 화면은 표시와 서식만 맡는다.
  - PrimeVue 적용: 껍데기 -> BaseDashboardCard, 로딩 -> ProgressSpinner,
                   실패 -> Message, 버튼 -> Button

  왜 여기서 load()를 부르나:
  - 날씨는 어느 화면에 있든 필요해서(하늘 배경까지 그 값을 본다) App.vue가 부른다.
    환율은 이 화면에서만 쓴다. 상세 화면의 예보와 같은 이유로, 들어왔을 때만 받아온다.
  - 스토어가 응답이 알려준 다음 갱신 시각까지 캐시하므로 화면을 오가도 재요청되지 않는다.
-->
<script setup>
import { computed, onMounted } from 'vue'

import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import { DISPLAY_BASE_CODE } from '@/data/currencies'
import { useExchangeStore } from '@/stores/exchange'
import { formatDateTime } from '@/utils/time'

const exchangeStore = useExchangeStore()

/*
  숫자 서식은 Intl에 맡긴다. 직접 3자리마다 콤마를 찍는 코드를 두면
  소수점 자리수 처리까지 같이 떠안게 된다.

  소수점 두 자리로 고정한 이유:
  - 자리수가 행마다 다르면 오른쪽 정렬을 해도 소수점 위치가 어긋나 표가 흔들린다.
  - 1,889.71원(파운드)부터 5.34원(100동)까지 폭이 큰데, 두 자리면 양쪽 다 읽을 만하다.
*/
const krwFormatter = new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// 표시에 필요한 문자열을 미리 만들어 둔다. (템플릿에서 함수를 여러 번 부르지 않도록)
const displayRates = computed(() =>
  exchangeStore.rates.map((rate) => ({
    ...rate,
    // 고시 단위가 1이 아니면 "JPY 100" 처럼 단위를 함께 적어야 금액을 오해하지 않는다.
    unitLabel: rate.unit === 1 ? rate.code : `${rate.code} ${rate.unit}`,
    // 응답에 없는 통화 코드였다면 null이 온다. 0.00원으로 그리면 진짜 값처럼 보인다.
    krwText: rate.krw === null ? '—' : krwFormatter.format(rate.krw),
    isBase: rate.code === DISPLAY_BASE_CODE,
  })),
)

// "2026년 8월 22일 09:02 기준" — 값이 언제 것인지 안 보이면 실시간 시세로 오해한다.
const updatedText = computed(() =>
  exchangeStore.updatedAt === 0 ? '' : formatDateTime(exchangeStore.updatedAt),
)

const nextUpdateText = computed(() =>
  exchangeStore.nextUpdateAt === 0 ? '' : formatDateTime(exchangeStore.nextUpdateAt),
)

// 캐시를 무시하고 다시 받아온다. 값은 하루에 한 번만 바뀌므로 주로 실패 후 재시도용.
const refresh = () => {
  exchangeStore.load(true)
}

onMounted(() => {
  exchangeStore.load()
})
</script>

<template>
  <div class="exchange-view">
    <BaseDashboardCard title="💱 오늘의 환율">
      <p class="exchange-guide">
        외화를 원화(KRW)로 환산한 금액입니다. 국내 은행 고시 관례에 따라 엔·동은 100단위로
        표시합니다.
      </p>

      <!-- 호출이 실패했을 때. 무엇이 문제인지 알려주고 다시 시도할 길을 준다. -->
      <Message severity="error" :closable="false" v-if="exchangeStore.error">
        <div class="state-error">
          <span>{{ exchangeStore.error }}</span>
          <Button label="다시 시도" severity="danger" size="small" @click="refresh" />
        </div>
      </Message>

      <!-- 첫 응답을 기다리는 중. 이미 받아둔 값이 있으면 그대로 두고 갱신만 한다. -->
      <div class="state-box" v-else-if="exchangeStore.isLoading && !exchangeStore.isLoaded">
        <ProgressSpinner class="state-spinner" stroke-width="4" />
        <span>환율 정보를 불러오는 중…</span>
      </div>

      <!--
        표가 아니라 목록(ul)으로 그린다.
        열이 셋뿐이고 머리글이 따로 필요 없어서, table을 쓰면 좁은 화면에서
        칸 너비만 어긋나고 얻는 게 없다.
      -->
      <ul class="rate-list" v-else>
        <li
          class="rate-item"
          :class="{ 'rate-item-base': rate.isBase }"
          v-for="rate in displayRates"
          :key="rate.code"
        >
          <span class="rate-flag">{{ rate.flag }}</span>

          <span class="rate-name">
            <span class="rate-country">{{ rate.country }}</span>
            <span class="rate-unit">{{ rate.unitLabel }} · {{ rate.name }}</span>
          </span>

          <!--
            기준 통화(원화)는 1.00원이 나온다. 값이 아니라 기준이라는 표시를 붙인다.
            PrimeVue Tag 를 쓰지 않은 이유는 아래 스타일 주석에 적어두었다.
          -->
          <span class="rate-base-mark" v-if="rate.isBase">기준</span>

          <span class="rate-krw">
            {{ rate.krwText }}
            <small>원</small>
          </span>
        </li>
      </ul>

      <!-- 카드 하단: 출처·고시 시각과 수동 갱신 -->
      <template #footer>
        <div class="footer-row">
          <span class="source-note">
            ExchangeRate-API
            <template v-if="updatedText"> · {{ updatedText }} 고시</template>
            <br v-if="nextUpdateText" />
            <template v-if="nextUpdateText">다음 갱신 {{ nextUpdateText }}</template>
          </span>
          <Button
            :label="exchangeStore.isLoading ? '갱신 중…' : '새로고침'"
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            outlined
            :loading="exchangeStore.isLoading"
            @click="refresh"
          />
        </div>
      </template>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
.exchange-guide {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--p-surface-500);
}

.rate-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/*
  환율 한 줄 = 유리 3층. 예보 칸(.forecast-item)과 같은 재질로 맞춘다.
  블러는 걸지 않는다. 껍데기가 이미 뒤를 흐려놨고, 여기서 또 흐리면 색이 죽는다.
*/
.rate-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--glass-border-soft);
  border-radius: var(--glass-radius-sm);
  background: var(--glass-inset);
  transition:
    background 200ms ease,
    border-color 200ms ease;
}

.rate-item:hover {
  background: var(--glass-panel);
  border-color: var(--glass-border);
}

/* 기준 통화 줄만 한 단계 진하게. 표를 어디서부터 읽어야 하는지 먼저 눈에 들어온다. */
.rate-item-base {
  background: var(--glass-panel);
  border-color: var(--glass-border);
}

/*
  국기 자리.

  이모지를 그대로 두지 않고 칸을 만들어 감싼 이유:
  윈도우는 국기 이모지를 지원하지 않는다. Segoe UI Emoji 에 국기 글리프가 없어서
  🇰🇷 가 "KR" 이라는 두 글자로 떨어진다. (troubleshooting.md 24)
  맨몸으로 두면 이 두 글자가 국가 이름 옆에 어정쩡하게 붙어 깨진 것처럼 보인다.
  고정 폭 칸에 넣어두면 맥에서는 국기가, 윈도우에서는 국가 코드가 들어가서
  어느 쪽이든 "나라 표시 칸"으로 읽힌다.
*/
.rate-flag {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--glass-border-soft);
  background: var(--glass-panel);
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.5px;
  color: var(--p-surface-600);
}

.rate-name {
  display: flex;
  flex-direction: column;
  gap: 1px;
  /* 남는 폭을 이름 쪽이 가져가야 금액이 오른쪽 끝에 붙는다 */
  flex: 1;
  min-width: 0;
}

.rate-country {
  font-size: 14px;
  font-weight: 600;
  color: var(--p-surface-800);
}

.rate-unit {
  font-size: 11px;
  color: var(--p-surface-500);
  letter-spacing: 0.2px;
}

/*
  기준 표시.

  PrimeVue Tag(severity="info")로 뒀더니 밤하늘에서 혼자 튀었다.
  Aura 의 Tag 는 surface 램프가 아니라 고정된 blue 팔레트를 쓴다.
  하늘이 바뀌어도 색이 그대로라, 밤에는 어두운 유리 위에 밝은 파란 판 하나만
  형광펜처럼 남는다. 목록에서 가장 덜 중요한 줄이 가장 눈에 띄는 셈이다.
  About 화면의 <code> 와 같은 방법으로, 하늘 따라 밝기가 뒤집히는 --accent-info 를
  옅게 깔아 유리 위에 얹는다.
*/
.rate-base-mark {
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent-info) 18%, transparent);
  font-size: 10px;
  font-weight: 600;
  color: var(--accent-info);
  white-space: nowrap;
}

.rate-krw {
  font-size: 15px;
  font-weight: 700;
  color: var(--p-surface-800);
  white-space: nowrap;
  /*
    숫자 폭을 고정한다.
    비례 폭 글꼴은 1과 8의 너비가 달라서, 오른쪽 정렬을 해도 행마다
    소수점 위치가 미세하게 흔들린다. 열 하나가 전부 숫자일 때 특히 티가 난다.
  */
  font-variant-numeric: tabular-nums;
}

.rate-krw small {
  margin-left: 1px;
  font-size: 11px;
  font-weight: 500;
  color: var(--p-surface-500);
}

/* 로딩 표시: 홈 화면과 같은 모양으로 맞춘다 */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px;
  font-size: 14px;
  color: var(--p-surface-500);
}

.state-spinner {
  width: 34px;
  height: 34px;
}

.state-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.source-note {
  font-size: 12px;
  line-height: 1.5;
  color: var(--p-surface-400);
}
</style>
