<!--
  SearchBar.vue
  - 도시 검색 입력창. 반응형 데이터는 부모(WeatherHomeView)가 가진다.
    여기서는 전달받은 검색어를 props로 표시하고, 입력이 바뀌면 부모에게 emit.

  - PrimeVue 적용
      입력창          -> InputText (+ IconField / InputIcon 으로 돋보기)
      결과 없음 안내  -> Message
-->
<script setup>
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'

defineProps({
  findCity: {
    type: String,
    required: true,
  },
  keyword: {
    type: String,
    required: true,
  },
  isCity: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update-query'])

const sendText = (e) => {
  emit('update-query', e.target.value)
}
</script>

<template>
  <div class="search-section">
    <label class="sr-only" for="city-search-input">도시 이름</label>

    <!-- IconField는 입력창 안쪽에 아이콘을 넣기 위한 껍데기다 -->
    <IconField>
      <InputIcon class="pi pi-search" />
      <InputText
        id="city-search-input"
        class="search-input"
        :value="findCity"
        placeholder="검색할 도시 이름 입력"
        @input="sendText"
      />
    </IconField>

    <p class="search-status" v-if="isCity">
      검색 중인 도시: <strong>{{ keyword }}</strong>
    </p>

    <!-- 결과가 없을 때만. severity="warn"이라 노란 계열로 눈에 띈다 -->
    <Message v-else-if="keyword" severity="warn" size="small" variant="simple" class="search-empty">
      검색어와 일치하는 도시가 없습니다
    </Message>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* IconField/InputText는 기본이 inline이라 카드 폭을 채우도록 편다 */
.search-section :deep(.p-iconfield) {
  display: block;
}

.search-input {
  width: 100%;
}

.search-status {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--p-surface-500);
}

.search-status strong {
  color: var(--p-surface-800);
}

.search-empty {
  margin-top: 10px;
}
</style>
