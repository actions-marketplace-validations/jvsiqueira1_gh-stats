import { afterEach, test } from "node:test"
import assert from "node:assert/strict"
import { ghFetch } from "../src/github.mjs"

const originalFetch = globalThis.fetch
const noDelay = { baseDelay: 0 }

// Substitui o fetch por respostas pré-definidas, uma por chamada
function mockFetch(...responses) {
    let calls = 0
    globalThis.fetch = async () => {
        const next = responses[Math.min(calls++, responses.length - 1)]
        if (next instanceof Error) throw next
        return next
    }
    return () => calls
}

function json(body, status = 200, headers = {}) {
    return new Response(JSON.stringify(body), { status, headers })
}

afterEach(() => {
    globalThis.fetch = originalFetch
})

test("devolve o JSON quando a resposta é ok", async () => {
    mockFetch(json({ TypeScript: 100 }))
    assert.deepEqual(await ghFetch("/x", "token", noDelay), { TypeScript: 100 })
})

test("tenta de novo em erro 5xx e em falha de rede", async () => {
    const calls = mockFetch(json({}, 502), new TypeError("fetch failed"), json({ ok: true }))
    assert.deepEqual(await ghFetch("/x", "token", noDelay), { ok: true })
    assert.equal(calls(), 3)
})

test("desiste depois do número máximo de tentativas", async () => {
    const calls = mockFetch(json({}, 500))
    await assert.rejects(ghFetch("/x", "token", { ...noDelay, retries: 2 }), { status: 500 })
    assert.equal(calls(), 3)
})

test("401 não tenta de novo e explica como resolver", async () => {
    const calls = mockFetch(json({}, 401))
    await assert.rejects(ghFetch("/x", "token", noDelay), {
        status: 401,
        message: /Token inválido ou expirado.*secret GH_TOKEN/
    })
    assert.equal(calls(), 1)
})

test("limite de requisições esgotado informa quando ele é liberado", async () => {
    mockFetch(json({}, 403, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1800000000" }))
    await assert.rejects(ghFetch("/x", "token", noDelay), {
        message: /Limite de requisições.*2027-01-15T08:00:00.000Z/
    })
})

test("403 sem limite esgotado aponta para a permissão do token", async () => {
    mockFetch(json({}, 403))
    await assert.rejects(ghFetch("/repos/a/b", "token", noDelay), {
        message: /Sem permissão para acessar \/repos\/a\/b.*Metadata/
    })
})
