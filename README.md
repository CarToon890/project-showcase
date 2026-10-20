# CarToon890 GitHub Projects Portfolio

A static Thai and English portfolio for [@CarToon890](https://github.com/CarToon890), published with GitHub Pages.

## Project groups

The site keeps three independently maintained projects together:

- [MediaStudio](https://github.com/CarToon890/MediaStudio)
- [dropscan-project](https://github.com/CarToon890/dropscan-project)
- [Scale Slimy Fish](https://github.com/CarToon890/Scale-Slimy-Fish)

Four collaborative and other projects appear in a separate section: ECOTile, The Disposal Guilt, IKEA Price Predictor, and Project CCTV Safety.

## Repository activity

The workflow in `.github/workflows/pages.yml` refreshes repository metadata hourly and deploys the static files in `dist/`. The metadata includes each selected repository's latest commit date, message, short SHA, and reported commit statuses. Dates are formatted in Thailand time in the browser. If a repository cannot be refreshed, the workflow retains its last saved data and labels it as saved information.

The refresh script is `scripts/update-project-metadata.mjs`. Its saved data is in `data/project-metadata.json`; generated site metadata is written to `dist/data/project-metadata.json`. The workflow commits the saved cache only when repository data changes.

The page uses no runtime GitHub API requests from visitors. GitHub Actions uses its repository token to refresh the public repository data.

## GitHub Pages

In the repository's **Settings > Pages > Build and deployment**, select **GitHub Actions** as the source. Pushes to `main`, manual workflow runs, and the hourly schedule all refresh the metadata and deploy `dist/`.
