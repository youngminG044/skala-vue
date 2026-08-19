<script setup>
import { ref } from 'vue'

const findCity = ref('')
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
    <p class="search-status">
      검색 중인 도시: <strong>{{ findCity }}</strong>
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
</style>
