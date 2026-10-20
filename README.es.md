# Languages Chart

<sub>[Português](README.md) · [English](README.en.md) · **Español**</sub>

[![CI](https://github.com/jvsiqueira1/gh-stats/actions/workflows/ci.yml/badge.svg)](https://github.com/jvsiqueira1/gh-stats/actions/workflows/ci.yml)

GitHub Action que genera un gráfico SVG con los lenguajes más usados en tus repositorios, **incluidos los privados**, y mantiene el gráfico de tu README siempre actualizado.

<p>
  <img src="https://raw.githubusercontent.com/jvsiqueira1/jvsiqueira1/main/languages.svg" alt="Ejemplo del gráfico generado" />
</p>

<sub>Ejemplo real, actualizado a diario en el perfil de <a href="https://github.com/jvsiqueira1">@jvsiqueira1</a>.</sub>

## Por qué usarla

- **Incluye repositorios privados.** Los servicios que generan la imagen a partir de una URL solo ven los repositorios públicos. Aquí, la Action se ejecuta en tu propio repositorio con tu propio token, que nunca sale de tu cuenta.
- **Tema claro y oscuro**, siguiendo el sistema de quien lo ve o el tema del propio GitHub.
- **En portugués, inglés o español**, incluido el formato de los números.
- **Resistente a fallos.** Reintenta cuando la API de GitHub falla momentáneamente, y un repositorio que sigue fallando se omite sin afectar al resto.
- **Sin dependencias.** Solo Node.js, que ya viene instalado en los runners de GitHub.
- **Sin commits vacíos.** Solo se hace commit cuando el gráfico cambia.

## Cómo usarla

### 1. Crea un token

En **Settings → Developer settings → Personal access tokens → [Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)**:

- **Repository access:** All repositories
- **Permissions → Repository → Metadata:** Read-only

Es el único permiso necesario. Da acceso a la lista de repositorios y a sus lenguajes, pero **no al código**.

> Anota la fecha de expiración. Cuando el token expire, la Action fallará hasta que generes uno nuevo y actualices el secret.

### 2. Guarda el token como secret

En el repositorio donde estará el gráfico (por ejemplo, el de tu perfil, `tu-usuario/tu-usuario`), ve a **Settings → Secrets and variables → Actions → New repository secret**:

- **Name:** `GH_TOKEN`
- **Secret:** el token del paso anterior

### 3. Crea el workflow

Crea el archivo `.github/workflows/update-languages.yml`:

```yaml
name: Actualizar lenguajes

on:
  schedule:
    - cron: "0 6 * * *"   # todos los días a las 06:00 UTC
  workflow_dispatch:       # permite ejecutarlo manualmente desde la pestaña Actions

permissions:
  contents: write          # necesario para hacer commit del SVG

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: jvsiqueira1/gh-stats@v1
        with:
          token: ${{ secrets.GH_TOKEN }}
          lang: "es"           # pt, en o es
```

### 4. Agrega el gráfico a tu README

```md
![Lenguajes más usados](languages.svg)
```

Para generar el primer gráfico sin esperar a la programación, ve a **Actions → Actualizar lenguajes → Run workflow**.

## Tema claro y oscuro

Por defecto (`themes: "auto"`), el gráfico sigue el tema del **sistema operativo** de quien lo ve. Pero GitHub tiene su propia configuración de tema: alguien con GitHub en modo oscuro y el sistema en modo claro vería un gráfico claro sobre un fondo oscuro.

Para seguir el tema **de GitHub**, genera las dos versiones:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  with:
    token: ${{ secrets.GH_TOKEN }}
    lang: "es"
    themes: "light, dark"
```

Esto crea `languages-light.svg` y `languages-dark.svg`. En el README, usa `<picture>`, que GitHub cambia según el tema del sitio:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="languages-dark.svg">
  <img src="languages-light.svg" alt="Lenguajes más usados">
</picture>
```

## Opciones

| Input | Valor por defecto | Descripción |
|---|---|---|
| `token` | — | **Obligatorio.** Token con acceso de lectura (Metadata) a tus repositorios |
| `username` | dueño del repositorio | Usuario de GitHub cuyos repositorios se analizarán |
| `output` | `languages.svg` | Ruta del SVG generado. Las carpetas que no existen se crean |
| `lang` | `pt` | Idioma de los textos y de los números: `pt`, `en` o `es` |
| `title` | título del `lang` elegido | Título del gráfico |
| `themes` | `auto` | Temas a generar, separados por comas: `auto`, `light`, `dark`. `light` y `dark` generan archivos con sufijo (`languages-light.svg`) |
| `max_bars` | `8` | Cantidad de lenguajes mostrados antes de agrupar el resto en "Otros" |
| `exclude_languages` | — | Lenguajes a ignorar, separados por comas (ej.: `HTML, CSS`) |
| `exclude_repos` | — | Repositorios a ignorar, separados por comas (ej.: `mi-sitio, dotfiles`) |
| `include_private` | `true` | Incluir repositorios privados |
| `include_forks` | `false` | Incluir forks |
| `commit` | `true` | Hacer commit de los SVG automáticamente |
| `commit_message` | `chore: atualiza gráfico de linguagens` | Mensaje del commit |

| Output | Descripción |
|---|---|
| `files` | Archivos generados, uno por línea |

### Ejemplos

Ignorar lenguajes de marcado y un repositorio con código generado:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  with:
    token: ${{ secrets.GH_TOKEN }}
    lang: "es"
    exclude_languages: "HTML, CSS, Jupyter Notebook"
    exclude_repos: "proyecto-con-build-commiteado"
```

Solo repositorios públicos, en español, con un título propio y el SVG en una carpeta:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  with:
    token: ${{ secrets.GH_TOKEN }}
    include_private: "false"
    lang: "es"
    title: "Mis lenguajes"
    output: "assets/languages.svg"
```

Generar el SVG sin hacer commit, para usarlo en otro paso de tu workflow:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  id: chart
  with:
    token: ${{ secrets.GH_TOKEN }}
    commit: "false"

- run: echo "${{ steps.chart.outputs.files }}"
```

## Cómo funciona

1. Lista todos los repositorios que el token puede ver (`GET /user/repos`), con paginación.
2. Mantiene solo los que pertenecen a `username`, sin los forks ni los repositorios excluidos.
3. Obtiene los lenguajes de cada repositorio (`GET /repos/{owner}/{repo}/languages`), 10 a la vez. Los errores temporales se reintentan hasta 3 veces, y un repositorio que sigue fallando se omite, con un aviso en el log.
4. Suma los bytes por lenguaje, sin los lenguajes excluidos, y genera los SVG.
5. Hace commit de los SVG si cambiaron.

Los valores son **bytes de código**, calculados por el propio GitHub (el mismo cálculo de la barra de lenguajes de cada repositorio). Un solo repositorio grande puede pesar más que varios pequeños. Pasa el mouse sobre una barra, con el SVG abierto directamente en el navegador, para ver en cuántos repositorios aparece ese lenguaje.

### Privacidad

Los **nombres** de los repositorios privados no aparecen en el gráfico. Sus bytes de código, en cambio, sí se suman. Si el repositorio donde está el SVG es público, cualquiera puede ver esos totales. Usa `include_private: "false"` si prefieres no exponerlos.

### Errores comunes

Los mensajes del log de la Action están en portugués. Estos son los más comunes:

| Mensaje | Significado | Qué hacer |
|---|---|---|
| Token inválido ou expirado (401) | Token inválido o expirado | Genera un nuevo token y actualiza el secret `GH_TOKEN` |
| Sem permissão para acessar … (403) | Sin permiso | Revisa que el token tenga **Metadata: Read-only** y acceso a **All repositories** |
| Limite de requisições da API do GitHub atingido | Límite de solicitudes de la API alcanzado | Espera hasta la hora indicada en el mensaje, o ejecuta el workflow con menos frecuencia |
| Repositório … ignorado | Repositorio omitido | Es un aviso, no un error: el gráfico se generó sin ese repositorio |

### Limitaciones

- Los repositorios de organizaciones no se cuentan, aunque seas miembro.
- En GitHub, los workflows programados de repositorios públicos se pausan tras 60 días sin actividad. Si eso ocurre, vuelve a activar el workflow en la pestaña Actions.

## Ejecutarla localmente

Requiere Node.js 20.6 o superior (por el `--env-file`). Crea un archivo `.env`:

```
GH_TOKEN=tu_token
GH_USERNAME=tu_usuario
```

Y ejecuta:

```
node --env-file=.env src/index.mjs
```

Las opciones también se pueden pasar como variables de entorno: `OUTPUT`, `CHART_LANG`, `TITLE`, `THEMES`, `MAX_BARS`, `EXCLUDE_LANGUAGES`, `EXCLUDE_REPOS`, `INCLUDE_PRIVATE` e `INCLUDE_FORKS`.

## Desarrollo

Las pruebas usan el test runner nativo de Node, sin dependencias y sin necesidad de token:

```
npm test
```

La [CI](.github/workflows/ci.yml) ejecuta las pruebas en Node 20 y 24 en cada push y pull request. Si el secret `GH_TOKEN` está configurado en el repositorio, también ejecuta la propia Action en los tres temas y guarda los gráficos generados como artefacto.

## Licencia

[MIT](LICENSE)
