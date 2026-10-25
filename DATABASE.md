# Bitebook - v1 Database

SQLite database stored locally on the device. Based on the Data section of [SPEC.md](SPEC.md).

## Conventions

- Every table (except `weekday_goals` and `days`) has an `id INTEGER` primary key, generated automatically.
- Types: `INTEGER` (whole numbers), `REAL` (decimals), `TEXT`.
- "Required" means `NOT NULL`. Columns not marked required are optional.
- Dates are stored as `YYYY-MM-DD` text (e.g. `2026-10-23`), so sorting them alphabetically also sorts them by date. The app formats them for display using the phone's date format.
- Foreign key rules:
  - `CASCADE`: deleting the parent row also deletes the child rows.
  - `SET NULL`: deleting the parent row keeps the child rows, but empties the link.
- Foreign keys must be switched on every time the database is opened (`PRAGMA foreign_keys = ON`), otherwise SQLite ignores these rules.

## Tables

### `foods`

Saved, reusable foods.

| Column           | Type | Notes                                             |
| ---------------- | ---- | ------------------------------------------------- |
| id               | INTEGER | Primary key                                    |
| name             | TEXT | Required                                          |
| brand            | TEXT | Optional                                          |
| type             | TEXT | Required. Key from the [food types](#food-types) list |
| reference_amount | REAL | Required. e.g. `100`                              |
| unit             | TEXT | Required. Key from the [units](#units) list       |
| calories         | REAL | Required. Per reference amount                    |
| protein          | REAL | Required. Per reference amount                    |
| carbs            | REAL | Required. Per reference amount                    |
| fat              | REAL | Required. Per reference amount                    |

### `meals`

Meal labels (Breakfast, Lunch, Dinner...).

| Column | Type    | Notes                                                  |
| ------ | ------- | ------------------------------------------------------ |
| id     | INTEGER | Primary key                                            |
| name   | TEXT    | Required. Unique, case-insensitive ("Lunch" = "lunch") |

### `goals`

Calorie and macronutrient goal presets. Names don't have to be unique.

| Column   | Type    | Notes                                  |
| -------- | ------- | -------------------------------------- |
| id       | INTEGER | Primary key                            |
| name     | TEXT    | Required. e.g. "Rest day"              |
| calories | REAL    | Required                               |
| protein  | REAL    | Optional. Empty = no target for it     |
| carbs    | REAL    | Optional. Empty = no target for it     |
| fat      | REAL    | Optional. Empty = no target for it     |

Macro targets are stored in grams. They became optional in migration 2 (see [Migrations](#migrations)).

### `weekday_goals`

Which goal each weekday uses. A weekday with no goal has no row.

| Column  | Type    | Notes                                         |
| ------- | ------- | --------------------------------------------- |
| weekday | INTEGER | Primary key. 1 = Monday ... 7 = Sunday        |
| goal_id | INTEGER | Required. → `goals.id`, `CASCADE`             |

Deleting a goal deletes the weekday rows that use it, so those weekdays end up with no goal.

### `days`

One row per day that has at least one meal entry. Stores a copy of the goal so past days keep the goal they had.

| Column        | Type    | Notes                                           |
| ------------- | ------- | ----------------------------------------------- |
| date          | TEXT    | Primary key. `YYYY-MM-DD`                       |
| goal_id       | INTEGER | → `goals.id`, `SET NULL`. Goal the copy came from |
| goal_name     | TEXT    | Copy. Empty if the day has no goal              |
| goal_calories | REAL    | Copy                                            |
| goal_protein  | REAL    | Copy                                            |
| goal_carbs    | REAL    | Copy                                            |
| goal_fat      | REAL    | Copy                                            |

- The row is created when the day gets its first meal entry, copying the goal of its weekday.
- `goal_id` is used to find which days to update: editing a goal updates the copy on days where `goal_id` matches and `date >= today`. Past days are never changed.
- Changing a weekday's goal updates the copy on days of that weekday where `date >= today`.
- Deleting a goal clears the copy on days where `goal_id` matches and `date >= today`.

### `meal_entries`

A meal on a specific day. A day can have the same meal more than once (e.g. two lunches).

| Column    | Type    | Notes                                    |
| --------- | ------- | ---------------------------------------- |
| id        | INTEGER | Primary key                              |
| date      | TEXT    | Required. → `days.date`                  |
| meal_id   | INTEGER | → `meals.id`, `SET NULL`                 |
| meal_name | TEXT    | Required. Copy of the meal's name        |

- Meal entries are shown in the order they were added, by sorting on `id`.
- Deleting or renaming a meal label doesn't affect existing meal entries, because they keep their own copy of the name.

### `food_entries`

A food eaten in a meal entry.

| Column           | Type    | Notes                                         |
| ---------------- | ------- | --------------------------------------------- |
| id               | INTEGER | Primary key                                   |
| meal_entry_id    | INTEGER | Required. → `meal_entries.id`, `CASCADE`      |
| food_id          | INTEGER | → `foods.id`, `SET NULL`                      |
| quantity         | REAL    | Required. In the food's unit, e.g. `150`      |
| name             | TEXT    | Required. Copy                                |
| unit             | TEXT    | Required. Copy                                |
| reference_amount | REAL    | Required. Copy                                |
| calories         | REAL    | Required. Copy, per reference amount          |
| protein          | REAL    | Required. Copy, per reference amount          |
| carbs            | REAL    | Required. Copy, per reference amount          |
| fat              | REAL    | Required. Copy, per reference amount          |

- Values are copied per reference amount, so editing the quantity recalculates correctly: `quantity / reference_amount × calories`.
- Deleting a meal entry deletes its food entries.
- Editing or deleting a saved food doesn't affect existing food entries.

## Migrations

The database stores its version in `PRAGMA user_version`. On every app start, any migration newer than that version runs once (`src/db/migrations.ts`).

| Version | Change |
| ------- | ------ |
| 1 | Create all tables |
| 2 | Make `goals.protein`, `goals.carbs` and `goals.fat` optional. SQLite can't drop `NOT NULL`, so the table is rebuilt and its rows copied over |

All dates compared against "today" use the phone's local date, passed in by the app, not SQLite's `now` (which is UTC).

## Relationships

```
goals ──< weekday_goals
  │
  └──(copied into)── days ──< meal_entries ──< food_entries
                                   │                 │
                          meals ───┘        foods ───┘
```

`──<` means "one to many" (e.g. one day has many meal entries).

## Totals

Meal and day totals are not stored. They are calculated from the food entries when displayed, so they can never be out of date.

## Fixed lists

These lists live in the app's code, not in the database. The database stores the key, and the app shows the translated label. Each food has exactly one type.

### Food types

| Key             | English               | Spanish                  |
| --------------- | --------------------- | ------------------------ |
| `beef`          | Beef                  | Ternera                  |
| `pork`          | Pork                  | Cerdo                    |
| `poultry`       | Poultry               | Aves                     |
| `lamb`          | Lamb                  | Cordero                  |
| `fish`          | Fish                  | Pescado                  |
| `seafood`       | Seafood               | Marisco                  |
| `eggs`          | Eggs                  | Huevos                   |
| `dairy`         | Dairy                 | Lácteos                  |
| `grains`        | Grains, bread & pasta | Cereales, pan y pasta    |
| `legumes`       | Legumes               | Legumbres                |
| `vegetables`    | Vegetables            | Verduras                 |
| `fruit`         | Fruit                 | Fruta                    |
| `nuts_seeds`    | Nuts & seeds          | Frutos secos y semillas  |
| `fats_oils`     | Fats & oils           | Grasas y aceites         |
| `sweets_snacks` | Sweets & snacks       | Dulces y aperitivos      |
| `drinks`        | Drinks                | Bebidas                  |
| `sauces`        | Sauces & condiments   | Salsas y condimentos     |
| `prepared`      | Prepared meals        | Platos preparados        |
| `other`         | Other                 | Otros                    |

### Units

There is no unit conversion in v1: a food is always logged in its own unit.

| Key       | English    | Spanish     |
| --------- | ---------- | ----------- |
| `g`       | g          | g           |
| `ml`      | ml         | ml          |
| `serving` | serving    | ración      |
| `piece`   | piece      | unidad      |
| `slice`   | slice      | rebanada    |
| `cup`     | cup        | taza        |
| `tbsp`    | tablespoon | cucharada   |
| `tsp`     | teaspoon   | cucharadita |
