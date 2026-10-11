# Lanterns at Low Tide

An original lane-defense browser game about guiding sea spirits home. Five harbor lanes, four complementary keepers, nine processions across three chapters, and a Drowned Admiral finale. Hand-authored SVG art, responsive controls and synthesized chimes. No runtime network requests, paid services or public deployment.

## Play

```sh
npm ci
npm run build
npm run play
```

Open http://127.0.0.1:5190. `npm run play` safely starts a detached session-only server, refuses occupied ports, and reuses only this game's server. No login or boot autostart. Logs and PID are in `.play/`. Override with `PORT=5191 npm run play` if needed. Earlier repositories and servers are untouched.

Collect golden motes; place Wicks for income, Bells for ranged damage, Frost for slowing and armor piercing, and Anchors ahead of shooters. Select an occupied tile to upgrade or salvage. Use 1–4 to select keepers, Escape to cancel and Space to pause (focused buttons keep standard Enter/Space activation). Preparation has no deadline; call each procession when ready. 1×/2×/4× speeds affect the tide. Three breaches lose the current chapter; retry begins it fresh. The finale is saved; replay is explicit.

Saves use localStorage on this origin. Reload pauses an active voyage; hidden tabs pause, with no offline income. Corrupt or unsupported saves reset with feedback. Browser storage restrictions show a warning. Clearing browser data removes progress. Sound is opt-in; effects accompany actions.

## Development

`npm run dev`, `npm run check`, `npm audit`. Strict TypeScript/Vite with Vitest at the public command, simulation and save seams. CI runs checks and audit on every push. See [spec](docs/spec.md), [verification](docs/verification.md), [reviews](docs/review.md), [glossary](GLOSSARY.md), and [ADR](docs/adr/0001-simulation-and-save.md).
