<script setup>
// 반응형 데이터는 부모(WeatherParent)가 가짐.
// 여기서는 전달받은 검색어를 props하고, 입력이 바뀌면 부모에게 emits.
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
    <input
      id="city-search-input"
      type="text"
      :value="findCity"
      @input="sendText"
      placeholder="검색할 도시 이름 입력"
    />
    <p class="search-status" v-if="isCity">
      검색 중인 도시: <strong>{{ keyword }}</strong>
    </p>
    <p class="search-status search-status-empty" v-else-if="keyword">
      검색어와 일치하는 도시가 없습니다
    </p>
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

input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  font-size: 14px;
  color: #2c3e50;
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 4px;
  outline: none;
}

input::placeholder {
  color: #adb5bd;
}

input:focus {
  border-color: #74b0f4;
  box-shadow: 0 0 0 2px rgba(116, 176, 244, 0.25);
}

.search-status {
  margin: 10px 0 0;
  font-size: 13px;
  color: #6c757d;
}

.search-status strong {
  color: #2c3e50;
}

.search-status-empty {
  color: #d9534f;
}
</style>
