---
public: true
---

# 前端測試指南 - 策略與實踐 (Chapter 5 - 視覺測試)

# Chapter 5 視覺測試

## 5-1 視覺測試

### Cypress Installation & Configuration

- 建立 Vite 專案, 安裝 `cypress`

```bash
npm create vite@latest
pnpm add -D cypress
```

- 新增 `cypress` 指令並且執行

```json
"scripts": {
  // ...
  "cy:open": "cypress open",
},
```

![clipboard.png](/src/assets/SkY2CRH--clipboard.png)

會出現這個問題, 請把 `cypress.config.ts` -> `cypress.config.js`, 或是繼續維持 `ts`, 但是需要針對 TS 的部分做額外配置, 詳情可以參考這個 issue [cypress-issue/23552](https://github.com/cypress-io/cypress/issues/23552)

---

### Percy (https://percy.io/)

Percy 是一套自動化的「視覺回歸測試工具」，可以幫助你在開發或部署過程中，自動截圖比對網頁或元件的畫面，確保 UI 沒有意外變化（像是顏色、字型、排版等視覺差異）。

它常與 Cypress、Playwright、Selenium、Storybook 等工具整合使用，並支援與 CI/CD（例如 GitHub Actions）串接，讓設計和工程團隊能快速發現、審核並追蹤畫面上的變更。

#### Percy vs 其他視覺回歸測試工具比較 (`ChatGPT`)

| 工具           | 優點                                                                                            | 缺點                                                 |
| -------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Percy**      | ✅ 易於整合（支援 Cypress、Playwright、Selenium）<br>✅ Percy UI 清楚<br>✅ 可與 CI/CD 整合良好 | ❌ 免費快照數量有限（5,000/月）<br>❌ 商業版價格偏高 |
| **Chromatic**  | ✅ 專為 Storybook 打造<br>✅ 非常適合 component 層級測試                                        | ❌ 僅支援 Storybook，不適合整頁 E2E 視覺測試         |
| **Applitools** | ✅ AI 智能比對、抗小變動干擾能力強<br>✅ 支援多平台                                             | ❌ 費用高<br>❌ 學習曲線稍高                         |
| **Loki**       | ✅ 開源、輕量<br>✅ 可自訂 CI/CD 整合方式                                                       | ❌ 功能簡單、社群不大<br>❌ 缺乏視覺化儀表板         |

#### Installation & Configuration

安裝 `@percy/cli` + `@percy/cypress`

```bash
pnpm add @percy/cli -D
pnpm add -D @percy/cypress
```

由於 視覺測試 他是截圖上傳到 percy 專案內, 所以需要登入官網建立 project, 把對應 project 的 token 註記在環境中

![clipboard.png](/src/assets/WWXrPNym-clipboard.png)

![clipboard.png](/src/assets/HGqIegvE-clipboard.png)

關於 percy in Cypress 配置, 可以參考 [Integrate your Cypress tests with Percy](https://www.browserstack.com/docs/percy/integrate/cypress)

- 建立 `.env` 環境檔案

```bash
# .env
PERCY_TOKEN=web_d5ba0ca8e24422c41fb9ca18eb22cc89859326242a008838c141e4e534b7616a
```

- 配置 `percy` 指令

```json
"scripts": {
  // ...
  "cy:open": "cypress open",
  "cy:percy": "source .env && npx percy exec -- npx cypress run"
},
```

---

### 第一個視覺測試檔案

- 新增 `mixtini.cy.js`

```js
// cypress/e2e/mixtini.cy.js
describe("Index Page", () => {
  it("should update snapshot to Percy correctly", () => {
    cy.visit("https://mixtini-co.web.app/");
    cy.percySnapshot("index");
  });
});
```

> [!NOTE] > `cy.percySnapshot` 目前尚未被 cypress 引用, 所以透過 `/cypress/support/commands.ts` 進行 cypress 的全域註冊 plugin/擴充套件, 當然也可以在 要測試的檔案裡面直接 `import "@percy/cypress"`

```js
// cypress/support/commands.ts

/// <reference types="cypress" />
import "@percy/cypress";

// 或是

// cypress/e2e/mixtini.cy.ts
import "@percy/cypress";
describe("Index Page", () => {
  // ...
});
```

- 執行 `npm cy:open` / 執行 `npm cy:percy`

![clipboard.png](/src/assets/fstWfyH--clipboard.png)
![clipboard.png](/src/assets/BRR43DvO-clipboard.png)

![clipboard.png](/src/assets/FsQ1tU4q-clipboard.png)

此串網址就是執行 Percy build 後的網址, 可以看到內部有兩張圖

![clipboard.png](/src/assets/7ZbQc9x3-clipboard.png)

> [!NOTE]
> 如果是第一次執行, 只有一張, 我理圖片裡的並不是第一次, 再跑一次就好

點擊上放的 `</>` icon, 可以看到內部的比對內容, 實際上不應該有不一樣, 可能是網頁在渲染的過程
被 Percy 捕捉到差異顯示 `0.02% diff`
![clipboard.png](/src/assets/c6UQi4IR-clipboard.png)

快照比對原理：

---
