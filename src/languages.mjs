const ghBaseUrl = "https://api.github.com"
const batchSize = 10

async function ghFetch(path, token) {
    const response = await fetch(`${ghBaseUrl}${path}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github+json"
        }
    })

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} em ${path}`)
    }

    return response.json()
}

async function getAllRepositories(token) {
    const repos = []
    let page = 1

    while (true) {
        const data = await ghFetch(`/user/repos?per_page=100&page=${page}`, token)
        if (data.length === 0) break

        repos.push(...data)
        page++
    }

    return repos
}

export async function getLanguageStats({ token, username, includePrivate, includeForks }) {
    const repositories = await getAllRepositories(token)

    const repos = repositories.filter(repo =>
        repo.owner.login.toLowerCase() === username.toLowerCase() &&
        (includeForks || !repo.fork) &&
        (includePrivate || !repo.private)
    )
    console.log(`Analisando ${repos.length} de ${repositories.length} repositórios`)

    const techStats = {}

    for (let i = 0; i < repos.length; i += batchSize) {
        const batch = repos.slice(i, i + batchSize)

        const results = await Promise.all(
            batch.map(repo => ghFetch(`/repos/${repo.full_name}/languages`, token))
        )

        for (const languages of results) {
            for (const [lang, bytes] of Object.entries(languages)) {
                techStats[lang] ??= { bytes: 0, repos: 0 }
                techStats[lang].bytes += bytes
                techStats[lang].repos++
            }
        }
    }

    const total = Object.values(techStats).reduce((sum, stat) => sum + stat.bytes, 0)
    const sorted = Object.entries(techStats).sort((a, b) => b[1].bytes - a[1].bytes)

    return {
        totalRepos: repos.length,
        totalBytes: total,
        languages: sorted.map(([name, { bytes, repos }]) => ({ name, bytes, repos }))
    }
}