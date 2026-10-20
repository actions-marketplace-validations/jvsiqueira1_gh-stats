import { appendFile, mkdir, writeFile } from "node:fs/promises"
import { dirname, extname } from "node:path"
import { getLanguageStats } from "./languages.mjs"
import { renderChart, themes } from "./chart.mjs"
import { translations } from "./i18n.mjs"
import { parseList } from "./utils.mjs"

const env = process.env
const isActions = env.GITHUB_ACTIONS === "true"

const token = env.GH_TOKEN
const username = env.GH_USERNAME
const output = env.OUTPUT || "languages.svg"
// CHART_LANG e não LANG, porque LANG já é uma variável do sistema (locale)
const lang = (env.CHART_LANG || "pt").toLowerCase()
const maxBars = Number(env.MAX_BARS || 8)
const includePrivate = env.INCLUDE_PRIVATE !== "false"
const includeForks = env.INCLUDE_FORKS === "true"
const excludeLanguages = parseList(env.EXCLUDE_LANGUAGES)
const excludeRepos = parseList(env.EXCLUDE_REPOS)
const chartThemes = [...new Set(parseList(env.THEMES || "auto").map(theme => theme.toLowerCase()))]

// No Actions, "::warning::" e "::error::" viram avisos destacados no resumo da execução
function warn(message) {
    console.warn(isActions ? `::warning::${message}` : `Aviso: ${message}`)
}

// "assets/languages.svg" + "dark" → "assets/languages-dark.svg"
function themedPath(theme) {
    if (theme === "auto") return output
    const ext = extname(output)
    return `${output.slice(0, output.length - ext.length)}-${theme}${ext}`
}

async function main() {
    if (!token || !username) {
        throw new Error("Defina GH_TOKEN e GH_USERNAME")
    }

    const t = translations[lang]
    if (!t) {
        throw new Error(`Idioma "${lang}" não suportado. Use: ${Object.keys(translations).join(", ")}`)
    }

    const invalidThemes = chartThemes.filter(theme => !themes.includes(theme))
    if (invalidThemes.length > 0) {
        throw new Error(`Tema "${invalidThemes.join(", ")}" não suportado. Use: ${themes.join(", ")}`)
    }

    if (!Number.isInteger(maxBars) || maxBars < 1) {
        throw new Error(`max_bars precisa ser um número inteiro maior que zero (recebido: "${env.MAX_BARS}")`)
    }

    const title = env.TITLE || t.title

    const data = await getLanguageStats({
        token, username, includePrivate, includeForks, excludeLanguages, excludeRepos, warn
    })

    if (data.languages.length === 0) {
        throw new Error("Nenhuma linguagem encontrada. O token tem acesso aos repositórios?")
    }

    const files = []

    for (const theme of chartThemes) {
        const file = themedPath(theme)
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, renderChart(data, { title, maxBars, t, theme }))
        files.push(file)
        console.log(`Gráfico salvo em ${file}`)
    }

    // Lista dos arquivos gerados, usada pelo passo de commit da Action
    if (env.GITHUB_OUTPUT) {
        await appendFile(env.GITHUB_OUTPUT, `files<<EOF_FILES\n${files.join("\n")}\nEOF_FILES\n`)
    }
}

main().catch(error => {
    console.error(isActions ? `::error::${error.message}` : error.message)
    process.exit(1)
})
