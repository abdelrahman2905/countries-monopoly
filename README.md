# 🌍 Countries Monopoly

A real-time multiplayer, Monopoly-style web game where the properties are **countries**.
Buy countries, collect rent, and bankrupt your opponents. The last player standing wins.

- **Frontend:** React + Vite + TypeScript + Tailwind CSS (`/src`)
- **Realtime server:** [PartyKit](https://www.partykit.io) (`/party`) — one room per game
- **Shared rules engine:** `/shared/game.ts` (pure TypeScript, used by the server; the client only reads types and board data)

## How it plays

- Create a room, share the 5-character code (or the link), and 2–6 players join. The host can add 🤖 bots.
- Everyone starts with **$1500**. Passing **Go** pays **$200**.
- Roll two dice. Land on an unowned country to **buy** it; land on an owned one and you pay **rent**.
  Owning every country of a color set doubles its rent. Doubles give you another roll.
- 32 squares: Go, Jail, Free Parking, Go To Jail, 4 Chance squares, 24 countries.
- Rents inflate by 15% every 3 rounds so games always end.
- Can't pay? You're bankrupt and out. Your countries return to the bank.
- **Server-authoritative:** the server rolls dice, moves pieces, handles money and turn order. Clients only send intents (`ROLL`, `BUY`, `END_TURN`, …), and the server rejects anything illegal.
- If a player disconnects mid-game, the server auto-plays their turns; they can rejoin with the same browser.

## Run locally

Requires Node 18+.

```bash
npm install
npx partykit dev     # terminal 1: game server on http://127.0.0.1:1999
npm run dev          # terminal 2: frontend on http://localhost:5173
```

Open http://localhost:5173 in two browser tabs to test multiplayer. No configuration needed locally
(the frontend defaults to `127.0.0.1:1999`).

Other scripts: `npm run build` (typecheck + production build), `npm test` (simulates 200 full bot games against the rules engine).

## Deploy

### 1. PartyKit server first

```bash
npx partykit login
npx partykit deploy
```

It prints your host, like `countries-monopoly.<your-username>.partykit.dev`.

> ⚠️ PartyKit's docs state the hosted PartyKit platform shuts down on **23 October 2026** and point to a migration guide
> to PartyServer (Cloudflare Workers). Check https://docs.partykit.io before relying on the hosted service.

### 2. Frontend on Vercel

1. Push this repo to GitHub and import it at https://vercel.com/new (framework preset: **Vite**; build command `npm run build`; output `dist`).
2. Add an environment variable:
   `VITE_PARTYKIT_HOST` = `countries-monopoly.<your-username>.partykit.dev` (host only, no `https://`).
3. Deploy. Or with the CLI: `npx vercel` then `npx vercel --prod`.

See `.env.example`. Never commit a real `.env` file (it's git-ignored). The app uses no secrets or API keys.

## Project structure

```
party/index.ts     PartyKit server (rooms, connections, bot timers)
party/selftest.ts  Headless rules test
shared/game.ts     Board data + authoritative game engine
src/               React app (lobby, board, game UI)
```
