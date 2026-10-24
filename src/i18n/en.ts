// All English texts in the app. es.ts must have exactly the same shape (see `Strings`),
// so TypeScript reports any missing or misspelled translation.
// Texts that include a number or name are small functions.

export const en = {
  common: {
    add: "Add",
    save: "Save",
    delete: "Delete",
    cancel: "Cancel",
    name: "Name",
    required: "Required",
    deleteTitle: (name: string) => `Delete ${name}?`,
  },
  tabs: {
    foods: "Foods",
    main: "Main",
    settings: "Settings",
  },
  settings: {
    title: "Settings",
    mealLabels: "Meal labels",
    yourGoals: "Your goals",
    language: "Language",
  },
  // Shown in their own language in both files, so each is recognizable.
  languages: {
    en: "English",
    es: "Español",
  },
  macros: {
    proteinShort: "P",
    carbsShort: "C",
    fatShort: "F",
  },
  // Monday first: weekday number n (1 = Monday ... 7 = Sunday, like the database) is weekdays[n - 1].
  weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  meals: {
    title: "Meal labels",
    emptyTitle: "No meal labels yet",
    emptyText: "Add the meals you eat, like Breakfast or Lunch.",
    addTitle: "Add meal",
    editTitle: "Edit meal",
    duplicate: "A meal with this name already exists",
    deleteMessage: "Meals already added to a day keep their name.",
  },
  goals: {
    title: "Your goals",
    weeklyPlan: "Weekly plan",
    presets: "Goal presets",
    noGoal: "No goal",
    planHint: "Add a goal below to plan your week.",
    empty: "No goals yet. Tap Add to create your first one.",
    caloriesOnly: "Calories only",
  },
};

export type Strings = typeof en;
