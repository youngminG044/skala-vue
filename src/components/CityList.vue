<!--
  CityList.vue
  - 지역별 날씨 목록. 목록을 받아 카드로 그려주기만 하는 자식 컴포넌트.
  - 클릭이 일어나면 직접 상태를 바꾸지 않고 이벤트만 부모에게 올려보냄.
-->
<script setup>
defineProps({
  // 화면에 그릴 날씨 목록. { id, name, temp, status } 객체의 배열
  weatherList: {
    type: Array,
    required: true,
  },
})

// 선택/상세보기 상태는 부모(WeatherParent)가 관리하므로 이벤트만 올려보냄.
// select: 카드 클릭 / detail: 상세보기 버튼 클릭
const emit = defineEmits(['select', 'detail'])
</script>

<template>
  <div class="list-section">
    <!-- v-for로 배열을 순회해 도시 카드를 반복 생성. :key로 각 항목을 구분.-->
    <div class="city" v-for="city in weatherList" :key="city.id">
      <!-- 카드 영역 클릭 -> 어떤 도시가 눌렸는지 객체째로 부모에게 전달 -->
      <div class="city-info" @click="emit('select', city)">
        <div class="city-text">
          <!-- {{ }} 안의 값이 바뀌면 해당 부분만 자동으로 다시 그려짐 -->
          <p class="city-name">{{ city.name }} ({{ city.status }})</p>
          <p class="city-temp">현재 기온: {{ city.temp }}°C</p>

          <!-- 기온에 따라 둘 중 하나의 뱃지만 렌더링 -->
          <span class="badge badge-hot" v-if="city.temp >= 28">🔥 더움 (28도 이상)</span>
          <span class="badge badge-cool" v-else>❄️ 선선함 (28도 미만)</span>
        </div>

        <!--
          .stop = event.stopPropagation()
          버튼 클릭이 바깥 .city-info의 click까지 번지지 않도록 막음.
        -->
        <button class="detail-btn" type="button" @click.stop="emit('detail', city)">
          상세보기
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.city {
  background-color: #fff;
  border: 1px solid #e6eaed;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 10px;
}

.city:last-child {
  margin-bottom: 0;
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
  color: #2c3e50;
}

.city-temp {
  margin: 0 0 10px;
  font-size: 14px;
  color: #46586b;
}

.badge {
  display: inline-block;
  padding: 5px 11px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
}

.badge-hot {
  background-color: #fa5a5a;
}

.badge-cool {
  background-color: #4d94f0;
}

.detail-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 13px;
  color: #495057;
  background-color: #f1f3f5;
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: pointer;
}

.detail-btn:hover {
  background-color: #e9ecef;
}
</style>
