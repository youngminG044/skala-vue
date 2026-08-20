<script setup>
import { ref, computed, watchEffect } from 'vue'

const props = defineProps({
  weatherList: {
    type: Array,
    required: true,
  },
})

const findCity = ref('')

const keyword = computed(() => findCity.value.trim())

const filteredWeatherList = computed(() => {
  if (keyword.value === '') return []
  return props.weatherList.filter((city) => city.name.includes(keyword.value))
})
const isCity = computed(() => filteredWeatherList.value.length > 0)

watchEffect(() => {
  console.log(
    `[watchEffect 자동 호출] 현재 검색어 '${findCity.value}'에 매칭되는 API 데이터를 필터링 중...`,
  )
})
</script>

<template>
  <div class="search-section">
    <h2>🔍 도시 검색</h2>
    <label for="city-search-input">도시 이름</label>
    <input
      id="city-search-input"
      type="text"
      :value="findCity"
      @input="(e) => (findCity = e.target.value)"
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
.search-section {
  background-color: #eef5f9;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}

.search-section h2 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  margin: 0 0 12px;
}

.search-section input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}

.search-status {
  margin: 8px 0 0;
  font-size: 13px;
  color: #666;
}

.search-status-empty {
  color: #e2574c;
}
</style>
