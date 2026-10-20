import { test } from "node:test"
import assert from "node:assert/strict"
import { aggregateLanguages, filterRepos } from "../src/languages.mjs"

function repo(name, extra = {}) {
    return { name, full_name: `dono/${name}`, owner: { login: "Dono" }, fork: false, private: false, ...extra }
}

const repos = [
    repo("app"),
    repo("site", { private: true }),
    repo("fork", { fork: true }),
    { ...repo("de-outro"), owner: { login: "outra-pessoa" }, full_name: "outra-pessoa/de-outro" }
]

const defaults = { username: "dono", includePrivate: true, includeForks: false }

test("filterRepos mantém só os repos do usuário, sem forks", () => {
    const names = filterRepos(repos, defaults).map(r => r.name)
    assert.deepEqual(names, ["app", "site"])
})

test("filterRepos respeita include_private e include_forks", () => {
    assert.deepEqual(filterRepos(repos, { ...defaults, includePrivate: false }).map(r => r.name), ["app"])
    assert.deepEqual(filterRepos(repos, { ...defaults, includeForks: true }).map(r => r.name), ["app", "site", "fork"])
})

test("filterRepos exclui por nome ou dono/nome, sem diferenciar maiúsculas", () => {
    assert.deepEqual(filterRepos(repos, { ...defaults, excludeRepos: ["APP"] }).map(r => r.name), ["site"])
    assert.deepEqual(filterRepos(repos, { ...defaults, excludeRepos: ["dono/site"] }).map(r => r.name), ["app"])
})

const perRepo = [
    { TypeScript: 300, CSS: 50 },
    { TypeScript: 100, HTML: 40 },
    { Python: 200 }
]

test("aggregateLanguages soma bytes, conta repos e ordena do maior para o menor", () => {
    const result = aggregateLanguages(perRepo)

    assert.equal(result.totalBytes, 690)
    assert.deepEqual(result.languages[0], { name: "TypeScript", bytes: 400, repos: 2 })
    assert.deepEqual(result.languages.map(l => l.name), ["TypeScript", "Python", "CSS", "HTML"])
})

test("aggregateLanguages ignora as linguagens excluídas, inclusive no total", () => {
    const result = aggregateLanguages(perRepo, { excludeLanguages: ["css", "HTML"] })

    assert.equal(result.totalBytes, 600)
    assert.deepEqual(result.languages.map(l => l.name), ["TypeScript", "Python"])
})
