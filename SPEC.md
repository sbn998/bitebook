# Macro Tracker - v1 Spec

## Goal

A simple app that will let users log what they eat each day, so they can track how many calories, as well as macronutrients (protein, carbs and fats) they have eaten at any point of the day. This will allow them to compare it to the amount they set as a goal which can differ depending on the day of the week it is. The data will be saved locally.

## Features (v1)

- Add foods so they can be reused: name, brand (optional), calories (per reference amount e.g 100g, or 1 serving, cup, etc), macronutrients (protein, carbs, fats), type (meat, vegetables, fruit, etc)
- When adding a food, empty macronutrients are saved as 0, and if calories are left empty they are calculated from the macronutrients (4 kcal per g of protein or carbs, 9 kcal per g of fat)
- Filter foods based on name, brand or type, sorted alphabetically by name (A-Z by default, with a button to switch to Z-A)
- Add meal names (like dinner, lunch, breakfast...), will show the sum of calories and macros of the food entries they contain each day
- Add a meal entry to the day (after selecting which meal, it will let us select which foods will be used as entries, and the quantity of those foods. it will also show how many calories the meal will have)
- Add food entries to a meal on the day (lets us add entries if we missed adding them/ate them after a short while after adding the meal entry)
- Create different calorie and macronutrient goals (so, a 2500 calorie, a 1500 calorie, or a 1750 calorie goals, with their different macronutrient goals)
- Calories are required in a goal, macronutrient targets are optional (a user may only track calories, or only some macronutrients). If calories are left empty, they are calculated from the macronutrients (4 kcal per g of protein or carbs, 9 kcal per g of fat)
- Macronutrient targets can be entered in grams or as a percentage of the calories, switchable per macronutrient. They are always saved as grams (whole grams when entered as a percentage), and switching a field converts its value. Percentages need calories to be entered. A "kcal left" line shows what the macronutrients don't cover yet, with a button to fill the one empty macronutrient with it. Macronutrients can't add up to more than the calories
- When deleting a goal used by weekdays, the confirmation says which weekdays will lose their goal
- Set the calorie goals to different days of the week (so monday-tuesday can have the 2500 calorie one, thursday the 1750 calorie one, saturday the 1500 calorie one, and so on for each day of the week).
- See today's total calories and macronutrients vs today's goal
- Browse previous days
- Browse future days to plan them out
- App in both English and Spanish (way to select in the settings screen, but system language as default)
- Edit or delete saved foods (they won't change the values of food entries that have already been added, which in result won't affect meal entries)
- Edit or delete meal names, will just make it so you're not able to add it to the day anymore, but if a meal entry already has used that label it won't be affected.
- Edit food entries amount, or delete them. This will update the meal entry it's in
- Edit calorie and macronutrient goals, or change which goal a weekday uses: updates today and future days. Past days keep their copy.
- Delete a goal: removes it from any weekday that uses it and clears it from today and future days. Past days keep their copy.
- Delete meal entries from a day
- Export and import saved data, so a user can keep their data if they switch phones/have to format etc. Importing will replace all existing data. Exporting will be done in a JSON file.
- If a day doesn't have a calorie goal, the screen will show a button to add a new one or select one from the already existing ones, which will be set for the weekday goal
- Meal entries will be manually added, order does not matter so they will just be shown in the order they were added in
- A meal entry can be saved without foods (e.g. to plan a day and fill it in later)
- When picking a food for a meal, its amount starts at the food's reference amount (e.g. 100 for "per 100 g")
- When a total goes over its goal, its progress bar turns red
- On a past day without a goal, the "no goal" button sets the weekday's goal and also gives that day the chosen goal
- Light and dark mode, selectable in the settings screen

## Before release

- Splash screen: the main screen's calorie arc on the app's background (light and dark versions), instead of the Expo template's blue (#208AEF) and logo
- App name and icon: replace the Expo template's name and logos

## Not in v1

- Option to add optional micronutrients to food entries
- Add custom user food types to expand the default list
- Barcode scanning, food database search
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
