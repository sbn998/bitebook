# Bitebook - Spec

## Goal

A simple app that will let users log what they eat each day, so they can track how many calories, as well as macronutrients (protein, carbs and fats) they have eaten at any point of the day. This will allow them to compare it to the amount they set as a goal which can differ depending on the day of the week it is. The data will be saved locally.

## v1 (done)

### Foods

- Goal: save foods once so they can be reused when logging meals
- What it does: add foods with name, brand (optional), calories (per reference amount e.g 100g, or 1 serving, cup, etc), macronutrients (protein, carbs, fats) and type (meat, vegetables, fruit, etc). Edit or delete saved foods. Filter foods based on name, brand or type, sorted alphabetically by name (A-Z by default, with a button to switch to Z-A)
- Decisions: empty macronutrients are saved as 0, and if calories are left empty they are calculated from the macronutrients (4 kcal per g of protein or carbs, 9 kcal per g of fat). Editing or deleting a food won't change the values of food entries that have already been added, which in result won't affect meal entries

### Meal names

- Goal: name the meals of the day (like dinner, lunch, breakfast...)
- What it does: add, edit or delete meal names
- Decisions: editing or deleting a meal name will just make it so you're not able to add it to the day anymore, but if a meal entry already has used that name it won't be affected

### Day log

- Goal: log what was eaten on a day, grouped by meal
- What it does: add a meal entry to the day (after selecting which meal, it will let us select which foods will be used as entries, and the quantity of those foods. it will also show how many calories the meal will have). Add food entries to a meal on the day (lets us add entries if we missed adding them/ate them after a short while after adding the meal entry). Edit food entries amount, or delete them, which will update the meal entry it's in. Delete meal entries from a day. Each meal entry shows the sum of calories and macros of the food entries it contains
- Decisions: meal entries are manually added, order does not matter so they are shown in the order they were added in. A meal entry can be saved without foods (e.g. to plan a day and fill it in later). When picking a food for a meal, its amount starts at the food's reference amount (e.g. 100 for "per 100 g")

### Goals

- Goal: create different calorie and macronutrient goals (so, a 2500 calorie, a 1500 calorie, or a 1750 calorie goals, with their different macronutrient goals)
- What it does: add, edit or delete goals. Macronutrient targets can be entered in grams or as a percentage of the calories, switchable per macronutrient. A "kcal left" line shows what the macronutrients don't cover yet, with a button to fill the one empty macronutrient with it
- Decisions: calories are required, macronutrient targets are optional (a user may only track calories, or only some macronutrients). If calories are left empty, they are calculated from the macronutrients (4 kcal per g of protein or carbs, 9 kcal per g of fat). Macronutrients are always saved as grams (whole grams when entered as a percentage), and switching a field converts its value. Percentages need calories to be entered. Macronutrients can't add up to more than the calories. Editing a goal updates today and future days, past days keep their copy. Deleting a goal removes it from any weekday that uses it and clears it from today and future days, past days keep their copy. When deleting a goal used by weekdays, the confirmation says which weekdays will lose their goal

### Weekday goals

- Goal: set the calorie goals to different days of the week (so monday-tuesday can have the 2500 calorie one, thursday the 1750 calorie one, saturday the 1500 calorie one, and so on for each day of the week)
- What it does: choose or change which goal each weekday uses. If a day doesn't have a goal, the screen shows a button to add a new one or select one from the already existing ones, which will be set for the weekday goal
- Decisions: changing which goal a weekday uses updates today and future days, past days keep their copy. On a past day without a goal, the "no goal" button sets the weekday's goal and also gives that day the chosen goal

### Days and calendar

- Goal: see how a day is going compared to its goal, and move between days
- What it does: see today's total calories and macronutrients vs today's goal. Browse previous days, and future days to plan them out
- Decisions: when a total goes over its goal, its progress bar turns red

### Languages

- Goal: app in both English and Spanish
- What it does: way to select the language in the settings screen
- Decisions: system language as default

### Theme

- Goal: light and dark mode
- What it does: selectable in the settings screen

### Export and import

- Goal: let a user keep their data if they switch phones/have to format etc
- What it does: export and import saved data
- Decisions: exporting will be done in a JSON file. Importing will replace all existing data

## 1.1 (in progress)

Each feature gets its own section, filled in before work on it starts.

### Automated tests

- Goal: check whether database functions work properly, as well as different parts of the app that need tests for it (like autocalculations)
- What it covers: database functions, transactions, application calculations, data persistence
- Decisions:
- Open questions:
- Parts:
- Done when:

### Barcode scanner

- Goal: read a barcode from the package of an item and autocomplete the calories and macronutrients
- What it does: it opens the phone's camera and lets the user point it to a barcode, which will then read the information on that item from a database to autocomplete the add food form.
- Decisions: it will calculate the calories from the macronutrients, since sometimes the total calories doesn't add up to the amount that comes from adding the macronutrients up. It should be able to tell the type and select it.
- Open questions:
- Parts:
- Done when:

## Later ideas

- Option to add optional micronutrients to food entries
- Add custom user food types to expand the default list
- Charts and weekly stats
- Food suggestions based on how many calories and macronutrients you have left
- Other customization
- Short animated intro after the splash screen, showing the app name
- Reusable meals (e.g Breakfast 1, breakfast 2, etc) which already contain pre-selected foods and you only need to change the amount of each one
- Translate the app to more languages
- Gestures (to delete food entries, navigation between screens, etc)
- Organize the settings screen in sections so it's easier to browse.

## Data

- Food: name, calories, protein, carbs, fat, amount, units, brand, type
- Food entry: which food + how much + which meal entry + copy of name & nutrition values at time of logging
- Meal: name (2 meals can't have the same name)
- Meal entry: which meal it belongs to + which day + copy of the meal's name
- Calorie goal: name, calorie, macronutrient target
- Weekday goal: which weekday + which calorie goal
- Day: date + copy of the goal's name, calories, protein, carbs, fat

## Screens

- The different screens will be accessible at the bottom of the app.
- Main screen: what day it is (today, yesterday, tomorrow, or following the date format of the user's phone), list of meal entries + total vs goal, a button to add a meal entry (from the list of meals), a calendar button which will let us select any day of the year.
- Food screen: list of already saved foods + filtering, a button to add a new food to the list
- Settings: add/edit/delete meal labels, add/edit/delete goals, import/export saved data
