# Bitebook – Macro Diary

An Android app for logging what you eat and comparing each day's calories, protein, carbs and fat against a goal. Goals can change by weekday, past days keep the goal they had, and everything is stored on the device, without an account or a server.

Built with Expo (React Native) and TypeScript, using SQLite for storage. Available in English and Spanish, with light and dark themes.

![Bitebook in light and dark theme: Add meal, Foods, the Main screen, Your goals and Add goal](docs/media/showcase.png)

<p align="center">
  <img src="docs/media/demo.gif" alt="Creating a goal, adding a meal and editing a food amount" width="300">
</p>

## What it does

- **Daily log.** Each day has meal entries (Breakfast, Lunch…) made of foods with an amount. The day's totals are shown on a half-circle gauge for calories and a bar for each macro, which turn red when a total goes over its goal.
- **Food library.** Foods are saved once with their values per reference amount (per 100 g, per slice, per cup…) and reused. If calories are left empty, they're calculated from the macros. The list can be searched by name or brand, ignoring accents, filtered by type and sorted A–Z or Z–A.
- **Goals by weekday.** Goals are presets (e.g. "Training day", "Rest day") assigned to weekdays. Macro targets are optional and can be entered in grams or as a percentage of calories. The form shows how many calories the macros don't cover yet and can put the rest into the one empty macro.
- **History stays correct.** Editing or deleting a goal only changes today and future days. Editing or deleting a saved food doesn't change meals that already used it.
- **Browse any day.** Arrows step through days, tapping the title jumps back to today, and a calendar picks any date, so past days can be reviewed and future days planned.
- **Backup.** All data can be exported to a JSON file through the phone's share sheet and imported again, for example on a new phone.
- **English and Spanish**, chosen in Settings. Dates and numbers follow the phone's regional format when it matches the app's language.
- **Light and dark theme**, either following the phone or chosen in Settings.

## Technical decisions

**Local SQLite with versioned migrations.** The schema is created and upgraded in [`src/db/migrations.ts`](src/db/migrations.ts) using SQLite's `user_version`. Migration 2 made goal macros optional by rebuilding the table, since SQLite can't drop a `NOT NULL` constraint in place. The full schema and the rules behind it are documented in [DATABASE.md](DATABASE.md).

**Snapshots instead of live links for history.** A food entry stores its own copy of the food's name and values, and a day stores a copy of its goal. Editing a food or a goal never rewrites what was logged before. Goal changes update today and future days only, inside a transaction (see [`src/db/goals.ts`](src/db/goals.ts)), with the cut-off date passed in rather than read inside the query, so it uses the phone's local date.

**Safe import.** A backup is checked before anything is touched: it must be a Bitebook file and not made by a newer version of the app. The user sees how many foods, goals and days the file has compared with what's on the phone, and confirms. The replacement runs in one transaction, so a failed import leaves the data as it was. The insert uses the table's real columns, read with `PRAGMA table_info`, so a column name from the file never reaches the SQL, and unknown fields are simply ignored ([`src/db/backup.ts`](src/db/backup.ts)).

**Typed translations.** All texts live in [`src/i18n/en.ts`](src/i18n/en.ts), and the Spanish file is typed against it, so a missing or misspelled key is a compile error. Sentences that are built differently in each language ("Its 2 foods will be removed too") are functions per language instead of string templates.

**Themes switched in one render.** Every style sheet that uses colors is a function of the theme, read through a `useStyles` hook ([`src/hooks/use-theme.tsx`](src/hooks/use-theme.tsx)), so all screens redraw together when the theme changes. Android is told about the chosen theme too, and the window behind the screens is painted in the theme's background, so closing a screen doesn't flash the other theme.

**Small details that affect how it feels.** The day's meals and goal load together, so the gauge never compares one day's totals with another day's goal. Numbers count up and bars slide with Reanimated. The food list shows a spinner, not an empty message, while it's still loading.

## Stack

- [Expo](https://expo.dev) SDK 58, React Native 0.88, React 19 with the React Compiler
- TypeScript
- Expo Router (file-based routes, native bottom tabs)
- expo-sqlite (database, plus its key-value store for settings)
- React Native Reanimated, react-native-svg
- EAS Build for Android builds

## Project structure

```
src/
  app/          Screens. Each file is a route (Expo Router); _layout.tsx files define the navigators
  components/   Shared UI: cards, dialogs, dropdowns, the day summary and its progress arc
  db/           SQLite access: migrations, one file per table group, backup/import
  i18n/         English and Spanish texts and the language provider
  hooks/        Theme hooks, tab navigation helper
  constants/    Design tokens (colors, fonts, spacing), food types, units, weekdays
  utils/        Dates, nutrition sums, search normalization, backup file handling
```

[SPEC.md](SPEC.md) lists the v1 features and the decisions made along the way. [DATABASE.md](DATABASE.md) describes every table.

## Running it

Requirements: Node.js and the Expo Go app on an Android phone.

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. To build an installable APK with EAS:

```bash
npx eas-cli@latest build --platform android --profile preview
```

## Status and next steps

All v1 features in the spec are done. The app has been tested by hand on Android only. It also targets iOS, but hasn't been run there.

Next steps:

- Automated tests, starting with the database rules for goals and imports
- Weekly charts and stats
- Reusable meals with preset foods
- Barcode scanning and a food database search

## License

[MIT](LICENSE)
