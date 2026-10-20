import { ghFetch } from "./github.mjs"

const batchSize = 10

async function getAllRepositories(token, fetchOptions) {
    const repos = []
    let page = 1

    while (true) {
        const data = await ghFetch(`/user/repos?per_page=100&page=${page}`, token, fetchOptions)
        if (data.length === 0) break

        repos.push(...data)
        page++
    }

    return repos
}

export function filterRepos(repos, { username, includePrivate, includeForks, excludeRepos = [] }) {
    const excluded = new Set(excludeRepos.map(name => name.toLowerCase()))

    return repos.filter(repo =>
        repo.owner.login.toLowerCase() === username.toLowerCase() &&
        (includeForks || !repo.fork) &&
        (includePrivate || !repo.private) &&
        !excluded.has(repo.name.toLowerCase()) &&
        !excluded.has(repo.full_name.toLowerCase())
    )
}

export function aggregateLanguages(languagesPerRepo, { excludeLanguages = [] } = {}) {
    const excluded = new Set(excludeLanguages.map(lang => lang.toLowerCase()))
    const techStats = {}

    for (const languages of languagesPerRepo) {
        for (const [lang, bytes] of Object.entries(languages)) {
            if (excluded.has(lang.toLowerCase())) continue

            techStats[lang] ??= { bytes: 0, repos: 0 }
            techStats[lang].bytes += bytes
            techStats[lang].repos++
        }
    }

    const total = Object.values(techStats).reduce((sum, stat) => sum + stat.bytes, 0)
    const sorted = Object.entries(techStats).sort((a, b) => b[1].bytes - a[1].bytes)

    return {
        totalBytes: total,
        languages: sorted.map(([name, { bytes, repos }]) => ({ name, bytes, repos }))
    }
}

export async function getLanguageStats(options) {
    const { token, warn = console.warn, fetchOptions } = options

    const repositories = await getAllRepositories(token, fetchOptions)
    const repos = filterRepos(repositories, options)
    console.log(`Analisando ${repos.length} de ${repositories.length} repositórios`)

    const languagesPerRepo = []

    for (let i = 0; i < repos.length; i += batchSize) {
        const batch = repos.slice(i, i + batchSize)

        const results = await Promise.allSettled(
            batch.map(repo => ghFetch(`/repos/${repo.full_name}/languages`, token, fetchOptions))
        )

        results.forEach((result, j) => {
            if (result.status === "fulfilled") {
                languagesPerRepo.push(result.value)
                return
            }

            if (result.reason.status === 401) throw result.reason

            warn(`Repositório ${batch[j].full_name} ignorado: ${result.reason.message}`)
        })
    }

    if (repos.length > 0 && languagesPerRepo.length === 0) {
        throw new Error("Não foi possível ler as linguagens de nenhum repositório.")
    }

    return {
        totalRepos: languagesPerRepo.length,
        ...aggregateLanguages(languagesPerRepo, options)
    }
}
