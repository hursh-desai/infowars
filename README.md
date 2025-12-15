# Info Wars - Debate Platform

A neutral platform for debate where people wear their ideologies on their profile with pride and archive links to media they believe in.

## Features

- **Live Debates**: Real-time text debates between two users with a structured format (Opening Remarks, Point 1-3, Closing Remarks)
- **Timed Rounds**: Each participant gets 1 minute per round in a rapid-fire format
- **Spectator Chat**: Viewers can chat alongside live debates
- **Challenge System**: Send and receive debate challenges with scheduled times
- **User Profiles**: Showcase your ideologies, social media links, and highlighted media
- **Debate Archive**: All completed debates are automatically archived and linked from participant profiles
- **Following System**: Follow users to stay updated on their debates
- **Search**: Search for users by handle, debates by title, or browse hashtags (ideology tags)

## Tech Stack

- **Next.js 16** (App Router) - Frontend framework
- **Convex** - Real-time backend, database, and subscriptions
- **Clerk** - Authentication and user management
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Convex account (sign up at [convex.dev](https://convex.dev))
- Clerk account (sign up at [clerk.com](https://clerk.com))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd infowars
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex:
```bash
npx convex dev
```
This will prompt you to create a new Convex project or connect to an existing one. Follow the prompts.

4. Set up Clerk:
   - Create a new application in your Clerk dashboard
   - Copy your publishable key and secret key
   - **Configure Phone-Only Authentication** (required):
     1. Go to **User & Authentication** → **Email, Phone, Username**
     2. **Disable** Email authentication
     3. **Enable** Phone number authentication
     4. Set Phone number as **required**
     5. Go to **User & Authentication** → **Social Connections**
     6. **Disable** all OAuth providers (Google, GitHub, etc.)
     7. Go to **Customization** → **Components**
     8. Ensure "Allow password authentication" is **disabled**
     9. Verify that OTP verification is enabled for phone numbers
   
   **Note**: This application uses phone number OTP authentication exclusively. No OAuth providers, passwords, email, or name fields are used.

5. Create `.env.local` file:
```env
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── app/                    # Next.js app router pages
│   ├── (shell)/           # Shell route group (responsive layout)
│   │   ├── layout.tsx     # Shell layout with header + mobile nav
│   │   ├── @modal/        # Parallel route slot for modals
│   │   ├── @panel/        # Parallel route slot for panels
│   │   ├── page.tsx       # Home page
│   │   ├── live/[slug]/   # Live debate viewer with panel slot
│   │   ├── profile/       # User profiles and edit
│   │   ├── challenges/    # Challenge management
│   │   ├── archive/       # Archived debate transcripts
│   │   └── search/        # Search results page
│   ├── setup/             # Username setup for new users
│   └── layout.tsx         # Root layout (Clerk + Convex providers)
├── convex/                # Convex backend functions
│   ├── schema.ts          # Database schema
│   ├── users.ts           # User queries/mutations
│   ├── debates.ts         # Debate queries/mutations
│   ├── messages.ts        # Debate message mutations
│   ├── spectatorMessages.ts # Spectator chat
│   ├── challenges.ts      # Challenge system
│   ├── follows.ts         # Follow/unfollow functionality
│   └── search.ts          # Search functionality
├── components/            # React components
│   ├── DebateCard.tsx
│   ├── LiveDebateViewer.tsx
│   ├── DebateTimer.tsx
│   ├── SpectatorChat.tsx
│   ├── ChallengeForm.tsx
│   ├── ChallengeCompose.tsx
│   ├── FollowButton.tsx
│   ├── Header.tsx         # Responsive header (desktop nav)
│   ├── MobileNav.tsx      # Bottom navigation (mobile)
│   └── RouteModal.tsx     # Reusable modal wrapper
└── lib/                   # Utility functions
    └── convex-provider.tsx
```

## Responsive Architecture

The platform uses a responsive shell architecture with route-driven modals and panels for optimal UX on both desktop and mobile.

### Shell Layout (`app/(shell)/layout.tsx`)

All main pages are wrapped in a `(shell)` route group that provides:
- **Unified Layout**: Compact header with title and search icon (same on all screen sizes)
- **Bottom Navigation**: Bottom tab navigation bar visible on all screen sizes (Home, Search, Challenges, Profile)
- Consistent background, padding, and container styling
- Parallel route slots for modals (`@modal`) and panels (`@panel`)

### Route-Driven Modals (`@modal`)

Modals are implemented using Next.js parallel routes and intercepting routes:
- **Desktop**: Renders as centered overlay with backdrop
- **Mobile**: Renders as full-screen sheet/page
- URL-driven: Each modal has its own route, so deep linking and browser back button work correctly

**Example**: Profile edit modal
- Route: `app/(shell)/@modal/(.)profile/edit/page.tsx`
- When navigating to `/profile/edit` from within the app, it intercepts and shows as modal
- Direct navigation to `/profile/edit` still works as a full page

**Adding a new modal**:
1. Create `app/(shell)/@modal/(.)your-route/page.tsx`
2. Wrap content in `<RouteModal>` component
3. Navigate to the route normally - it will show as modal when intercepted

### Panel Slots (`@panel`)

Panels are used for secondary content that should be visible alongside main content:
- **Desktop**: Always visible in sidebar (e.g., spectator chat in live debates)
- **Mobile**: Hidden by default, opens via route (e.g., `/live/[slug]/chat`)

**Example**: Live debate chat panel
- Default panel: `app/(shell)/live/[slug]/@panel/default.tsx` (shows chat on desktop)
- Chat route: `app/(shell)/live/[slug]/@panel/chat/page.tsx` (full-screen on mobile)

**Adding a new panel**:
1. Create a layout for your route that accepts `panel` prop
2. Create `@panel/default.tsx` for desktop default state
3. Create `@panel/your-panel/page.tsx` for mobile route-driven panel

## Key Features Implementation

### Debate Flow

1. **Challenge Creation**: Users can challenge others by searching their username, providing a debate title, and scheduling a time
2. **Challenge Acceptance**: When a challenge is accepted, a debate is automatically created
3. **Live Debate**: Debates start at the scheduled time and follow a structured format:
   - Opening Remarks (Participant 1 → Participant 2)
   - Point 1 (Participant 1 → Participant 2)
   - Point 2 (Participant 1 → Participant 2)
   - Point 3 (Participant 1 → Participant 2)
   - Closing Remarks (Participant 1 → Participant 2)
4. **Timer**: Each round has a 1-minute timer. The system automatically advances to the next turn/round
5. **Archive**: Completed debates are automatically archived and accessible from participant profiles

### User Profiles

- **Ideology Tags**: Freeform tags that users can add to their profile
- **Social Links**: X (Twitter) and BlueSky profile links
- **Highlighted Media**: Users can add media links they believe in
- **Debate Archive**: All completed debates are listed on the profile

### Real-time Features

- Live debate updates using Convex subscriptions
- Real-time spectator chat
- Live viewer count updates
- Automatic round advancement

### Search Functionality

- **User Search**: Search for users by username or display name
- **Debate Search**: Find debates by title
- **Hashtag Search**: Browse ideology tags (hashtags) used by users
- **Live Search Dropdown**: Real-time search results appear as you type
- **Search Results Page**: Dedicated page showing all matching users, debates, and hashtags

## Development

### Running Convex Dev

```bash
npx convex dev
```

This watches for changes and pushes updates to your Convex deployment.

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key

### Push Notifications (Optional)

For web push notifications to work, you need:

1. **VAPID Keys**: Generate VAPID keys for web push:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Frontend Environment Variable** (`.env.local`):
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
   ```

3. **Convex Secrets** (set in Convex dashboard):
   - `VAPID_PUBLIC_KEY` - Your VAPID public key
   - `VAPID_PRIVATE_KEY` - Your VAPID private key
   - `VAPID_SUBJECT` - Email or URL (e.g., `mailto:notifications@yourdomain.com`)

4. **Install web-push**: The `web-push` package is already included in `package.json`. Make sure to run `npm install` to install it.

## Push Notifications

The platform supports web push notifications for:
- **Challenge Created**: Notifies the recipient when they receive a new challenge
- **Challenge Accepted**: Notifies the challenger when their challenge is accepted
- **Debate Starts**: Notifies both participants when a scheduled debate begins

Users can enable/disable notifications in their profile settings. Notifications work when the app is installed as a PWA on mobile devices.

## License

MIT
