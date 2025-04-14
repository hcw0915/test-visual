import "@percy/cypress";

describe("Index Page", () => {
  it("should update snapshot to Percy correctly", () => {
    cy.visit("https://mixtini-co.web.app/");
    cy.percySnapshot("index");
  });
});
