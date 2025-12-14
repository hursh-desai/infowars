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
│   ├── live/[slug]/       # Live debate viewer
│   ├── profile/           # User profiles and edit
│   ├── challenges/        # Challenge management
│   ├── archive/[debateId]/ # Archived debate transcripts
│   └── setup/             # Username setup for new users
├── convex/                # Convex backend functions
│   ├── schema.ts          # Database schema
│   ├── users.ts           # User queries/mutations
│   ├── debates.ts         # Debate queries/mutations
│   ├── messages.ts        # Debate message mutations
│   ├── spectatorMessages.ts # Spectator chat
│   ├── challenges.ts      # Challenge system
│   └── follows.ts         # Follow/unfollow functionality
├── components/            # React components
│   ├── DebateCard.tsx
│   ├── LiveDebateViewer.tsx
│   ├── DebateTimer.tsx
│   ├── SpectatorChat.tsx
│   ├── ChallengeForm.tsx
│   └── FollowButton.tsx
└── lib/                   # Utility functions
    └── convex-provider.tsx
```

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

## License

MIT
