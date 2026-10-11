import "./style.css";
import {
  KEEPERS,
  SPIRITS,
  CHAPTERS,
  createGame,
  place,
  collect,
  upgrade,
  salvage,
  startWave,
  step,
  advance,
  encode,
  decode,
  active,
  procession,
  type Kind,
} from "./game";
import { portrait } from "./art";
import { tone, toggleSound } from "./audio";
const key = "lanterns-low-tide-v1";
let storageOk = true,
  raw: string | null = null;
try {
  raw = localStorage.getItem(key);
} catch {
  storageOk = false;
}
let game = decode(raw) ?? createGame();
let selection: Kind | null = null,
  focusId: number | null = null,
  showHelp = !raw,
  resetConfirm = false;
let notice = raw
  ? decode(raw)
    ? active(game)
      ? "Harbor restored. Resume when ready."
      : "Your completed voyage is restored."
    : "Unreadable save replaced with a fresh harbor."
  : "Choose a keeper, then choose a pier tile.";
let noticeTime = 0;
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<main><header><div class="brand"><span class="eyebrow">A HARBORKEEPER’S TALE</span><h1>Lanterns <i>at Low Tide</i></h1></div><nav><button id="help">Field guide</button><button id="sound">Sound off</button><button id="reset">New voyage</button></nav></header><section class="chapter"><div><span id="chapter-number" class="eyebrow"></span><h2 id="chapter-title"></h2><p id="story"></p></div><div class="moon">☾<span>KEEP THE LIGHT</span></div></section><section class="hud"><div class="resource"><span>✦</span><strong id="light"></strong><small>LIGHT</small></div><div><strong id="wave"></strong><small id="phase"></small></div><div><strong id="lives"></strong><small>HARBOR SEALS</small></div><div class="controls"><button id="speed">1× tide</button><button id="pause">Pause</button><button id="start" class="primary">Call procession</button></div></section><section class="layout"><aside><h3>Your keepers</h3><p class="hint">Choose a keeper • tap a tile</p><div id="cards"></div><button id="cancel">Cancel selection · Esc</button><div id="inspector"></div></aside><div class="battle-area"><div class="board-heading"><span>← LIGHTHOUSE</span><span id="forecast"></span><span>OPEN SEA →</span></div><div id="lane-forecast" aria-label="Next procession lane forecast"></div><div id="board"><div class="water-lines"></div><div id="tiles"></div><div id="actors"></div><div id="motes"></div><div id="overlay"></div></div><div class="status"><span id="notice" role="status" aria-live="polite"></span><span id="save-status"></span></div><div class="legend"><span>◌ Drifter · steady</span><span>↝ Runner · quick</span><span>◈ Shellback · armored</span><span>♛ Admiral · immense</span></div></div></section><footer>Collect the floating ✦ light. Wicks sustain your harbor. Put Anchors ahead of Bells; Frost keeps the procession slow.<span>Click / tap • 1–4 keepers • Space pause • Esc cancel</span></footer></main><dialog id="guide"><span class="eyebrow">THE HARBORKEEPER’S FIELD GUIDE</span><h2>Small lights. Long shadows.</h2><p>Sea spirits enter from the right. Keep them from reaching the lighthouse on the left. Three breaches end the chapter.</p><ol><li><b>Prepare:</b> start with a Wick and Bells across the five lanes. Preparation has no deadline; collect light while you plan.</li><li><b>Collect:</b> tap golden motes for light. Wicks produce more. Defeated spirits give 12 light.</li><li><b>Combine:</b> Bells attack to their right. Put an Anchor in front; Frost slows enemies and pierces shell armor.</li><li><b>Improve:</b> tap an occupied tile, then upgrade for its original cost. Tier II restores health and improves performance. Salvage returns half the base cost.</li><li><b>Survive:</b> three processions per chapter. Forecast tells you the next threats. Your formation carries between waves; each new chapter begins fresh.</li></ol><p>Progress saves automatically. Reload returns paused. Switching tabs pauses too. Use 4× tide during preparation or to speed up a confident defense.</p><button id="close-help" class="primary">Keep the lights burning</button></dialog>`;
const el = (id: string) => document.getElementById(id)!;
const kinds = Object.keys(KEEPERS) as Kind[];
el("cards").innerHTML = kinds
  .map(
    (k, i) =>
      `<button class="card" data-kind="${k}">${portrait(k)}<div><b>${i + 1} · ${KEEPERS[k].name}</b><span>✦ ${KEEPERS[k].cost}</span><small>${KEEPERS[k].description}</small></div></button>`,
  )
  .join("");
el("tiles").innerHTML = Array.from(
  { length: 35 },
  (_, i) =>
    `<button class="tile" data-row="${Math.floor(i / 7)}" data-col="${i % 7}" aria-label="Lane ${Math.floor(i / 7) + 1}, tile ${(i % 7) + 1}"><span>${Math.floor(i / 7) + 1}</span></button>`,
).join("");
function save() {
  try {
    localStorage.setItem(key, encode(game));
    storageOk = true;
  } catch {
    storageOk = false;
  }
  el("save-status").textContent = storageOk
    ? "Saved locally"
    : "Save unavailable · keep this tab open";
}
function message(text: string) {
  notice = text;
  noticeTime = performance.now();
}
function select(k: Kind) {
  if (!active(game) || game.paused) {
    message("Resume an active harbor to place keepers.");
    return;
  }
  selection = selection === k ? null : k;
  focusId = null;
  message(
    selection
      ? `${KEEPERS[k].name} selected. Choose an empty tile.`
      : "Selection cancelled.",
  );
  render();
}
el("cards").addEventListener("click", (e) => {
  const button = (e.target as Element).closest<HTMLButtonElement>(
    "[data-kind]",
  );
  if (button) select(button.dataset.kind as Kind);
});
el("tiles").addEventListener("click", (e) => {
  const button = (e.target as Element).closest<HTMLButtonElement>("[data-row]");
  if (!button) return;
  const row = Number(button.dataset.row),
    col = Number(button.dataset.col);
  const k = game.keepers.find((k) => k.row === row && k.col === col);
  if (k) {
    focusId = k.id;
    selection = null;
    message(
      `${KEEPERS[k.kind].name} · Tier ${k.tier}. Upgrade or salvage below.`,
    );
  } else if (selection) {
    if (place(game, selection, row, col)) {
      message(
        `${KEEPERS[selection].name} placed. Select again to place another.`,
      );
      selection = null;
      tone(520);
      save();
    } else
      message(
        game.paused
          ? "Resume before placing."
          : "Not enough light. Collect motes or wait for your Wicks.",
      );
  } else {
    focusId = null;
    message("Choose a keeper first.");
  }
  render();
});
el("motes").addEventListener("click", (e) => {
  const m = (e.target as Element).closest<HTMLButtonElement>("[data-mote]");
  if (m && collect(game, Number(m.dataset.mote))) {
    tone(880);
    message("Light collected.");
    save();
    render();
  }
});
el("cancel").onclick = () => {
  selection = null;
  focusId = null;
  message("Selection cancelled.");
  render();
};
el("inspector").onclick = (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>("button");
  if (!b || focusId === null) return;
  const success =
    b.dataset.action === "upgrade"
      ? upgrade(game, focusId)
      : salvage(game, focusId);
  message(
    success ? "Keeper updated." : "Cannot update: check light, tier and pause.",
  );
  if (success) {
    tone(600);
    save();
  }
  render();
};
el("start").onclick = () => {
  if (startWave(game)) {
    selection = null;
    focusId = null;
    message("The procession approaches. Watch every lane.");
    tone(220);
    save();
    render();
  }
};
function pause() {
  if (!active(game) || resetConfirm) return;
  game.paused = !game.paused;
  selection = null;
  message(game.paused ? "Tide paused. Your harbor is safe." : "Tide resumed.");
  save();
  render();
}
el("pause").onclick = pause;
el("speed").onclick = () => {
  game.speed = game.speed === 1 ? 2 : game.speed === 2 ? 4 : 1;
  save();
  render();
};
el("sound").onclick = () => {
  el("sound").textContent = toggleSound() ? "Sound on" : "Sound off";
};
const guide = el("guide") as HTMLDialogElement;
el("help").onclick = () => {
  if (active(game)) game.paused = true;
  selection = null;
  guide.showModal();
  save();
  render();
};
el("close-help").onclick = () => {
  guide.close();
  showHelp = false;
  render();
};
el("reset").onclick = () => {
  resetConfirm = true;
  game.paused = active(game);
  selection = null;
  render();
};
el("overlay").onclick = (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>("button");
  if (!b) return;
  if (b.id === "keep-voyage") {
    resetConfirm = false;
  }
  if (b.id === "confirm-reset") {
    game = createGame();
    resetConfirm = false;
    focusId = null;
    message("A new voyage begins.");
  }
  if (b.id === "resume") pause();
  if (b.id === "retry") {
    game = createGame(game.chapter);
    focusId = null;
    message("Fresh supplies. Try a different formation.");
  }
  if (b.id === "next") {
    game = advance(game);
    focusId = null;
    message("The harbor remembers your light.");
  }
  if (b.id === "replay") {
    game = createGame();
    focusId = null;
  }
  save();
  render();
};
window.addEventListener("keydown", (e) => {
  if (guide.open || e.repeat) return;
  if (e.code === "Escape") {
    selection = null;
    focusId = null;
    render();
  }
  if (e.code === "Space" && !(e.target instanceof HTMLButtonElement)) {
    e.preventDefault();
    pause();
  }
  const i = Number(e.key) - 1;
  if (i >= 0 && i < 4) select(kinds[i]);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && active(game)) {
    game.paused = true;
    selection = null;
    save();
    render();
  }
});
window.addEventListener("pagehide", save);
let lastInspector = "",
  lastMotes = "",
  lastOverlay = "";
function render() {
  const chapter = CHAPTERS[game.chapter];
  el("board").dataset.chapter = String(game.chapter);
  el("board").style.borderColor = chapter.color;
  el("chapter-number").textContent = `CHAPTER 0${game.chapter + 1} / 03`;
  el("chapter-title").textContent = chapter.name;
  el("story").textContent = chapter.story;
  el("light").textContent = String(Math.floor(game.light));
  el("wave").textContent = `Procession ${game.wave + 1} / 3`;
  el("phase").textContent =
    game.phase === "prep"
      ? "Preparation · no deadline"
      : game.phase === "battle"
        ? `${game.enemies.length + game.schedule.length} spirits remain`
        : game.phase === "won"
          ? "Chapter protected"
          : game.phase === "complete"
            ? "The tide has turned"
            : "Harbor breached";
  el("lives").textContent =
    "◆".repeat(3 - game.breaches) + "◇".repeat(game.breaches);
  el("speed").textContent = `${game.speed}× tide`;
  el("pause").textContent = game.paused ? "Resume" : "Pause";
  (el("pause") as HTMLButtonElement).disabled = !active(game) || resetConfirm;
  (el("start") as HTMLButtonElement).disabled =
    game.phase !== "prep" || game.paused;
  el("notice").textContent = notice;
  const preview = procession(game.chapter, game.wave);
  el("forecast").textContent =
    game.phase === "prep"
      ? `NEXT · ${preview.length} spirits${preview.some((s) => s.kind === "shell") ? " · armor" : ""}${preview.some((s) => s.kind === "admiral") ? " · ADMIRAL" : ""}`
      : "Protect all five lanes";
  for (const b of el("cards").querySelectorAll<HTMLButtonElement>(".card")) {
    const kind = b.dataset.kind as Kind;
    b.classList.toggle("selected", selection === kind);
    b.classList.toggle("unaffordable", game.light < KEEPERS[kind].cost);
    b.setAttribute("aria-pressed", String(selection === kind));
  }
  el("lane-forecast").innerHTML =
    game.phase === "prep"
      ? Array.from(
          { length: 5 },
          (_, row) =>
            `<span><b>Lane ${row + 1}</b> ${preview
              .filter((s) => s.row === row)
              .map(
                (s) =>
                  ({
                    drifter: "◌ Drifter",
                    runner: "↝ Runner",
                    shell: "◈ Shell",
                    admiral: "♛ Admiral",
                  })[s.kind],
              )
              .join(" · ")}</span>`,
        ).join("")
      : "";
  el("board").classList.toggle("placing", !!selection);
  for (const b of el("tiles").querySelectorAll<HTMLButtonElement>(".tile")) {
    const k = game.keepers.find(
      (k) => k.row === Number(b.dataset.row) && k.col === Number(b.dataset.col),
    );
    b.classList.toggle("occupied", !!k);
    b.classList.toggle("focused", k?.id === focusId);
    b.setAttribute(
      "aria-label",
      `Lane ${Number(b.dataset.row) + 1}, tile ${Number(b.dataset.col) + 1}${k ? `, ${KEEPERS[k.kind].name}, tier ${k.tier}` : ", empty"}`,
    );
  }
  el("actors").innerHTML =
    game.keepers
      .map(
        (k) =>
          `<div class="actor keeper" style="left:${((k.col + 0.5) / 7) * 100}%;top:${(k.row + 0.5) * 20}%">${portrait(k.kind, k.tier)}<div class="health"><i style="width:${(k.hp / (KEEPERS[k.kind].hp * (k.tier === 2 ? 1.7 : 1))) * 100}%"></i></div></div>`,
      )
      .join("") +
    game.enemies
      .map(
        (e) =>
          `<div class="actor spirit ${e.kind} ${e.slow > 0 ? "slowed" : ""}" style="left:${((e.x + 0.5) / 7) * 100}%;top:${(e.row + 0.5) * 20}%">${portrait(e.kind)}<div class="health"><i style="width:${(e.hp / SPIRITS[e.kind].hp) * 100}%"></i></div></div>`,
      )
      .join("") +
    game.shots
      .map(
        (s) =>
          `<div class="shot ${s.frost ? "ice" : ""}" style="left:${((s.from + 0.5) / 7) * 100}%;top:${(s.row + 0.5) * 20}%;width:${(Math.max(0, s.to - s.from) / 7) * 100}%"></div>`,
      )
      .join("");
  const moteSignature = game.motes.map((m) => m.id).join(",");
  if (moteSignature !== lastMotes) {
    lastMotes = moteSignature;
    el("motes").innerHTML = game.motes
      .map(
        (m, i) =>
          `<button class="mote" data-mote="${m.id}" aria-label="Collect ${m.value} light" style="left:${((m.col + 0.5) / 7) * 100}%;top:${(m.row + 0.5) * 20}%;transform:translate(${((i % 3) - 1) * 13}px,${(i % 2) * 12}px)">✦<small>${m.value}</small></button>`,
      )
      .join("");
  }
  const k = game.keepers.find((k) => k.id === focusId);
  const health = el("inspector").querySelector("#keeper-health");
  if (k && health)
    health.textContent = `${Math.ceil(k.hp)} health${k.tier === 2 ? " · fully improved" : ""}`;
  const signature = k
    ? `${k.id}:${k.tier}:${game.light >= KEEPERS[k.kind].cost}:${game.paused}:${game.phase}`
    : "";
  if (signature !== lastInspector) {
    lastInspector = signature;
    el("inspector").innerHTML = k
      ? `<h3>${KEEPERS[k.kind].name} · Tier ${k.tier}</h3><p id="keeper-health">${Math.ceil(k.hp)} health${k.tier === 2 ? " · fully improved" : ""}</p><button data-action="upgrade" ${k.tier === 2 || game.light < KEEPERS[k.kind].cost || game.paused || !active(game) ? "disabled" : ""}>Upgrade · ✦ ${KEEPERS[k.kind].cost}</button><button data-action="salvage" ${game.paused || !active(game) ? "disabled" : ""}>Salvage · +${Math.floor(KEEPERS[k.kind].cost / 2)}</button>`
      : "";
  }
  let overlay = "";
  if (resetConfirm)
    overlay = `<h2>Begin again?</h2><p>This replaces the saved voyage.</p><button id="confirm-reset">Begin new voyage</button><button id="keep-voyage">Keep this voyage</button>`;
  else if (game.phase === "complete")
    overlay = `<span class="eyebrow">ALL THREE HARBORS PROTECTED</span><h2>The sea remembers.</h2><p>The Admiral lowers his crown. One by one, the drowned ferries turn toward dawn. Your lanterns have shown them the way home.</p><strong>VOYAGE COMPLETE</strong><button id="replay">Sail again</button>`;
  else if (game.phase === "won")
    overlay = `<span class="eyebrow">CHAPTER PROTECTED</span><h2>${game.chapter === 2 ? "The Admiral comes home." : "A light across the water."}</h2><p>${game.chapter === 2 ? "The final procession has ended. Dawn is waiting." : "The harbor holds. Fresh supplies await at the next shore."}</p><button id="next">${game.chapter === 2 ? "Welcome the dawn" : "Next harbor →"}</button>`;
  else if (game.phase === "lost")
    overlay = `<span class="eyebrow">THREE SEALS BROKEN</span><h2>The lamps fall quiet.</h2><p>Try more Wicks early, Bells in each lane, and Anchors ahead of them. Your chapter can begin again.</p><button id="retry">Retry this chapter</button>`;
  else if (game.paused)
    overlay = `<h2>The tide is still.</h2><p>Your voyage is saved. Take your time.</p><button id="resume">Resume harbor</button>`;
  if (overlay !== lastOverlay) {
    lastOverlay = overlay;
    el("overlay").innerHTML = overlay
      ? `<div class="overlay-card">${overlay}</div>`
      : "";
  }
  el("overlay").classList.toggle("visible", !!overlay);
}
let previous = performance.now(),
  accumulator = 0,
  saveTimer = 0,
  renderTimer = 0;
function frame(now: number) {
  const elapsed = Math.min((now - previous) / 1000, 0.2);
  previous = now;
  accumulator += elapsed * game.speed;
  while (accumulator >= 0.05) {
    step(game, 0.05);
    accumulator -= 0.05;
  }
  saveTimer += elapsed;
  renderTimer += elapsed;
  if (renderTimer > 0.1) {
    render();
    renderTimer = 0;
  }
  if (saveTimer > 1) {
    save();
    saveTimer = 0;
  }
  if (noticeTime && now - noticeTime > 8000) {
    notice = "Collect light. Upgrade keepers. Keep every lane protected.";
    noticeTime = 0;
  }
  requestAnimationFrame(frame);
}
render();
save();
if (showHelp) guide.showModal();
requestAnimationFrame(frame);
