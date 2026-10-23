# Macro Tracker

A mobile app to log what you eat each day and track your calories and macronutrients (protein, carbs and fat) against a daily goal. Goals can differ by day of the week, and all data is stored locally on the device.

> 🚧 Work in progress — see [SPEC.md](SPEC.md) for the planned v1 features.

## Planned features

- Save reusable foods with their calories and macros
- Log meals and the foods in them for any day
- Create calorie and macro goals and assign them to weekdays
- Compare each day's intake against its goal
- Browse past days and plan future ones
- English and Spanish
- Export and import your data as JSON

## Tech stack

- [Expo](https://expo.dev) and React Native
- TypeScript
- Expo Router for navigation
- SQLite for local storage

## Running locally

```bash
npm install
npx expo start
```

Then scan the QR code with [Expo Go](https://expo.dev/go) on your phone.
