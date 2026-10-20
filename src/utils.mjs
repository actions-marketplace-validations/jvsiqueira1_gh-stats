export function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB"]
    let i = 0

    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024
        i++
    }

    return i === 0 ? `${bytes} B` : `${bytes.toFixed(1)} ${units[i]}`
}