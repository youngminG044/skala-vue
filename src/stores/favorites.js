/*
  favorites.js
  - 즐겨찾기한 도시 id 목록을 앱 전체가 공유하는 Pinia 스토어.
  - 카드(WeatherCard)에서 토글하고 즐겨찾기 페이지에서 읽으므로,
    한 컴포넌트가 가질 수 없는 "여러 화면이 함께 보는 상태"라 스토어로 뺐다.
  - 새로고침해도 유지되도록 localStorage에 저장한다.
*/
import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'weather-favorites'

// localStorage 값이 깨져 있어도 앱이 죽지 않도록 방어적으로 읽는다.
const loadIds = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export const useFavoriteStore = defineStore('favorites', () => {
  const favoriteIds = ref(loadIds())

  // 즐겨찾기 개수 -> 내비게이션 바 뱃지에 사용
  const favoriteCount = computed(() => favoriteIds.value.length)

  // 카드가 별 아이콘 모양을 결정할 때 호출
  const isFavorite = (cityId) => favoriteIds.value.includes(cityId)

  /*
    이미 있으면 빼고 없으면 넣는다.
    "넣었는지 뺐는지"를 돌려주는 이유:
    호출부가 그 결과로 안내 문구를 고른다. 호출부에서 다시 isFavorite()을 부르면
    이미 바뀐 뒤라 반대로 판단하게 되고, 토글 전에 미리 읽어두는 것도 잊기 쉽다.
    상태를 바꾼 쪽이 결과를 알려주는 편이 안전하다.
    (문구를 여기서 직접 띄우지 않는 이유는, 스토어가 화면 표시까지 떠맡으면
     즐겨찾기라는 본래 책임에서 벗어나기 때문)
  */
  const toggleFavorite = (cityId) => {
    if (isFavorite(cityId)) {
      favoriteIds.value = favoriteIds.value.filter((id) => id !== cityId)
      return false // 제외됨
    }
    favoriteIds.value = [...favoriteIds.value, cityId]
    return true // 추가됨
  }

  // 목록이 바뀔 때마다 자동 저장. 배열 자체를 교체하므로 deep 옵션은 불필요.
  watch(favoriteIds, (ids) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  })

  return { favoriteIds, favoriteCount, isFavorite, toggleFavorite }
})
