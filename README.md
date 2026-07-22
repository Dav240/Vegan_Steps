# Vegan Steps

Vegan Steps is a full-stack vegan recipe discovery and publishing platform. Users can browse approved community recipes, save favourites, write and submit their own recipes, manage profile details, and receive personalised recipe recommendations. The app also includes concrete moderation workflows for submitted recipes and reports, image safety checks before upload, privacy controls, and email-based account verification.

This project is built as a portfolio-grade web application, with attention paid to real product concerns: authentication, database modelling, draft and review states, safe image handling, account recovery, soft deletion, legal/privacy preferences, and reusable UI architecture.

## Highlights

- **Recipe discovery**: Explore approved recipes through searchable, filterable, sortable recipe libraries and recommendation rows.
- **Recipe writing flow**: Create drafts, upload images, add ingredients, tags, preparation steps, and cooking steps, then submit recipes for review.
- **Saved recipes and user library**: Users can save recipes, manage their own recipes, and view recently saved & recently updated recipes.
- **Moderation system**: Moderators can review pending recipes, handle reports, approve or reject submissions, and soft-delete harmful content.
- **Account security**: Registration email codes, password reset links, signed session cookies, password validation, and deleted-user login prevention.
- **Image safety pipeline**: Browser uploads go through Next.js API routes, Sightengine moderation, then Cloudinary storage.
- **Privacy controls**: Users can manage optional data collection, delete optional data, and request account deletion.
- **Responsive UI**: Full desktop and mobile layouts.

## Tech Stack

- **Framework**: Next.js 16 App Router, React 19, TypeScript
- **Database**: PostgreSQL with Prisma 7
- **Styling**: Tailwind CSS 4, shadcn-style components, Radix/Base UI primitives, Lucide icons
- **Authentication**: Custom signed cookie sessions with bcrypt password hashing
- **Images**: Cloudinary upload/storage with Sightengine moderation checks
- **Email**: Resend for verification and password reset emails
- **Tooling**: ESLint, Prisma migrations, production build checks

## Core Features

### Users

- Register with email verification
- Login/logout with signed session cookies
- Reset forgotten passwords through email links
- Edit username and email with validation
- Change password through the same secure reset flow
- Manage privacy preferences and optional data
- Soft-delete account

### Recipes

- Browse approved recipes
- Search by recipe name
- Sort by most recent, popularity, or highest rating
- Filter by rating range, status, and tag categories
- Save/unsave recipes dynamically
- Rate recipes, with author self-rating prevented
- View recipe details, ingredients, servings, prep instructions, and cooking instructions
- Track approved recipe views for recommendations

### Recipe Writing

- Create new recipe drafts
- Save drafts before submission
- Upload and replace images
- Scan uploaded images before Cloudinary storage
- Add ingredients with quantities and units
- Add preparation and cooking instructions
- Add tags from categorised tag groups
- Submit recipes for moderation
- Copy approved recipes into a new editable recipe draft

### Moderation

- Moderator-only home page
- Review submitted recipes
- Approve or deny recipes with rejection reasons
- View reported recipes and report history
- Dismiss reports, delete recipes, or ban users through soft deletion
- Keep moderation data separate from normal user flows

## Project Structure

```text
app/
  api/                  API routes for auth, recipes, profile, reports, moderation
  explore/              Recipe discovery page
  legal/                Legal, privacy, and policy information
  moderator/            Moderator dashboard
  my-recipes/           Current user's recipe library
  profile/              Profile and account settings
  recipes/              Recipe viewing and writing pages
  saved-recipes/        Saved recipe library

_components/
  ads/                  Ad slot placeholders
  home/                 Visitor home components
  legal/                Legal and privacy UI
  login/                Login, register, password reset UI
  moderator/            Moderator dashboard components
  profile/              Profile sections
  recipes/              Recipe cards, recipe view, writing, library UI
  ui/                   Shared UI primitives

lib/
  auth-session.ts       Signed cookie session helpers
  cloudinary.ts         Cloudinary configuration
  email-verification.ts Verification code lifecycle
  image-moderation.ts   Sightengine image checks
  legal.ts              Legal/privacy preference helpers
  mail.ts               Branded email templates and sending
  prisma.ts             Prisma client setup
  recipe-draft.ts       Draft helpers
  recipe-tags.ts        Tag/category helpers
```

## Database Overview

The Prisma schema models the main product workflow:

- `User`: account data, privacy choices, deletion state, role
- `Recipe`: draft, pending, approved, rejected, and removed recipes
- `Ingredient`: ordered recipe ingredients
- `InstructionStep`: preparation and cooking instructions
- `SavedRecipe`: many-to-many saved recipe relationship
- `Rating`: user recipe ratings
- `Report`: user reports and moderator decisions
- `EmailVerificationCode`: registration, email-change, and password-reset codes
- `RecipeView`: recent viewing signals for recommendations

## Getting Started

Install dependencies:

```bash
npm install
```

Generate the Prisma client and apply database migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Quality Checks

Before sharing or deploying, run:

```bash
npm run lint
npm run build
```

These checks help catch TypeScript, routing, and production build issues before they appear in deployment.

## Notes

Vegan Steps demonstrates more than a basic CRUD application. It includes:

- Custom auth/session handling instead of relying entirely on a plug-and-play auth provider
- A relational Prisma schema with role-based workflows
- Moderation and reporting flows for user-generated content
- Image upload safety checks before external storage
- Email verification and password recovery
- User privacy controls and soft deletion
- Search, filtering, sorting, and recommendation-oriented recipe discovery
- Reusable component architecture across recipe cards, profile pages, recipe writing, and libraries

The project is intentionally built around real-world product constraints: user safety, account security, content moderation, responsive UI, data retention, and future deployment.

## Status

Vegan Steps is currently an in-progress portfolio project. Core user, recipe, profile, discovery, moderation, email, and image-upload flows are implemented, with ongoing work planned around deployment, polish, recommendation tuning, and production hardening.
