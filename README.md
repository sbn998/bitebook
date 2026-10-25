# Bitebook – Macro Diary

An Android app for logging what you eat and comparing each day's calories, protein, carbs and fat against a goal. Goals can change by weekday, past days keep the goal they had, and everything is stored on the device, without an account or a server.

Built with Expo (React Native) and TypeScript, using SQLite for storage. Available in English and Spanish, with light and dark themes.

![Bitebook in light and dark theme: Add meal, Foods, the Main screen, Your goals and Add goal](docs/media/showcase.png)

<p align="center">
  <img src="docs/media/demo.gif" alt="Creating a goal, adding a meal and editing a food amount" width="300">
</p>

## What it does

- **Daily log:** meals made of foods, with the day's totals on a calorie gauge and macro bars that turn red when over the goal.
- **Food library:** foods saved once per reference amount (100 g, a slice, a cup…) and reused. Searchable, filterable by type and sortable.
- **Goals by weekday:** optional macro targets in grams or as a percentage of calories.
- **Correct history:** editing a goal or a food never changes days that were already logged.
- **Any day:** browse past days or plan future ones with arrows or a calendar.
- **Backup:** export all data to a JSON file and import it on another phone.
- **English and Spanish**, and **light and dark themes**, chosen in Settings.

## How it's built

- **Versioned SQLite migrations** ([`migrations.ts`](src/db/migrations.ts)). Logged meals and days keep their own copy of food and goal values, so history never changes; goal edits apply to today and future days inside a transaction ([`goals.ts`](src/db/goals.ts)).
- **Import is checked before anything changes** and runs in one transaction. Only the table's real columns are inserted, so nothing from the file reaches the SQL ([`backup.ts`](src/db/backup.ts)).
- **Typed translations:** the Spanish texts are typed against the English ones, so a missing text is a compile error ([`en.ts`](src/i18n/en.ts)).
- **Theme-aware styles** through a `useStyles` hook, so the whole app switches theme in a single render ([`use-theme.tsx`](src/hooks/use-theme.tsx)).

[SPEC.md](SPEC.md) lists the v1 features and decisions, and [DATABASE.md](DATABASE.md) describes every table.

## Stack

- [Expo](https://expo.dev) SDK 58, React Native 0.88, React 19 with the React Compiler
- TypeScript
- Expo Router (file-based routes, native bottom tabs)
- expo-sqlite (database, plus its key-value store for settings)
- React Native Reanimated, react-native-svg
- EAS Build for Android builds

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
