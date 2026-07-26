# Meme templates

These are same-origin template backgrounds used by the Memes Generator
(`src/components/MemeGenerator.jsx`). Serving them from `/public` (same origin)
keeps the `<canvas>` untainted so Download and Post work.

The shipped files are plain colored placeholders. To use real meme templates,
replace each file **keeping the same filename** (referenced in `TEMPLATES`):

- `drake.jpg`
- `distracted-boyfriend.jpg`
- `two-buttons.jpg`
- `change-my-mind.jpg`
- `expanding-brain.jpg`
- `one-does-not-simply.jpg`

Use royalty-free / properly licensed images. If a file is missing, the canvas
falls back to a colored background labeled with the template name.
