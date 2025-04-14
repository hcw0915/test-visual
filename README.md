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

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/SkY2CRH--clipboard.png)

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

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/WWXrPNym-clipboard.png)

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/HGqIegvE-clipboard.png)

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

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/fstWfyH--clipboard.png)
![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/BRR43DvO-clipboard.png)

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/FsQ1tU4q-clipboard.png)

此串網址就是執行 Percy build 後的網址, 可以看到內部有兩張圖

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/7ZbQc9x3-clipboard.png)

> [!NOTE]
> 如果是第一次執行, 只有一張, 我理圖片裡的並不是第一次, 再跑一次就好

點擊上放的 `</>` icon, 可以看到內部的比對內容, 實際上不應該有不一樣, 可能是網頁在渲染的過程
被 Percy 捕捉到差異顯示 `0.02% diff`
![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/c6UQi4IR-clipboard.png)

### 快照比對原理

- 當我們在不同的 Git commit 或 branch 上執行 snapshot 測試時，工具會根據下列邏輯決定要與哪一個版本進行比對

- 比對順序邏輯

  1. **PR 的 base branch**（例如：`main` 或 `develop`）

     - Percy 會尋找 base branch 上最近一次成功的 snapshot 當作 baseline 來比較。

  2. **找不到 base branch snapshot 時**：

     - 會往最近的共同 ancestor commit 找 snapshot
     - 若仍找不到，則 fallback 到預設分支（default branch，如 `main`）

  3. **同一 branch 多次推送 commit**：
     - 會比對該 branch 上上一次成功的 snapshot
     - 有助於追蹤當前修改導致的視覺差異

---

#### 實際情境範例

- Case 1: PR from `feature` → `main`

  ```powershell
  main:   A──B──C──D
                 \
  feature:        E──F
  ```

  - 在 commit `F` 執行 snapshot
  - Percy 會比對 `F`(當前) vs `D`, base branch 上最新 snapshot
  - 合併後 `A - B - C - D - E - F` F 為 main 的 baseline

- Case 2: PR from `feature` → `main`

  ```powershell
  main:   A──B──C──D
                 \
  feature:        E──F──G
  ```

  - 原本比對是 `F vs D`
  - 再推到 `G` 時會改成 `G vs F`

```
Percy 比對 baseline 的流程：

  (1) 有沒有同分支前一次成功快照？
       └─> 有 ➜ 拿它當 baseline
       └─> 沒有 ➜ 看有沒有 target branch（如 main）
              └─> 有 ➜ 用它
              └─> 沒有 ➜ 無 baseline，Percy 無法比對
```

Percy 的 baseline 是「分支感知」的：

- 針對不同 feature 分支，各自追蹤 UI 變動
- PR merge 時可跟主分支做總比較

| 條件                | 比對對象                                   |
| ------------------- | ------------------------------------------ |
| PR 建立時           | PR 的 base branch 上最新 snapshot          |
| 多次更新同一 branch | 該 branch 上上一次 snapshot                |
| 無 baseline 時      | fallback 到 default branch 或共同 ancestor |

---

### 結論

- 缺乏版本控制: 如果沒有版控, 則無法建立 baseline
- 畫面更新頻繁: 如題, 更新頻率過高, 失去畫面對比意義

---

## 5-2 驗證畫面正確性

- 安裝 `Storybook`

```bash
pnpm add -D storybook
npx sb init
```

`npx sb init` 協助建立 storybook 相關設置檔案與初始化, 可以看到 `.storybook` 以及 `src/storybook` 兩個資料夾與內部的檔案, 可以先刪除 `src/storybook`, 自己寫一個實際案例

```js
// src/components/Button.tsx
import React from "react";

type ButtonProps = {
  label: string,
  onClick?: () => void,
};

export const Button = ({ label, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{label}</button>;
};
```

- 需要安裝 `@storybook/test`

```bash
pnpm add -D @storybook/test
```

```js
// src/components/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "@storybook/test";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Example/Button",
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    label: "Click Me",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.getByRole("button");

    await userEvent.click(button);

    // 你可以根據點擊後的狀態去驗證
    expect(button).toHaveTextContent("Clicked"); // 假設點擊後文字會改變
  },
};
```

- 新增 scripts
  ```json
  "scripts": {
    // ...
    "storybook": "start-storybook -p 6006",
    "build-storybook": "build-storybook",
    "percy": "percy storybook:start --port=6006"
  }
  ```

執行 `pnpm percy`, 就可以看到剛剛新增的 `Button` 組件納入 Percy snapshot

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/ulDnRFH8-clipboard.png)

訪問連結網站可以看到 component 的比對測試, 內容皆與頁面測試相同.

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/BP6cTwTe-clipboard.png)

頁面可找到對應的寬度, 瀏覽器切換

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/D9tMCAV_-clipboard.png)

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/34y00yNA-clipboard.png)

- 建立 `.percy.json`

```json
{
 "version": 2
 "snapshot": {
   "widths": [375, 768, 1280],
   "min-height": 1024
 }
}
```

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/5g_HhoIA-clipboard.png)

> [!WARNING]
>
> - 書上說是 `percy.json`, 但事實上是 `.percy.json`, 有一個 `.` 前綴
> - 需要 `"version": 2`

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/p5dR7ju1-clipboard.png)

---

#### 特定流程後取的 snapshot

修改 `mixtini.cy.ts`

```js
import "@percy/cypress";

describe("Index Page", () => {
  it("should update snapshot to Percy correctly", () => {
    cy.visit("https://mixtini-co.web.app/cocktails/search");
    cy.percySnapshot("index", {
      // widths: [375, 768, 1440],
    });
  });

  it("should search for 愛爾蘭咖啡 and take Percy snapshot", () => {
    cy.visit("https://mixtini-co.web.app/cocktails/search");

    // 等待頁面加載完成，包含 React 渲染
    cy.wait(1000);

    // 輸入「愛爾蘭咖啡」
    cy.get('input[placeholder="請輸入調酒名稱或材料"]').type("愛爾蘭咖啡", {
      delay: 100,
    });

    // 點擊搜尋按鈕
    cy.get('button[data-testid="SEARCH_BUTTON"]').click();

    // 等待搜尋結果載入
    cy.wait(3000);

    // Percy 拍照
    cy.percySnapshot("搜尋結果 - 愛爾蘭咖啡");
  });
});
```

分別執行 `pnpm cy:open` `pnpm cy:percy` 可以看到對應的畫面皆有按照測試案例去做顯示與截圖.

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/cy00SiEF-clipboard.png)

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/fjn7FBO5-clipboard.png)

#### 配合 CI workflow 的整合, 結合 CI tools 做測試

- 可以參考, 官方文件: https://www.browserstack.com/docs/percy/ci-cd/overview

```yaml
name: Regular Visual Testing
on:
  schedule:
    - cron: "0 0 * * 1" # Every Monday at midnight UTC
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Install dependencies
        run: npm install

      - name: Run visual testing
        run: npx percy exec -- npx cypress run
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

      - name: Run Component visual Testing
        run: npm run percy
```

> [!WARNING]
> 好奇怪 XD, `visual testing` 沒有跑出連結 `Run Component visual Testing`

![clipboard.png](https://raw.githubusercontent.com/hcw0915/test-visual/main/src/assets/nmWJueKm-clipboard.png)

---

## 5-3 工具評比

歸納總共有幾個面向:

- **依照 PR 或 Branch 檢視 snapshot**: `Chromatic > Percy > Jest`
- **Merge Checks**: 透過 PR 的 CI, 把 visual testing 作爲 review 標準. `Chromatic = Percy > Jest`
- **元件測試**: 配合 `Chromatic = Percy > Jest` 與 storybook 實現
- **頁面測試**: `Percy` or `Cypress + cypress-image-diff-js`
- **瀏覽器支援**: `Percy(Chrome, Firefox, Safari)`, `Chromatic(Chrome)`, `Jest(與瀏覽器無關)`

#### 表格一：比較 Percy、Chromatic、Cypress 與 Jest 的 toMatchSnapshot

| #                          | Percy                  | Chromatic            | Cypress                        | Jest 的 toMatchSnapshot |
| -------------------------- | ---------------------- | -------------------- | ------------------------------ | ----------------------- |
| 快照的類型與結構           | 畫面截圖               | 畫面截圖             | 畫面截圖                       | 以文字格式儲存 DOM 結構 |
| 比對工具                   | 平台工具               | 平台工具             | 搭配套件 cypress-image-diff-js | 搭配版控工具或測試斷言  |
| 比對原始碼                 | 無                     | 平台工具             | 搭配版控工具                   | 搭配版控工具            |
| 依照 PR 或 branch 檢視快照 | 平台工具               | 平台工具             | 搭配版控工具                   | 搭配版控工具            |
| Merge Checks               | 搭配 percy/exec-action | 搭配 chromaui/action | 無                             | 搭配版控工具            |
| 元件測試                   | 搭配 Storybook         | 搭配 Storybook       | 內建指令                       | 無                      |

#### 表格二：各工具更多比較資訊

| #            | Percy                   | Chromatic                | Cypress                 | Jest 的 toMatchSnapshot |
| ------------ | ----------------------- | ------------------------ | ----------------------- | ----------------------- |
| 頁面測試     | 搭配 e2e testing 框架   | 無                       | 內建指令                | 無                      |
| 瀏覽器支援度 | Chrome、Firefox 和 Edge | Chrome                   | Chrome、Firefox 和 Edge | 快照與瀏覽器無關        |
| 特色         | 兼顧元件和頁面測試      | 專注在元件測試且功能完善 | 整合多種測試方式        | 實作過程簡單易懂        |
| 儲存空間     | 平台提供                | 平台提供                 | 開發者自行處理          | 開發者自行處理          |

#### 本書推薦做法

- Storybook 搭配 Chromatic 進行元件測試, PR review 確認元件是否如期實現
- Cypress 搭配 cypress-image-diff-js / Percy 導入, 定期在 Prod 環境檢視頁面狀況

## 5-4 本章回顧與總結

---
