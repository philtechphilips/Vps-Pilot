# Homepage motion

The clips on the landing page, made with [HyperFrames](https://github.com/heygen-com/hyperframes):
HTML scenes animated by a GSAP timeline and rendered to video. Each folder is one clip
(`hero`, `deploy`, `monitor`, `databases`, `security`); `assets/` is shared (fonts, logos,
`clip.css` with both themes, `motion.js` with the eases, springs and morph helpers).

Motion rules used throughout: no CSS transitions or keyframes; arrivals on long-tailed
curves, closed-form springs for position and scale only, and shape morphs (clip-path and
MorphSVG) to carry one element into the next.

```bash
npx hyperframes@0.8.185 preview deploy          # edit with live preview
npx hyperframes@0.8.185 check deploy            # lint, layout, motion and contrast
npm run build                                   # render all clips, both themes
node render.mjs deploy                          # or just one
```

`npm run build` writes `../public/motion/<clip>-<theme>.{webm,mp4,webp}`; the `.webp` is the
final frame, shown when motion is reduced. Needs Node 22+ and FFmpeg.
