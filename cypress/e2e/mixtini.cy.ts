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
