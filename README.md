# Languages Chart

<sub>**Português** · [English](README.en.md) · [Español](README.es.md)</sub>

GitHub Action que gera um gráfico SVG com as linguagens mais usadas nos seus repositórios, **incluindo os privados**, e mantém o gráfico do seu README sempre atualizado.

<p>
  <img src="https://raw.githubusercontent.com/jvsiqueira1/jvsiqueira1/main/languages.svg" alt="Exemplo do gráfico gerado" />
</p>

<sub>Exemplo real, atualizado diariamente no perfil de <a href="https://github.com/jvsiqueira1">@jvsiqueira1</a>.</sub>

## Por que usar

- **Inclui repositórios privados.** Serviços que geram a imagem por URL só enxergam os repositórios públicos. Aqui, a Action roda no seu próprio repositório com o seu token, e ele nunca sai da sua conta.
- **Tema claro e escuro.** As cores acompanham o tema do sistema de quem está vendo.
- **Sem dependências.** Só Node.js, que já vem instalado nos runners do GitHub.
- **Sem commits vazios.** O commit só acontece quando o gráfico muda.

## Como usar

### 1. Crie um token

Em **Settings → Developer settings → Personal access tokens → [Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)**:

- **Repository access:** All repositories
- **Permissions → Repository → Metadata:** Read-only

Essa é a única permissão necessária. Ela dá acesso à lista de repositórios e às linguagens, mas **não ao código**.

> Anote a data de expiração. Quando o token expirar, a Action passa a falhar até você gerar um novo e atualizar o secret.

### 2. Salve o token como secret

No repositório onde o gráfico vai ficar (por exemplo, o do seu perfil, `seu-usuario/seu-usuario`), vá em **Settings → Secrets and variables → Actions → New repository secret**:

- **Name:** `GH_TOKEN`
- **Secret:** o token gerado no passo anterior

### 3. Crie o workflow

Crie o arquivo `.github/workflows/update-languages.yml`:

```yaml
name: Atualizar linguagens

on:
  schedule:
    - cron: "0 6 * * *"   # todo dia às 06:00 UTC
  workflow_dispatch:       # permite rodar manualmente pela aba Actions

permissions:
  contents: write          # necessário para fazer commit do SVG

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: jvsiqueira1/gh-stats@v1
        with:
          token: ${{ secrets.GH_TOKEN }}
```

### 4. Adicione o gráfico ao README

```md
![Linguagens mais usadas](languages.svg)
```

Para gerar o primeiro gráfico sem esperar o agendamento, vá em **Actions → Atualizar linguagens → Run workflow**.

## Opções

| Input | Padrão | Descrição |
|---|---|---|
| `token` | — | **Obrigatório.** Token com acesso de leitura (Metadata) aos seus repositórios |
| `username` | dono do repositório | Usuário do GitHub cujos repositórios serão analisados |
| `output` | `languages.svg` | Caminho do SVG gerado |
| `lang` | `pt` | Idioma dos textos do gráfico: `pt`, `en` ou `es` |
| `title` | título do `lang` escolhido | Título do gráfico |
| `max_bars` | `8` | Quantidade de linguagens exibidas antes de agrupar o resto em "Outras" |
| `include_private` | `true` | Incluir repositórios privados |
| `include_forks` | `false` | Incluir forks |
| `commit` | `true` | Fazer commit do SVG automaticamente |
| `commit_message` | `chore: atualiza gráfico de linguagens` | Mensagem do commit |

### Exemplos

Somente repositórios públicos, em inglês, com título próprio e o SVG numa pasta:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  with:
    token: ${{ secrets.GH_TOKEN }}
    include_private: "false"
    lang: "en"
    title: "My top languages"
    output: "assets/languages.svg"
```

Gerar o SVG sem fazer commit, para usar em outro passo do seu workflow:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  with:
    token: ${{ secrets.GH_TOKEN }}
    commit: "false"
```

## Como funciona

1. Lista todos os repositórios que o token enxerga (`GET /user/repos`), com paginação.
2. Mantém só os que pertencem ao `username` e, por padrão, ignora forks.
3. Busca as linguagens de cada repositório (`GET /repos/{owner}/{repo}/languages`), 10 de cada vez.
4. Soma os bytes por linguagem e gera o SVG.
5. Faz commit do SVG se ele mudou.

Os valores são **bytes de código**, calculados pelo próprio GitHub (o mesmo cálculo da barra de linguagens de cada repositório). Um único repositório grande pode pesar mais que vários pequenos. Passe o mouse sobre uma barra, abrindo o SVG direto no navegador, para ver em quantos repositórios a linguagem aparece.

### Privacidade

Os **nomes** dos repositórios privados não aparecem no gráfico. Os bytes de código deles, sim, entram na soma. Se o repositório onde o SVG fica for público, esses totais ficam visíveis para qualquer pessoa. Use `include_private: "false"` se preferir não expor isso.

### Limitações

- Repositórios de organizações não entram na conta, mesmo que você seja membro.
- No GitHub, agendamentos de repositórios públicos são pausados após 60 dias sem atividade. Se isso acontecer, reative o workflow na aba Actions.

## Rodando localmente

Requer Node.js 20.6 ou superior (por causa do `--env-file`). Crie um arquivo `.env`:

```
GH_TOKEN=seu_token
GH_USERNAME=seu_usuario
```

E rode:

```
node --env-file=.env src/index.mjs
```

As opções também podem ser passadas por variável de ambiente: `OUTPUT`, `CHART_LANG`, `TITLE`, `MAX_BARS`, `INCLUDE_PRIVATE` e `INCLUDE_FORKS`.

## Licença

[MIT](LICENSE)
