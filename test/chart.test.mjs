import { test } from "node:test"
import assert from "node:assert/strict"
import { escapeXml, renderChart } from "../src/chart.mjs"
import { translations } from "../src/i18n.mjs"

const data = {
    totalRepos: 3,
    totalBytes: 1000,
    languages: [
        { name: "TypeScript", bytes: 600, repos: 2 },
        { name: "Python", bytes: 250, repos: 1 },
        { name: "CSS", bytes: 100, repos: 3 },
        { name: "HTML", bytes: 50, repos: 3 }
    ]
}

function labels(svg) {
    return [...svg.matchAll(/class="label">([^<]*)</g)].map(match => match[1])
}

test("agrupa o que passa de max_bars numa barra de 'outras'", () => {
    const svg = renderChart(data, { title: "Teste", maxBars: 2, t: translations.pt })
    assert.deepEqual(labels(svg), ["TypeScript", "Python", "Outras"])
    assert.match(svg, /Outras: 150 B · 15,0% · CSS, HTML/)
})

test("sem sobra, não cria a barra de 'outras'", () => {
    const svg = renderChart(data, { title: "Teste", maxBars: 8, t: translations.pt })
    assert.deepEqual(labels(svg), ["TypeScript", "Python", "CSS", "HTML"])
})

test("traduz subtítulo, porcentagens e a barra de 'outras'", () => {
    const en = renderChart(data, { title: "T", maxBars: 2, t: translations.en })
    assert.match(en, /3 repositories · 1,000 B of code/)
    assert.match(en, />60.0%</)
    assert.ok(labels(en).includes("Others"))

    const es = renderChart(data, { title: "T", maxBars: 2, t: translations.es })
    assert.match(es, /3 repositorios · 1000 B de código/)
    assert.ok(labels(es).includes("Otros"))
})

test("usa singular quando há um repositório só", () => {
    const svg = renderChart({ ...data, totalRepos: 1 }, { title: "T", maxBars: 8, t: translations.pt })
    assert.match(svg, /1 repositório ·/)
    assert.match(svg, /Python: .* · 1 repositório</)
})

test("tema auto tem as duas paletas; light e dark têm só uma", () => {
    const auto = renderChart(data, { title: "T", maxBars: 8, t: translations.pt, theme: "auto" })
    const light = renderChart(data, { title: "T", maxBars: 8, t: translations.pt, theme: "light" })
    const dark = renderChart(data, { title: "T", maxBars: 8, t: translations.pt, theme: "dark" })

    assert.match(auto, /prefers-color-scheme: dark/)
    assert.doesNotMatch(light, /prefers-color-scheme/)
    assert.match(light, /--surface: #fcfcfb/)
    assert.doesNotMatch(dark, /prefers-color-scheme/)
    assert.match(dark, /--surface: #1a1a19/)
})

test("escapa caracteres especiais do XML no título e nos nomes", () => {
    assert.equal(escapeXml("C++ & <Rust>"), "C++ &amp; &lt;Rust&gt;")

    const svg = renderChart(
        { ...data, languages: [{ name: "A&B", bytes: 1000, repos: 1 }] },
        { title: "<Título>", maxBars: 8, t: translations.pt }
    )
    assert.match(svg, /&lt;Título&gt;/)
    assert.match(svg, /class="label">A&amp;B</)
})
