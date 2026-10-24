// Shared motion vocabulary for the homepage clips.
//
// Nothing here uses CSS transitions or keyframes: every move is a GSAP tween
// on the clip's paused timeline, so HyperFrames can seek any frame. Curves are
// drawn as graphs (CustomEase) and springs are closed-form functions of t.

gsap.registerPlugin(CustomEase, MorphSVGPlugin, MotionPathPlugin);

// Arrival: fast out of the gate, long settle (the iOS sheet curve).
CustomEase.create("arrive", "M0,0 C0.32,0.72 0,1 1,1");
// Exit: gathers speed and leaves.
CustomEase.create("leave", "M0,0 C0.55,0 0.85,0.3 1,1");
// Glide: starts and ends at rest; morphs between two layouts, camera moves.
CustomEase.create("glide", "M0,0 C0.65,0 0.35,1 1,1");

/**
 * A damped spring as an ease. zeta is the damping ratio: 1 never overshoots,
 * 0.7-0.85 reads premium, lower is playful. settle sets how quickly it comes to
 * rest within the tween. Position and scale may spring; opacity and colour never.
 */
function spring(zeta = 0.78, settle = 7) {
  const wd = (settle / zeta) * Math.sqrt(1 - zeta * zeta);
  return (t) =>
    t >= 1 ? 1 : 1 - Math.exp(-settle * t) * (Math.cos(wd * t) + (settle / wd) * Math.sin(wd * t));
}
const SPRING = spring(0.78);
const BOUNCE = spring(0.62);

/** Theme from the render's variables: --variables '{"theme":"dark"}'. */
function applyTheme() {
  const vars = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {};
  document.getElementById("root").dataset.theme = vars.theme === "dark" ? "dark" : "light";
}

/**
 * Shape morph: a clip-path that shows only rect `r` (x, y, w, h inside `el`,
 * in CSS px) with corner radius `round`. Tweening between two of these turns
 * one shape into another: a pill into a card, a dot into a row.
 */
function shape(el, r, round) {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  return `inset(${r.y}px ${w - r.x - r.w}px ${h - r.y - r.h}px ${r.x}px round ${round}px)`;
}
function full(round) {
  return `inset(0px 0px 0px 0px round ${round}px)`;
}

/** Blur-in: opacity and blur only, so text lands in place and stays still. */
function blurIn(tl, targets, at, { duration = 0.45, stagger = 0.07, y = 0 } = {}) {
  return tl.fromTo(
    targets,
    { opacity: 0, filter: "blur(6px)", y },
    { opacity: 1, filter: "blur(0px)", y: 0, duration, stagger, ease: "arrive" },
    at,
  );
}

/** Counts a number up on the timeline; the text is a function of progress. */
function countUp(tl, el, to, at, duration, format) {
  const state = { v: 0 };
  el.textContent = format(0);
  return tl.to(state, { v: to, duration, ease: "glide", onUpdate: () => (el.textContent = format(state.v)) }, at);
}
