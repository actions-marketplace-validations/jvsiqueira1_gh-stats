const ghBaseUrl = "https://api.github.com"
const maxRetryAfterMs = 60_000

export class GitHubError extends Error {
    constructor(message, status) {
        super(message)
        this.status = status
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function errorMessage(response, path) {
    const { status } = response

    if (status === 401) {
        return "Token inválido ou expirado (401). Gere um novo token e atualize o secret GH_TOKEN."
    }

    if ((status === 403 || status === 429) && response.headers.get("x-ratelimit-remaining") === "0") {
        const reset = new Date(Number(response.headers.get("x-ratelimit-reset")) * 1000)
        return `Limite de requisições da API do GitHub atingido. Ele é liberado em ${reset.toISOString()}.`
    }

    if (status === 403) {
        return `Sem permissão para acessar ${path} (403). Confira se o token tem acesso de leitura (Metadata) aos repositórios.`
    }

    if (status === 404) {
        return `Não encontrado: ${path} (404).`
    }

    return `${status} ${response.statusText} em ${path}`
}

function isRetryable(response) {
    if (response.status >= 500 || response.status === 429) return true
    return response.status === 403 && response.headers.has("retry-after")
}

function retryDelay(response, attempt, baseDelay) {
    const retryAfter = Number(response?.headers.get("retry-after"))
    if (retryAfter > 0) return Math.min(retryAfter * 1000, maxRetryAfterMs)
    return baseDelay * 2 ** attempt
}

export async function ghFetch(path, token, { retries = 3, baseDelay = 1000 } = {}) {
    for (let attempt = 0; ; attempt++) {
        let response

        try {
            response = await fetch(`${ghBaseUrl}${path}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json"
                }
            })
        } catch (error) {
            if (attempt >= retries) {
                throw new GitHubError(`Falha de rede em ${path}: ${error.message}`)
            }
            await sleep(retryDelay(null, attempt, baseDelay))
            continue
        }

        if (response.ok) {
            return response.json()
        }

        if (attempt < retries && isRetryable(response)) {
            await sleep(retryDelay(response, attempt, baseDelay))
            continue
        }

        throw new GitHubError(errorMessage(response, path), response.status)
    }
}
