# 🌍 Countries Monopoly

A real-time multiplayer, Monopoly-style web game where the properties are **countries**.
Buy countries, collect rent, and bankrupt your opponents. The last player standing wins.

- **Frontend:** React + Vite + TypeScript + Tailwind CSS (`/src`)
- **Realtime server:** [PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver) (the PartyKit API) on Cloudflare Workers (`/party`), one room per game
- **Shared rules engine:** `/shared/game.ts` (pure TypeScript, used by the server; the client only reads types and board data)

## How it plays

- Create a room, share the 5-character code (or the link), and 2–6 players join. The host can add 🤖 bots.
- **Animations:** dice tumble when rolled, pieces hop square by square, and a country's owner bar lights up in the
  buyer's color when it is bought.
- **Landing on a free country:** buy it, skip it, or put it up for **auction**. Everyone can bid at any time with
  +$2, +$5 or +$50 buttons; the auction closes a few seconds after the last bid (host can turn auctions off).
- **Bank loans** (optional, host setting): borrow $200 to $2000 on your turn and repay within 5 rounds (+ interest).
  If you can't pay when it's due, the bank takes your cash if you have enough, otherwise you must choose a country to
  sell to the bank.
- **Every player picks their own name and piece color** in the lobby.
- **The host picks the room settings** in the lobby: starting money, Go salary, bonus salary, turn timer, max players,
  houses & hotels on/off, rent inflation on/off, roll-again-on-doubles, and a Free Parking jackpot.
- **Go salary:** $300 every time you pass Go; from round 5 on it becomes a $1000 bonus salary (both configurable).
- **Chance cards:** mostly payouts (tourism boom, lottery, inheritance...), birthday cards where every player pays you
  $50 or $30, but also property repairs ($15 per country, $40 per house, $50 per hotel), a $50 global tax day, fines,
  jail, and moving around the board.
- **Stable:** the server saves each game, so a server restart doesn't lose the match; players reconnect automatically;
  an optional turn timer plays for idle players; offline players are auto-played; abandoned rooms pause.
- Roll two dice. Land on an unowned country to **buy** it; land on an owned one and you pay **rent**.
- **Houses & hotels:** once you own *every* country of a color set, its rent doubles and you can build (on your turn,
  tap a country, then Build). Build evenly: up to 4 houses, then a hotel. Rent climbs steeply with each level.
- 40 squares: Go, Jail, Free Parking, Go To Jail, 4 Chance squares, **32 countries** in 12 color sets.
  Each country tile shows its real flag, its outline and its flag colors.
- With rent inflation on (default), rents rise 15% every 3 rounds so games always end.
- Can't pay? You're bankrupt and out. Your countries return to the bank.
- **Server-authoritative:** the server rolls dice, moves pieces, handles money and turn order. Clients only send intents (`ROLL`, `BUY`, `END_TURN`, …), and the server rejects anything illegal.
- If a player disconnects mid-game, the server auto-plays their turns; they can rejoin with the same browser.

## Run locally

Requires Node 18+.

```bash
npm install
npm run party        # terminal 1: game server (wrangler dev) on http://127.0.0.1:1999
npm run dev          # terminal 2: frontend on http://localhost:5173
```

Open http://localhost:5173 in two browser tabs to test multiplayer. No configuration needed locally
(the frontend defaults to `127.0.0.1:1999`).

Other scripts: `npm run build` (typecheck + production build), `npm test` (simulates 200 full bot games against the rules engine).

## Deploy

### 1. Game server first (Cloudflare Workers)

The hosted PartyKit platform shuts down on 23 October 2026, so the server uses **PartyServer** (PartyKit's official
successor, same API) on Cloudflare Workers + Durable Objects. The free plan is enough. Each room is a Durable Object.

```bash
npx wrangler login
npx wrangler deploy      # or: npm run deploy:server
```

It prints your host, like `countries-monopoly.<your-subdomain>.workers.dev`.

### 2. Frontend on Vercel

1. Push this repo to GitHub and import it at https://vercel.com/new (framework preset: **Vite**; build command `npm run build`; output `dist`).
2. Add an environment variable:
   `VITE_PARTYKIT_HOST` = `countries-monopoly.<your-subdomain>.workers.dev` (host only, no `https://`).
   (The variable keeps its name; it just holds the game server host.)
3. Deploy. Or with the CLI: `npx vercel` then `npx vercel --prod`.

See `.env.example`. Never commit a real `.env` file (it's git-ignored). The app uses no secrets or API keys.

## Project structure

```
party/index.ts     Game server (rooms, connections, bot timers, persistence)
wrangler.jsonc     Cloudflare Worker + Durable Object config
party/selftest.ts  Headless rules test
shared/game.ts     Board data, settings + authoritative game engine
src/               React app (lobby, board, game UI)
public/flags/      Flag SVGs (from the MIT-licensed flag-icons package)
src/data/shapes.json  Country outlines (from Natural Earth via world-atlas)
scripts/gen-assets.mjs  Regenerates the flags and outlines (npm run assets)
```
