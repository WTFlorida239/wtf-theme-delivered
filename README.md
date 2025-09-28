# WTF Theme — Delivered

Shopify Liquid theme for WTF | Welcome To Florida, optimized for a high-converting drink builder, POS parity, and competitor-beating SEO.

This repository is the central source of truth for the `wtf-theme-delivered` Shopify theme. All development, updates, and deployments are managed through this repository and its associated GitHub Actions workflows.

## Repository Structure

```
wtf-theme-delivered/
├── .github/              # GitHub Actions workflows and documentation
├── assets/               # CSS, JS, and media files
├── config/               # settings_schema.json and default configurations
├── layout/               # theme.liquid - the main theme layout
├── sections/             # Reusable theme sections (e.g., header, footer, drink builder)
├── snippets/             # Reusable code snippets
├── templates/            # Page and product templates (JSON format)
├── docs/                 # Supporting documentation, runbooks, and QA checklists
├── scripts/              # Automation and utility scripts
└── ...                   # Other configuration and documentation files
```

## Development Workflow

1.  **Clone the repository:** `gh repo clone WTFlorida239/wtf-theme-delivered`
2.  **Install dependencies:** `npm install`
3.  **Connect to your Shopify store:** `shopify login --store wtfswag.myshopify.com`
4.  **Start the development server:** `shopify theme dev --theme-editor-sync`

Before committing any changes, please run the following checks to ensure code quality and prevent conflicts:

```bash
npm run theme:check
npm run conflicts:scan
```

## Automation & Workflows

This repository uses GitHub Actions to automate several key processes:

-   **CI/CD Pipeline (`ci-cd-pipeline.yml`):** On every push to `main` or a pull request, this workflow validates the theme, runs tests, and ensures the code is ready for deployment.
-   **Theme Deployment (`deploy-theme.yml`):** This workflow allows for manual or automated deployment of the theme to a specified Shopify environment (staging or production).
-   **Automated Testing (`automated-testing.yml`):** Runs a suite of automated tests to catch regressions and ensure theme stability.
-   **Quality Monitoring (`quality-monitoring.yml`):** Continuously monitors the theme for performance and accessibility issues.

All workflows are located in the `.github/workflows` directory.

## Current Status

All branches have been successfully merged into the `main` branch, and all merge conflicts have been resolved. The `main` branch is now the single source of truth for the theme.

All GitHub Actions workflows have been verified and are fully functional.

The documentation has been updated to reflect the current state of the repository and its workflows.

