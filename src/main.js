import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import './assets/theme.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

/*
  PrimeVue (UI Library) 설정

  theme.preset: 컴포넌트 전체의 색/모서리/여백을 결정하는 디자인 토큰 묶음.
    Aura는 PrimeVue의 기본 프리셋으로, 둥근 모서리와 부드러운 그림자가
    기존 대시보드 카드 느낌과 가장 가깝다.

  darkModeSelector: 기본값은 'system'이라 OS가 다크 모드면 앱도 따라 어두워진다.
    이 앱은 밝은 화면 하나만 맞춰 만들었으므로(직접 지정한 색이 곳곳에 있다)
    OS 설정과 무관하게 항상 라이트로 고정한다.
    없는 클래스 이름을 주면 그 조건이 절대 참이 되지 않아 다크가 켜지지 않는다.
*/
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.app-force-light-mode',
    },
  },
})

// Toast 컴포넌트가 useToast()로 문구를 받으려면 이 서비스가 등록되어 있어야 한다.
app.use(ToastService)

app.mount('#app')
