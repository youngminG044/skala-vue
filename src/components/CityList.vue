<script setup>
import { ref } from 'vue'

const cityStatus = ref(false)
const selectCity = ref('')
const weatherList = ref([
  { id: 'city_01', name: '서울특별시', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원시', temp: 24, status: '비' },
  { id: 'city_03', name: '부산광역시', temp: 26, status: '구름' },
  { id: 'city_04', name: '광주광역시', temp: 30, status: '흐림'},
])
const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <div class="list-section">
    <h2>🏙️ 지역 별 날씨 현황</h2>
    <div class="city" v-for="city in weatherList" :key="city.id">
      <div class="city-info" @click="((cityStatus = true), (selectCity = city.name))">
        <div class="city-text">
          <p class="city-name">{{ city.name }} ({{ city.status }})</p>
          <p class="city-temp">현재 기온: {{ city.temp }}°C</p>
          <span class="badge badge-hot" v-if="city.temp >= 28">🔥 더움 (28도 이상)</span>
          <span class="badge badge-cool" v-else>❄️ 선선함 (28도 미만)</span>
        </div>
        <button class="detail-btn" type="button" @click.stop="showDetail(city.name, city.status)">
          상세보기
        </button>
      </div>
    </div>
  </div>
  <div class="footer-message">
    <p v-if="cityStatus == false">카드를 클릭하거나 검색해 보세요.</p>
    <p v-else>{{ selectCity }}이(가) 선택되었습니다.</p>
  </div>
</template>

<style scoped>
.list-section {
  background-color: #eef5f9;
  border-radius: 10px;
  padding: 16px;
}

.list-section h2 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  margin: 0 0 12px;
}

.city {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.city:last-child {
  margin-bottom: 0;
}

.city-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.city-name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.city-temp {
  margin: 4px 0 8px;
  font-size: 13px;
  color: #555;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.badge-hot {
  background-color: #e2574c;
}

.badge-cool {
  background-color: #4a90d9;
}

.detail-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.detail-btn:hover {
  background-color: #e9e9e9;
}

.footer-message {
  margin-top: 16px;
  padding: 12px;
  background-color: #e5f6ea;
  color: #1f7a3f;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}
</style>
