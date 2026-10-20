import { writeFile } from "node:fs/promises"
import { getLanguageStats } from "./languages.mjs"
import { renderChart } from "./chart.mjs"

const token = process.env.GH_TOKEN
const username = process.env.GH_USERNAME
const output = process.env.OUTPUT || "languages.svg"
const title = process.env.TITLE || "Linguagens mais usadas"
const maxBars = Number(process.env.MAX_BARS || 8)
const includePrivate = process.env.INCLUDE_PRIVATE !== "false"
const includeForks = process.env.INCLUDE_FORKS === "true"

async function main() {
    if (!token || !username) {
        throw new Error("Defina GH_TOKEN e GH_USERNAME")
    }

    const data = await getLanguageStats({ token, username, includePrivate, includeForks })

    if (data.languages.length === 0) {
        throw new Error("Nenhuma linguagem encontrada. O token tem acesso aos repositórios?")
    }

    await writeFile(output, renderChart(data, { title, maxBars }))
    console.log(`Gráfico salvo em ${output}`)
}

main().catch(error => {
    console.error(error.message)
    process.exit(1)
})