<!--
  WeatherCard.vue
  - 도시 "한 개"의 날씨를 보여주는 카드 컴포넌트.
  - 선택된 도시 객체를 props로 받아 표시만 하고, 목록 반복(v-for)은 부모가 담당.
  - 예외: 즐겨찾기는 여러 화면이 함께 보는 상태라 부모를 거치지 않고
    Pinia 스토어를 직접 읽고 쓴다. (부모마다 같은 배선을 반복하지 않기 위해)

  - PrimeVue 적용
      즐겨찾기 / 상세보기  -> Button
      더움 / 선선함        -> Tag
-->
<script setup>
import { computed } from 'vue'

import Button from 'primevue/button'
import Tag from 'primevue/tag'

import { useFavoriteStore } from '@/stores/favorites'
import { useConfigStore } from '@/stores/configStore'
import { useNotice } from '@/composables/useNotice'

const props = defineProps({
  // 화면에 그릴 도시 하나. { id, name, temp, status, icon, ... } 형태의 객체
  city: {
    type: Object,
    required: true,
  },
})

// 선택/상세보기 상태는 부모(뷰)가 관리하므로 이벤트만 올려보냄.
// select-card: 카드 클릭 / click-detail: 상세보기 버튼 클릭
const emit = defineEmits(['select-card', 'click-detail'])

const favoriteStore = useFavoriteStore()
const configStore = useConfigStore()
const { notify } = useNotice()

// "더움/선선함"을 가르는 기준. 원본 데이터가 섭씨라 판단도 섭씨 원본으로 한다.
// (표시 단위를 바꿔도 더움/선선함 분류는 달라지면 안 되므로)
const HOT_CELSIUS = 28

const isHot = computed(() => props.city.temp >= HOT_CELSIUS)

// 즐겨찾기를 토글하고 결과를 안내 문구로 알린다.
// 담았는지 뺐는지는 스토어가 돌려주는 값으로 판단한다.
// 여기서 다시 isFavorite()을 부르면 이미 바뀐 뒤라 반대로 나온다.
const toggleFavorite = () => {
  const added = favoriteStore.toggleFavorite(props.city.id)
  notify(added ? '⭐ 즐겨찾기에 추가되었습니다.' : '☆ 즐겨찾기에서 제외되었습니다.')
}

// 화면에 표시할 기온. 단위 설정이 바뀌면 자동으로 다시 계산된다.
const displayTemp = computed(() => configStore.convertTemp(props.city.temp))
</script>

<template>
  <!-- 카드 영역 클릭 -> 어떤 도시가 눌렸는지 객체째로 부모에게 전달 -->
  <div class="city">
    <div class="city-info" @click="emit('select-card', city)">
      <div class="city-text">
        <!-- {{ }} 안의 값이 바뀌면 해당 부분만 자동으로 다시 그려짐 -->
        <p class="city-name">{{ city.icon }} {{ city.name }} ({{ city.status }})</p>
        <p class="city-temp">현재 기온: {{ displayTemp }}{{ configStore.unitSymbol }}</p>

        <!-- 기온에 따라 둘 중 하나의 뱃지만 렌더링. 판단은 섭씨 원본으로. -->
        <Tag
          :value="isHot ? '🔥 더움' : '❄️ 선선함'"
          :severity="isHot ? 'danger' : 'info'"
          rounded
        />
      </div>

      <!--
        .stop = event.stopPropagation()
        버튼 클릭이 바깥 .city-info의 click까지 번지지 않도록 막음.
      -->
      <div class="city-actions" @click.stop>
        <Button
          :icon="favoriteStore.isFavorite(city.id) ? 'pi pi-star-fill' : 'pi pi-star'"
          :aria-label="favoriteStore.isFavorite(city.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'"
          :severity="favoriteStore.isFavorite(city.id) ? 'warn' : 'secondary'"
          size="small"
          outlined
          @click="toggleFavorite"
        />

        <Button
          label="상세보기"
          severity="secondary"
          size="small"
          outlined
          @click="emit('click-detail', city)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  유리 3층. 가장 옅다.

  이 카드는 목록에서 20장이 한 번에 그려지고 스크롤도 된다.
  블러를 걸면 스크롤 프레임마다 20번 다시 계산되므로 절대 걸지 않는다.
  대신 hover 에서만 한 단계 밝아지게 해서 눌리는 요소라는 것을 알린다.
*/
.city {
  background: var(--glass-inset);
  border: 1px solid var(--glass-border-soft);
  border-radius: var(--glass-radius-sm);
  padding: 14px 16px;
  margin-bottom: 10px;
  /* transform 과 background 만 움직여 레이아웃 재계산이 일어나지 않게 한다 */
  transition:
    background 200ms ease,
    border-color 200ms ease,
    transform 200ms ease;
}

.city:hover {
  background: var(--glass-panel);
  border-color: var(--glass-border);
  transform: translateY(-1px);
}

.city:last-child {
  margin-bottom: 0;
}

@media (prefers-reduced-motion: reduce) {
  .city {
    transition: none;
  }
  .city:hover {
    transform: none;
  }
}

.city-info {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
}

.city-text {
  min-width: 0;
}

.city-name {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 500;
  color: var(--p-surface-800);
}

.city-temp {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--p-surface-600);
}

.city-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
}
</style>
