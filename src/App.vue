<script setup>
import Search from './components/CitySearch.vue'
import City from './components/CityList.vue'
</script>

<template>
  <div class="container">
    <h1>🌤️ 과제 1: 날씨 (Mockup)</h1>
    <hr />
    <Search />
    <City />
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
