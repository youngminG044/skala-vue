/*
  router/index.js
  - 라우트 규칙(routes 배열) 정의와 Lazy Loading 설정.
  - 모든 페이지 컴포넌트를 () => import(...) 형태의 동적 import로 등록해서,
    첫 진입 시 전부 내려받지 않고 해당 경로에 들어갈 때 청크를 받아온다.

  meta.showsTemperature
  - 그 화면이 기온을 표시하는지 여부. App.vue가 이 값을 보고 단위 설정(°C/°F)을
    띄울지 정한다.
  - 화면 목록을 App.vue에 또 적어두지 않으려고 라우터에 뒀다.
    라우트를 새로 추가하는 사람은 이 파일을 열게 되어 있고, 그 자리에서
    "이 화면은 기온을 보여주는가"를 한 번 답하면 내비게이션이 알아서 따라온다.
    App.vue에 경로 이름 배열을 두면 새 화면을 만들 때마다 그 배열을 찾아가야 한다.
*/
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'weather-home',
      meta: { showsTemperature: true },
      // 지연 로딩: 이 경로로 들어갈 때 비로소 파일을 받아온다.
      component: () => import('@/views/WeatherHomeView.vue'),
    },
    {
      // :cityId 는 동적 세그먼트. /weather/city_01 로 들어오면
      // 화면에서 route.params.cityId === 'city_01' 로 읽을 수 있다.
      path: '/weather/:cityId',
      name: 'weather-detail',
      meta: { showsTemperature: true },
      component: () => import('@/views/WeatherDetailView.vue'),
    },
    {
      path: '/favorites',
      name: 'weather-favorite',
      meta: { showsTemperature: true },
      component: () => import('@/views/WeatherFavoriteView.vue'),
    },
    {
      // /about · /exchange · 404 에는 meta.showsTemperature 를 주지 않는다.
      // 기온이 한 줄도 없는 화면이라 단위 설정이 떠 있어도 누를 이유가 없다.
      path: '/about',
      name: 'weather-about',
      component: () => import('@/views/WeatherAboutView.vue'),
    },
    {
      // 환율 화면. 날씨와 무관한 별도 기능이라 대시보드 아래가 아니라 최상위 경로에 둔다.
      path: '/exchange',
      name: 'exchange-rate',
      component: () => import('@/views/ExchangeRateView.vue'),
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
