# Languages Chart

<sub>[Português](README.md) · **English** · [Español](README.es.md)</sub>

GitHub Action that generates an SVG chart of the most used languages across your repositories, **including private ones**, and keeps the chart in your README always up to date.

<p>
  <img src="https://raw.githubusercontent.com/jvsiqueira1/jvsiqueira1/main/languages.svg" alt="Example of the generated chart" />
</p>

<sub>Live example, updated daily on <a href="https://github.com/jvsiqueira1">@jvsiqueira1</a>'s profile.</sub>

## Why use it

- **Includes private repositories.** Services that render the image from a URL can only see public repositories. Here, the Action runs in your own repository with your own token, and it never leaves your account.
- **Light and dark theme.** Colors follow the system theme of whoever is viewing.
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
          lang: "en"
```

### 4. Add the chart to your README

```md
![Most used languages](languages.svg)
```

To generate the first chart without waiting for the schedule, go to **Actions → Update languages → Run workflow**.

## Options

| Input | Default | Description |
|---|---|---|
| `token` | — | **Required.** Token with read access (Metadata) to your repositories |
| `username` | repository owner | GitHub user whose repositories will be analyzed |
| `output` | `languages.svg` | Path of the generated SVG |
| `lang` | `pt` | Language of the chart texts: `pt`, `en` or `es` |
| `title` | title of the chosen `lang` | Chart title |
| `max_bars` | `8` | Number of languages shown before grouping the rest into "Others" |
| `include_private` | `true` | Include private repositories |
| `include_forks` | `false` | Include forks |
| `commit` | `true` | Commit the SVG automatically |
| `commit_message` | `chore: atualiza gráfico de linguagens` | Commit message |

### Examples

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
  with:
    token: ${{ secrets.GH_TOKEN }}
    commit: "false"
```

## How it works

1. Lists every repository the token can see (`GET /user/repos`), with pagination.
2. Keeps only the ones owned by `username` and, by default, skips forks.
3. Fetches the languages of each repository (`GET /repos/{owner}/{repo}/languages`), 10 at a time.
4. Sums the bytes per language and renders the SVG.
5. Commits the SVG if it changed.

The values are **bytes of code**, computed by GitHub itself (the same calculation behind each repository's language bar). A single large repository can outweigh several small ones. Hover over a bar, with the SVG opened directly in the browser, to see how many repositories use that language.

### Privacy

The **names** of private repositories never appear in the chart. Their bytes of code, however, are included in the totals. If the repository holding the SVG is public, anyone can see those totals. Use `include_private: "false"` if you would rather not expose them.

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

Options can also be passed as environment variables: `OUTPUT`, `CHART_LANG`, `TITLE`, `MAX_BARS`, `INCLUDE_PRIVATE` and `INCLUDE_FORKS`.

## License

[MIT](LICENSE)
