/*
  router/index.js
  - 라우트 규칙(routes 배열) 정의와 Lazy Loading 설정.
  - 모든 페이지 컴포넌트를 () => import(...) 형태의 동적 import로 등록해서,
    첫 진입 시 전부 내려받지 않고 해당 경로에 들어갈 때 청크를 받아온다.
*/
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'weather-home',
      // 지연 로딩: 이 경로로 들어갈 때 비로소 파일을 받아온다.
      component: () => import('@/views/WeatherHomeView.vue'),
    },
    {
      // :cityId 는 동적 세그먼트. /weather/city_01 로 들어오면
      // 화면에서 route.params.cityId === 'city_01' 로 읽을 수 있다.
      path: '/weather/:cityId',
      name: 'weather-detail',
      component: () => import('@/views/WeatherDetailView.vue'),
    },
    {
      path: '/favorites',
      name: 'weather-favorite',
      component: () => import('@/views/WeatherFavoriteView.vue'),
    },
    {
      path: '/about',
      name: 'weather-about',
      component: () => import('@/views/WeatherAboutView.vue'),
    },
    {
      // Catch-all Route: 위에서 하나도 안 걸린 주소를 전부 잡는다.
      // 반드시 배열의 마지막에 둬야 다른 경로를 가로채지 않는다.
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

export default router
