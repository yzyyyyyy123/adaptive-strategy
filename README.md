# Adaptive Strategy

A collaborative literature-coding workspace for immersive visualization and adaptive strategies.

Website: https://yzyyyyyy123.github.io/adaptive-strategy/

## Publish the prepared website

The ready-to-publish website is in `docs/`. In this repository, open **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, select **main** and **/docs**, then **Save**. No workflow secret or sign-in by coauthors is required.

## Research workflow

Read source PDFs, inspect per-strategy evidence, record independent reviews, edit the shared dimension hierarchy, resolve consensus and export CSV/JSON. The page connects to the existing shared research service; research records are not copied into this repository.

If you have already coded on the previous website, use **Open new website** there to keep your own reviewer identity and saved records. Transfer links expire after five minutes and work once. New reviewers can open the new URL directly.

## Update the interface

Use Node.js 22.13 or later, run `npm install`, then `npm run publish`. Commit the updated source and `docs/`. The build uses the same React components as the original workspace.

Frontend settings are in `frontend/vite.config.ts`. If the repository path changes, rebuild with the matching `WORKSPACE_BASE_PATH`. The research service must explicitly allow the frontend origin. No manager token, import token, PDF corpus, browser session or private environment file belongs in this repository.
