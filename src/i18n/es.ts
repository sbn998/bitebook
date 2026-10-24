import type { Strings } from "@/i18n/en";

// All Spanish (Spain) texts. Must match en.ts exactly: TypeScript reports anything missing.

export const es: Strings = {
  common: {
    add: "Añadir",
    save: "Guardar",
    delete: "Eliminar",
    cancel: "Cancelar",
    name: "Nombre",
    required: "Obligatorio",
    deleteTitle: (name: string) => `¿Eliminar ${name}?`,
  },
  tabs: {
    foods: "Alimentos",
    main: "Inicio",
    settings: "Ajustes",
  },
  settings: {
    title: "Ajustes",
    mealLabels: "Comidas",
    yourGoals: "Tus objetivos",
    language: "Idioma",
  },
  languages: {
    en: "English",
    es: "Español",
  },
  macros: {
    proteinShort: "P",
    carbsShort: "C",
    fatShort: "G",
  },
  weekdays: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
  meals: {
    title: "Comidas",
    emptyTitle: "Aún no hay comidas",
    emptyText: "Añade las comidas que haces, como Desayuno o Comida.",
    addTitle: "Añadir comida",
    editTitle: "Editar comida",
    duplicate: "Ya existe una comida con este nombre",
    deleteMessage: "Las comidas ya añadidas a un día mantienen su nombre.",
  },
  goals: {
    title: "Tus objetivos",
    weeklyPlan: "Plan semanal",
    presets: "Objetivos guardados",
    noGoal: "Sin objetivo",
    planHint: "Añade un objetivo abajo para planificar tu semana.",
    empty: "Aún no hay objetivos. Pulsa Añadir para crear el primero.",
    caloriesOnly: "Solo calorías",
  },
};
