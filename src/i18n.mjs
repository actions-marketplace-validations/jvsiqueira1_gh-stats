export const translations = {
    pt: {
        locale: "pt-BR",
        title: "Linguagens mais usadas",
        others: "Outras",
        repos: count => `${count} ${count === 1 ? "repositório" : "repositórios"}`,
        code: size => `${size} de código`
    },
    en: {
        locale: "en-US",
        title: "Most used languages",
        others: "Others",
        repos: count => `${count} ${count === 1 ? "repository" : "repositories"}`,
        code: size => `${size} of code`
    },
    es: {
        locale: "es-ES",
        title: "Lenguajes más usados",
        others: "Otros",
        repos: count => `${count} ${count === 1 ? "repositorio" : "repositorios"}`,
        code: size => `${size} de código`
    }
}
