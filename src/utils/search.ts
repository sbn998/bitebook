// Lowercase and without accents, so "platano" matches "Plátano".
export function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
