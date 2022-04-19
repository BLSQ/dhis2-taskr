import { fixChars } from "./fixChars";

describe("fixChars", () => {
  it("is truthy", () => {
    expect(fixChars("Hello Stéphan mère Joséphine œil à la mer")).toEqual(
      "Hello St\\u00E9phan m\\u00E8re Jos\\u00E9phine \\u009Cil \\u00E0 la mer"
    );
  });
});
