<!--
  StatusFormatDialog.vue
  - 대시보드 상태의 표시 형식을 고르는 라디오 목록 다이얼로그.
  - 열림/닫힘은 부모가 v-model로 관리하고, 이 컴포넌트는 표시와 선택만 담당한다.

  - PrimeVue 적용
      네이티브 <dialog>  -> Dialog (modal)
      라디오             -> RadioButton
      확인 버튼          -> Button

    직접 만들었을 때는 showModal() 호출과 ESC 처리를 watch로 붙여야 했는데,
    Dialog는 :visible 하나로 열고 닫히며 ESC와 포커스 가둠을 스스로 처리한다.
-->
<script setup>
import { ref, watch } from 'vue'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'

import { STATUS_FORMATS } from '@/data/statusFormats'
import { useConfigStore } from '@/stores/configStore'

const props = defineProps({
  // 다이얼로그 열림 여부
  open: {
    type: Boolean,
    required: true,
  },
  // 각 형식이 지금 도시 기준으로 어떻게 보이는지 미리 보여주기 위한 값 묶음
  previewContext: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:open'])

const configStore = useConfigStore()

// 라디오로 고르는 동안의 임시 선택값. "확인"을 눌러야 스토어에 반영된다.
const draftFormat = ref(configStore.statusFormat)

// 열릴 때마다 현재 설정에서 시작한다. (지난번에 고르다 만 값이 남지 않도록)
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) draftFormat.value = configStore.statusFormat
  },
)

const close = () => emit('update:open', false)

const confirm = () => {
  configStore.setStatusFormat(draftFormat.value)
  close()
}
</script>

<template>
  <!--
    :visible 과 @update:visible 로 부모의 open 상태와 연결한다.
    ESC나 바깥 클릭으로 닫혀도 이 이벤트가 오므로 부모 상태가 어긋나지 않는다.
  -->
  <Dialog
    :visible="open"
    modal
    header="대시보드 상태"
    class="format-dialog"
    @update:visible="close"
  >
    <div class="dialog-body">
      <label class="format-row" v-for="format in STATUS_FORMATS" :key="format.id">
        <RadioButton v-model="draftFormat" :value="format.id" name="status-format" />
        <span class="format-text">
          <span class="format-label">{{ format.label }}</span>
          <!-- 지금 선택된 도시 기준으로 실제 어떻게 보이는지 -->
          <span class="format-preview">{{ format.render(previewContext) }}</span>
        </span>
      </label>
    </div>

    <template #footer>
      <Button label="확인" class="dialog-confirm" @click="confirm" />
    </template>
  </Dialog>
</template>

<style scoped>
.format-dialog {
  width: min(380px, calc(100vw - 32px));
}

.dialog-body {
  max-height: 52vh;
  overflow-y: auto;
}

.format-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--p-surface-200);
  cursor: pointer;
}

.format-row:last-child {
  border-bottom: none;
}

.format-text {
  min-width: 0;
}

.format-label {
  display: block;
  font-size: 14px;
  line-height: 1.45;
}

.format-preview {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  color: var(--p-surface-500);
}

/* 확인 버튼은 다이얼로그 폭을 채워 누르기 쉽게 */
.dialog-confirm {
  width: 100%;
}
</style>
