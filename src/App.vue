<script setup>
import { ref } from 'vue'
import Search from './components/CitySearch.vue'
import City from './components/CityList.vue'

const weatherList = ref([
  { id: 'city_01', name: '서울특별시', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원시', temp: 24, status: '비' },
  { id: 'city_03', name: '부산광역시', temp: 26, status: '구름' },
  { id: 'city_04', name: '광주광역시', temp: 30, status: '흐림' },
])
</script>

<template>
  <div class="container">
    <h1>🌤️ 날씨 대시보드</h1>
    <hr />
    <Search :weather-list="weatherList" />
    <City :weather-list="weatherList" />
  </div>
</template>

<style scoped>
.container {
  max-width: 560px;
  margin: 40px auto;
  padding: 24px 28px;
  background-color: #fff;
  border: 1px solid #dce8f0;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

h1 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  margin: 0 0 12px;
}

hr {
  border: none;
  border-top: 1px solid #e5e5e5;
  margin: 0 0 16px;
}
</style>
