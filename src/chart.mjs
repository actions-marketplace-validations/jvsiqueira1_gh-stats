import { formatBytes } from "./utils.mjs"

const width = 480
const padding = 24
const labelWidth = 96
const valueWidth = 56
const rowHeight = 28
const barHeight = 14
const rowsStart = 84

function escapeXml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function barPath(x, y, w, h, r) {
    r = Math.min(r, w, h / 2)
    return `M${x},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x} Z`
}

export function renderChart(data, { title, maxBars, t }) {
    const rows = data.languages.slice(0, maxBars).map(lang => ({
        name: lang.name,
        bytes: lang.bytes,
        tooltip: t.repos(lang.repos)
    }))

    const rest = data.languages.slice(maxBars)
    if (rest.length > 0) {
        rows.push({
            name: t.others,
            bytes: rest.reduce((sum, lang) => sum + lang.bytes, 0),
            tooltip: rest.map(lang => lang.name).join(", ")
        })
    }

    const barX = padding + labelWidth
    const barMaxWidth = width - barX - valueWidth - padding
    const maxBytes = Math.max(...rows.map(row => row.bytes))
    const height = rowsStart + rows.length * rowHeight + padding / 2

    const bars = rows.map((row, i) => {
        const y = rowsStart + i * rowHeight
        const barY = y + (rowHeight - barHeight) / 2
        const barWidth = Math.max(2, (row.bytes / maxBytes) * barMaxWidth)
        const percent = ((row.bytes / data.totalBytes) * 100).toFixed(1)
        const textY = y + rowHeight / 2

        return `
  <g>
    <title>${escapeXml(row.name)}: ${formatBytes(row.bytes)} · ${percent}% · ${escapeXml(row.tooltip)}</title>
    <rect x="0" y="${y}" width="${width}" height="${rowHeight}" fill="transparent"/>
    <text x="${padding}" y="${textY}" class="label">${escapeXml(row.name)}</text>
    <path d="${barPath(barX, barY, barWidth, barHeight, 4)}" class="bar"/>
    <text x="${barX + barWidth + 8}" y="${textY}" class="value">${percent}%</text>
  </g>`
    }).join("")

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
  <style>
    svg { --surface: #fcfcfb; --text-primary: #0b0b0b; --text-secondary: #52514e; --bar: #2a78d6; }
    @media (prefers-color-scheme: dark) {
      svg { --surface: #1a1a19; --text-primary: #f0efec; --text-secondary: #c3c2b7; --bar: #3987e5; }
    }
    text { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; dominant-baseline: central; }
    .title { font-size: 16px; font-weight: 600; fill: var(--text-primary); }
    .subtitle { font-size: 12px; fill: var(--text-secondary); }
    .label { font-size: 13px; fill: var(--text-primary); }
    .value { font-size: 12px; fill: var(--text-secondary); }
    .bar { fill: var(--bar); }
  </style>
  <rect width="100%" height="100%" rx="8" fill="var(--surface)"/>
  <text x="${padding}" y="32" class="title">${escapeXml(title)}</text>
  <text x="${padding}" y="54" class="subtitle">${t.repos(data.totalRepos)} · ${t.code(formatBytes(data.totalBytes))}</text>
${bars}
</svg>
`
}