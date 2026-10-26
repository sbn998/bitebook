import { normalize } from "@/utils/search";

describe("normalize", () => {
  test("lowercases and removes accents", () => {
    expect(normalize("Plátano")).toBe("platano");
    expect(normalize("JAMÓN Ibérico")).toBe("jamon iberico");
  });

  test("lets a search without accents find a name with them", () => {
    expect(normalize("Pan de Molde Integral").includes(normalize("molde"))).toBe(true);
    expect(normalize("Atún en aceite").includes(normalize("atun"))).toBe(true);
  });
});
