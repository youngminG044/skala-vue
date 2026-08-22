import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,

  /*
    프로젝트 커스텀 규칙.

    맨 뒤에 둔다. 앞의 buildFromOxlintConfigFile 은 oxlint 가 이미 보는 규칙을
    ESLint 쪽에서 꺼서 중복 보고를 막는데, 지금 .oxlintrc.json 은 correctness 만
    켜고 있어서 eqeqeq(pedantic) 과 no-console(restriction) 은 끄지 않는다. (확인함)

    그래도 맨 뒤가 맞다. 나중에 .oxlintrc.json 에 카테고리를 하나 더 켜는 순간
    이 두 줄이 조용히 무효가 되고 "규칙을 넣었는데 안 잡힌다"로 돌아온다.
    순서로 막아두면 그때도 이 블록이 이긴다.
  */
  {
    name: 'app/custom-rules',
    rules: {
      // == 를 금지하고 === 만 허용한다.
      // '1' == 1 이 true 가 되는 암묵적 형변환은 읽는 사람이 예측하기 어렵다.
      eqeqeq: ['error', 'always'],

      // console.log 를 허용한다. 개발 중 확인 용도로 막지 않는다.
      'no-console': 'off',
    },
  },
])
