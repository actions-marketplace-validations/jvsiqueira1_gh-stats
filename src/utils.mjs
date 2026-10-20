export function formatBytes(bytes, locale = "en-US") {
    const units = ["B", "KB", "MB", "GB"]
    let i = 0

    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024
        i++
    }

    const digits = i === 0 ? 0 : 1
    const number = new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }).format(bytes)

    return `${number} ${units[i]}`
}

export function formatPercent(fraction, locale = "en-US") {
    return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(fraction)
}

// "a, b,,c " → ["a", "b", "c"]
export function parseList(value) {
    return (value || "").split(",").map(item => item.trim()).filter(Boolean)
}
