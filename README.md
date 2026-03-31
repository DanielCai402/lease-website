# NYCRentals

A bilingual (Chinese/English) rental listings platform for the Chinese community in New York and New Jersey. Landlords and tenants can browse and post short-term rental and sublet listings.

## Features

- Browse rental listings with filtering by type, borough, price range, and move-in date
- Detailed listing pages with image galleries, maps, and contact info
- Post new listings with a comprehensive 8-section form
- Two rental types: entire unit and room/sublet
- Dual pricing: monthly and daily rates
- Coverage: NYC's five boroughs + Jersey City, Hoboken, and Hudson County
- WeChat-first contact model
- Full Chinese/English internationalization

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **i18n:** next-intl
- **Maps:** Leaflet + OpenStreetMap / Nominatim

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app defaults to the `/zh/` (Chinese) locale.

## Project Structure

```
app/                  # Next.js App Router pages
components/           # React components
lib/                  # Utilities, types, and mock data
i18n/                 # i18n routing and request config
messages/             # en.json and zh.json translation files
proxy.ts              # Middleware for locale routing
```

## Locales

| URL prefix | Language |
|------------|----------|
| `/zh/`     | Chinese (default) |
| `/en/`     | English |

## Status

Currently in development with static mock data. No database is connected yet. Planned next steps include Supabase integration, user authentication, and Vercel deployment.
