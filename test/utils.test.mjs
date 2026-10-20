import { test } from "node:test"
import assert from "node:assert/strict"
import { formatBytes, formatPercent, parseList } from "../src/utils.mjs"

test("formatBytes escolhe a unidade e usa o separador decimal do idioma", () => {
    assert.equal(formatBytes(871, "pt-BR"), "871 B")
    assert.equal(formatBytes(1536, "en-US"), "1.5 KB")
    assert.equal(formatBytes(1536, "pt-BR"), "1,5 KB")
    assert.equal(formatBytes(55692594, "en-US"), "53.1 MB")
})

test("formatPercent segue o formato de cada idioma", () => {
    assert.equal(formatPercent(0.737, "en-US"), "73.7%")
    assert.equal(formatPercent(0.737, "pt-BR"), "73,7%")
    // Em espanhol o % vem separado por um espaço que não quebra linha
    assert.equal(formatPercent(0.737, "es-ES"), "73,7 %")
})

test("parseList separa por vírgula e ignora espaços e itens vazios", () => {
    assert.deepEqual(parseList(" HTML, CSS,, Jupyter Notebook "), ["HTML", "CSS", "Jupyter Notebook"])
    assert.deepEqual(parseList(""), [])
    assert.deepEqual(parseList(undefined), [])
})
