// Signage settings. Edit this file only; no need to touch index.html.
window.SIGNAGE_CONFIG = {
  // Address of the live-numbers JSON from the Digital Twin (public, building totals only).
  // Empty string = no live data: the "Building Energy" and "Indoor Air Quality" scenes are skipped.
  api: "https://digitaltwin-lc-fjbxb6gpapgabcf2.southeastasia-01.azurewebsites.net/api/signage",

  // Seconds each scene stays on screen (the Welcome scene is always 6 s).
  // null = use each scene's own default (7 s).
  sceneSeconds: null,

  // true = play the "Welcome to Lannacom" scene at the start of every loop,
  // false = only once after the player starts.
  welcomeEachLoop: true,

  // Header style: "bar" (green vertical bar), "tint" (rounded icon square) or "plain" (title only).
  header: "bar"
};
