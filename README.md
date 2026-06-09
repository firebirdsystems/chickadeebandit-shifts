# Shift Scheduler

A [Chickadee Bandit](http://chickadeebandit.com) app.

## Features

- **Leadership** (adults/admins) creates recurring duties (cook night, house cleaning, front desk, security, etc.) and assigns members to a weekly grid
- **Generate Rotation** auto-fills a date range with a round-robin or fixed-weekday rotation across selected members
- **Members** see their own upcoming shifts in a simple list, sorted by date
- All assignments update instantly (optimistic UI) — no waiting on round-trips
- Designed for adult rotations in shared orgs/houses — no points or allowance, unlike Chores

## Install

In your hub, go to **Apps → Install from URL** and paste:

```
https://github.com/firebirdsystems/chickadeebandit-shifts/releases/latest/download/bundle.json
```

## Development

See the [app-template](https://github.com/firebirdsystems/chickadeebandit-app-template) for build instructions and the full manifest field reference.

## Data model

Stored in the app's own database (`storage: "db"`):

- `shift_types` — recurring duty definitions (name, emoji, color)
- `shifts` — one row per duty-day assignment (`shift_type_id`, `date`, `member_id`)
- `activity` — audit log of shift assignments and changes

## Hub data access

This app reads `family.members` to display names, roles, and avatars. It does not write any family data — all shift data is stored privately in the app's own database.
