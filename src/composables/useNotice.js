/*
  useNotice.js
  - 화면 우측 하단 안내 문구를 띄우는 얇은 래퍼.

  PrimeVue의 useToast()를 그대로 써도 되지만, 그러면 호출하는 세 곳
  (단위 변경 / 카드의 즐겨찾기 / 상세의 즐겨찾기)이 각자
  severity와 life를 적어야 하고, 한 곳만 값이 달라도 티가 나지 않는다.
  "이 앱의 안내 문구는 이렇게 뜬다"를 한 곳에 모아둔다.
*/
import { useToast } from 'primevue/usetoast'

// 문구가 화면에 머무는 시간
const LIFE = 2500

export const useNotice = () => {
  const toast = useToast()

  /**
   * @param {string} text 표시할 문구. 앞에 이모지를 붙여 무엇이 바뀌었는지 눈으로 먼저 구분되게 한다.
   */
  const notify = (text) => {
    /*
      PrimeVue Toast는 기본적으로 문구를 세로로 쌓는다.
      이 앱의 안내 상자는 높이가 150px이라 두세 개만 쌓여도 화면을 크게 가린다.
      게다가 단위 변경과 즐겨찾기를 잇달아 누르면 방금 한 동작이 아래로 밀려
      무엇이 최신인지도 헷갈린다. 이전 문구를 치우고 최신 것만 남긴다.
    */
    toast.removeAllGroups()
    toast.add({ severity: 'success', summary: text, life: LIFE })
  }

  return { notify }
}
