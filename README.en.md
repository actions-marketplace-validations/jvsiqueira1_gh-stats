# Languages Chart

<sub>[Português](README.md) · **English** · [Español](README.es.md)</sub>

[![CI](https://github.com/jvsiqueira1/gh-stats/actions/workflows/ci.yml/badge.svg)](https://github.com/jvsiqueira1/gh-stats/actions/workflows/ci.yml)

GitHub Action that generates an SVG chart of the most used languages across your repositories, **including private ones**, and keeps the chart in your README always up to date.

<p>
  <img src="https://raw.githubusercontent.com/jvsiqueira1/jvsiqueira1/main/languages.svg" alt="Example of the generated chart" />
</p>

<sub>Live example, updated daily on <a href="https://github.com/jvsiqueira1">@jvsiqueira1</a>'s profile.</sub>

## Why use it

- **Includes private repositories.** Services that render the image from a URL can only see public repositories. Here, the Action runs in your own repository with your own token, and it never leaves your account.
- **Light and dark theme**, following either the viewer's system or GitHub's own theme.
- **In Portuguese, English or Spanish**, number formatting included.
- **Resilient.** It retries when the GitHub API hiccups, and a repository that keeps failing is skipped without breaking the rest.
- **No dependencies.** Just Node.js, which comes preinstalled on GitHub runners.
- **No empty commits.** A commit only happens when the chart changes.

## Usage

### 1. Create a token

Go to **Settings → Developer settings → Personal access tokens → [Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)**:

- **Repository access:** All repositories
- **Permissions → Repository → Metadata:** Read-only

That is the only permission needed. It grants access to the repository list and their languages, but **not to the code**.

> Write down the expiration date. Once the token expires, the Action fails until you generate a new one and update the secret.

### 2. Save the token as a secret

In the repository where the chart will live (for example, your profile repository, `your-username/your-username`), go to **Settings → Secrets and variables → Actions → New repository secret**:

- **Name:** `GH_TOKEN`
- **Secret:** the token from the previous step

### 3. Create the workflow

Create the file `.github/workflows/update-languages.yml`:

```yaml
name: Update languages

on:
  schedule:
    - cron: "0 6 * * *"   # every day at 06:00 UTC
  workflow_dispatch:       # allows running it manually from the Actions tab

permissions:
  contents: write          # required to commit the SVG

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: jvsiqueira1/gh-stats@v1
        with:
          token: ${{ secrets.GH_TOKEN }}
          lang: "en"           # pt, en or es
```

### 4. Add the chart to your README

```md
![Most used languages](languages.svg)
```

To generate the first chart without waiting for the schedule, go to **Actions → Update languages → Run workflow**.

## Light and dark theme

By default (`themes: "auto"`), the chart follows the viewer's **operating system** theme. GitHub, however, has its own theme setting: someone with GitHub in dark mode and their system in light mode would see a light chart on a dark page.

To follow **GitHub's** theme, generate both versions:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  with:
    token: ${{ secrets.GH_TOKEN }}
    lang: "en"
    themes: "light, dark"
```

This creates `languages-light.svg` and `languages-dark.svg`. In your README, use `<picture>`, which GitHub switches according to the site's theme:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="languages-dark.svg">
  <img src="languages-light.svg" alt="Most used languages">
</picture>
```

## Options

| Input | Default | Description |
|---|---|---|
| `token` | — | **Required.** Token with read access (Metadata) to your repositories |
| `username` | repository owner | GitHub user whose repositories will be analyzed |
| `output` | `languages.svg` | Path of the generated SVG. Missing folders are created |
| `lang` | `pt` | Language of the texts and numbers: `pt`, `en` or `es` |
| `title` | title of the chosen `lang` | Chart title |
| `themes` | `auto` | Comma-separated themes to generate: `auto`, `light`, `dark`. `light` and `dark` produce suffixed files (`languages-light.svg`) |
| `max_bars` | `8` | Number of languages shown before grouping the rest into "Others" |
| `exclude_languages` | — | Comma-separated languages to ignore (e.g. `HTML, CSS`) |
| `exclude_repos` | — | Comma-separated repositories to ignore (e.g. `my-site, dotfiles`) |
| `include_private` | `true` | Include private repositories |
| `include_forks` | `false` | Include forks |
| `commit` | `true` | Commit the SVGs automatically |
| `commit_message` | `chore: atualiza gráfico de linguagens` | Commit message |

| Output | Description |
|---|---|
| `files` | Generated files, one per line |

### Examples

Ignore markup languages and a repository with generated code:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  with:
    token: ${{ secrets.GH_TOKEN }}
    lang: "en"
    exclude_languages: "HTML, CSS, Jupyter Notebook"
    exclude_repos: "project-with-committed-build"
```

Public repositories only, in English, with a custom title and the SVG in a folder:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  with:
    token: ${{ secrets.GH_TOKEN }}
    include_private: "false"
    lang: "en"
    title: "My top languages"
    output: "assets/languages.svg"
```

Generate the SVG without committing, to use it in another step of your workflow:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  id: chart
  with:
    token: ${{ secrets.GH_TOKEN }}
    commit: "false"

- run: echo "${{ steps.chart.outputs.files }}"
```

## How it works

1. Lists every repository the token can see (`GET /user/repos`), with pagination.
2. Keeps only the ones owned by `username`, without forks and excluded repositories.
3. Fetches the languages of each repository (`GET /repos/{owner}/{repo}/languages`), 10 at a time. Temporary errors are retried up to 3 times, and a repository that keeps failing is skipped with a warning in the log.
4. Sums the bytes per language, without the excluded languages, and renders the SVGs.
5. Commits the SVGs if they changed.

The values are **bytes of code**, computed by GitHub itself (the same calculation behind each repository's language bar). A single large repository can outweigh several small ones. Hover over a bar, with the SVG opened directly in the browser, to see how many repositories use that language.

### Privacy

The **names** of private repositories never appear in the chart. Their bytes of code, however, are included in the totals. If the repository holding the SVG is public, anyone can see those totals. Use `include_private: "false"` if you would rather not expose them.

### Common errors

The Action's log messages are in Portuguese. These are the most common ones:

| Message | Meaning | What to do |
|---|---|---|
| Token inválido ou expirado (401) | Invalid or expired token | Generate a new token and update the `GH_TOKEN` secret |
| Sem permissão para acessar … (403) | No permission | Check that the token has **Metadata: Read-only** and access to **All repositories** |
| Limite de requisições da API do GitHub atingido | API rate limit reached | Wait until the time shown in the message, or run the workflow less often |
| Repositório … ignorado | Repository skipped | A warning, not an error: the chart was generated without that repository |

### Limitations

- Organization repositories are not counted, even if you are a member.
- On GitHub, scheduled workflows in public repositories are paused after 60 days without activity. If that happens, re-enable the workflow in the Actions tab.

## Running locally

Requires Node.js 20.6 or later (because of `--env-file`). Create a `.env` file:

```
GH_TOKEN=your_token
GH_USERNAME=your_username
```

Then run:

```
node --env-file=.env src/index.mjs
```

Options can also be passed as environment variables: `OUTPUT`, `CHART_LANG`, `TITLE`, `THEMES`, `MAX_BARS`, `EXCLUDE_LANGUAGES`, `EXCLUDE_REPOS`, `INCLUDE_PRIVATE` and `INCLUDE_FORKS`.

## Development

Tests use Node's built-in test runner, with no dependencies and no token needed:

```
npm test
```

[CI](.github/workflows/ci.yml) runs the tests on Node 20 and 24 on every push and pull request. If the `GH_TOKEN` secret is set in the repository, it also runs the Action itself in all three themes and saves the generated charts as an artifact.

## License

[MIT](LICENSE)
