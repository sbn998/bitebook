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

## 1.1 (done)

Each feature gets its own section, filled in before work on it starts.

### Automated tests

- Goal: check whether database functions work properly, as well as different parts of the app that need tests for it (like autocalculations), so a later change (like the barcode scanner's new database column) can't quietly break goals, entries or backups. Right now everything is only checked by hand on the phone
- What it covers:
  - Calculations: calories from macros, grams ↔ percentages, food entry and meal totals, number parsing, dates and weekdays, search
  - Database functions: foods, meal names, entries, goals, weekday goals, days
  - Transactions: changes that must update several tables together, or not at all
  - Data persistence: migrations (a new install and an upgrade from an older version), export and import
- Decisions:
  - Jest with the jest-expo preset, the setup Expo recommends. Test files go in `__tests__` folders next to the code they test
  - The phone's SQLite (expo-sqlite) can't run on a computer, so database tests use Node's built-in SQLite behind a small adapter with the same five methods the app uses (runAsync, getAllAsync, getFirstAsync, execAsync, withTransactionAsync). Each test starts from a new in-memory database built by the app's own migrations
  - Tests pass a fixed `today`, so they give the same result whatever day they run
  - No screen tests for now: screens are still checked by hand on the phone, and the rules worth testing live in plain functions
  - The goal form's rules ("kcal left", filling the one empty macro, the rounding tolerance before "over") move out of the screen into `src/utils/nutrition.ts` for good, so they can be tested. The form uses them from there and works the same
- Open questions:
  - Does Node's built-in SQLite work inside Jest? If not, use the better-sqlite3 package instead
  - The adapter isn't expo-sqlite, so a passing test doesn't prove the phone behaves the same. One test forces an error halfway through a transaction and checks that nothing was saved; the phone check stays for the rest
- Parts:
  - Part A: set up Jest, an `npm test` command, and one first test (calories from macros) to show it works
  - Part B: move the goal form's rules into `nutrition.ts`, then tests for the calculations (`nutrition.ts`, `date.ts`, `search.ts`, food entry and meal totals)
  - Part C: the test database adapter, and tests for the migrations
  - Part D: tests for foods, meal names and entries, including the copies (editing or deleting a food or meal name doesn't change entries already logged)
  - Part E: tests for goals and weekday goals: today and future days update, past days keep their copy, deleting a goal clears its weekdays, the past-day "no goal" button
  - Part F: tests for export and import: exporting then importing gives back the same data, and broken or newer files are refused without touching existing data
- Done when: `npm test` passes, every data or calculation rule in the v1 Decisions has at least one test, and lint and typecheck still pass

### Barcode scanner

- Goal: read a barcode from the package of an item and autocomplete the calories and macronutrients
- What it does: it opens the phone's camera and lets the user point it to a barcode, which will then read the information on that item from a database to autocomplete the add food form.
- Decisions:
  - It will calculate the calories from the macronutrients, since sometimes the total calories doesn't add up to the amount that comes from adding the macronutrients up
  - The database is Open Food Facts: free, no account or key needed, and has many products sold in Spain. It needs an internet connection, and asks apps to identify themselves (app name, version and a contact email) and to credit it as the source of the data
  - Values are filled in per 100 g (or 100 ml for drinks), the way Open Food Facts stores them, so the reference amount is 100
  - Nothing is saved automatically: the form is filled in, and the user checks it and saves it as usual
  - Saved foods keep their barcode (a new optional column), so a scanned barcode can be matched to the foods already in the list. The same product can be saved more than once, e.g. per 100 g and per serving, so several foods can share a barcode. Backups from older versions still import
  - When the food isn't in the database, the app says so and the form is filled in by hand. The barcode is still saved with the food, so scanning it again finds it in the list. Sending it to Open Food Facts is a later idea: adding products needs the user's own Open Food Facts account and password
  - When a scanned barcode is already in the list, the app shows the saved foods with that barcode and their reference amounts (e.g. per 100 g, per serving). The user can open one to edit it, or add the product again with a different reference amount
  - The type is picked when one of Open Food Facts' categories (like "dairies" or "beverages") clearly matches one of ours, otherwise it's left empty for the user
  - The scanner is a camera view inside our own screen, so it looks like the rest of the app and works the same on Android and iOS. It needs the camera permission, asked the first time
  - Without internet, the app shows a message to try again, and the form can still be filled in by hand
- Open questions:
- Parts:
  - Part A: save barcodes: migration 3 adds the barcode column (migration 4 lets several foods share one), DATABASE.md and the export/import are updated, with tests
  - Part B: the Open Food Facts lookup: a function that takes a barcode and returns the name, brand, macros, unit and type, or why it couldn't (not found, no internet). Tested with saved example answers, so tests don't need the internet
  - Part C: ask for the permissions to use the phone's camera the first time a user wants to scan a barcode, and what to show if the user says no
  - Part D: redesign the add food form to have a button that lets the user scan a barcode, and open the scanner
  - Part E: autofill the fields with the received information after the API call, and save the barcode with the food
  - Part F: the other cases: food already saved (the list of saved ones, to open one or add another), not found, no internet. Then the texts in English and Spanish, and the credit to Open Food Facts
- Done when: scanning a barcode autofills the food fields and lets the user save it easily. Scanning a food that's already saved shows the saved ones to open or add another, and an unknown barcode or scanning without internet each show a clear message. Works in English and Spanish, tests pass, and it's checked on the phone

## 1.2 (done)

### Design and accessibility pass

- Goal: make the app readable and usable for more people (low vision, screen readers, large text, reduced motion) and more consistent, after a review of every screen and form against Apple's Human Interface Guidelines
- What it does:
  - Text people need to read, and orange and red text, pass 4.5:1 contrast in light and dark themes; text fields have a visible edge
  - TalkBack names every button, field and dropdown, and reads selected and expanded states
  - Larger tap areas, and every button shows when it's pressed
  - Forms and the weekly plan stay readable at the largest text size
  - Empty lists say what's missing and link to the next step
  - Form errors show when leaving a field and say what to fill in
  - Leaving a form with unsaved changes asks first
  - Export and import results show under their buttons (green or red) instead of a popup
  - The calorie count-up follows the phone's "remove animations" setting
- Decisions: orange is only for things that can be tapped (calorie numbers are plain text); field edges are 2:1, softer than the 3:1 web guideline, because 3:1 looked too heavy; the in-app theme setting stays, since it's normal on Android and defaults to the system's; files over 10 MB are rejected on import (a backup is a few MB at most)
- Done when: every Critical, High, Medium and Low finding of the review is fixed or has a stated reason not to be, each checked on the phone in light and dark mode, English and Spanish

## Later ideas

- Option to add optional micronutrients to food entries
- Add custom user food types to expand the default list
- Charts and weekly stats
- Food suggestions based on how many calories and macronutrients you have left
- Other customization
- Short animated intro after the splash screen, showing the app name
- Reusable meals (e.g Breakfast 1, breakfast 2, etc) which already contain pre-selected foods and you only need to change the amount of each one
- Translate the app to more languages
- Send foods that aren't in Open Food Facts to it, with the user's own Open Food Facts account
- Gestures (to delete food entries, navigation between screens, etc)
- Organize the settings screen in sections so it's easier to browse.

## Data

- Food: name, calories, protein, carbs, fat, amount, units, brand, type, barcode (optional, can be shared by versions of the same product)
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
