# Languages Chart

<sub>[Português](README.md) · [English](README.en.md) · **Español**</sub>

GitHub Action que genera un gráfico SVG con los lenguajes más usados en tus repositorios, **incluidos los privados**, y mantiene el gráfico de tu README siempre actualizado.

<p>
  <img src="https://raw.githubusercontent.com/jvsiqueira1/jvsiqueira1/main/languages.svg" alt="Ejemplo del gráfico generado" />
</p>

<sub>Ejemplo real, actualizado a diario en el perfil de <a href="https://github.com/jvsiqueira1">@jvsiqueira1</a>.</sub>

## Por qué usarla

- **Incluye repositorios privados.** Los servicios que generan la imagen a partir de una URL solo ven los repositorios públicos. Aquí, la Action se ejecuta en tu propio repositorio con tu propio token, que nunca sale de tu cuenta.
- **Tema claro y oscuro.** Los colores siguen el tema del sistema de quien lo está viendo.
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
          title: "Lenguajes más usados"
```

### 4. Agrega el gráfico a tu README

```md
![Lenguajes más usados](languages.svg)
```

Para generar el primer gráfico sin esperar a la programación, ve a **Actions → Actualizar lenguajes → Run workflow**.

## Opciones

| Input | Valor por defecto | Descripción |
|---|---|---|
| `token` | — | **Obligatorio.** Token con acceso de lectura (Metadata) a tus repositorios |
| `username` | dueño del repositorio | Usuario de GitHub cuyos repositorios se analizarán |
| `output` | `languages.svg` | Ruta del SVG generado |
| `title` | `Linguagens mais usadas` | Título del gráfico |
| `max_bars` | `8` | Cantidad de lenguajes mostrados antes de agrupar el resto en "Outras" (Otros) |
| `include_private` | `true` | Incluir repositorios privados |
| `include_forks` | `false` | Incluir forks |
| `commit` | `true` | Hacer commit del SVG automáticamente |
| `commit_message` | `chore: atualiza gráfico de linguagens` | Mensaje del commit |

### Ejemplos

Solo repositorios públicos, con el SVG en una carpeta:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  with:
    token: ${{ secrets.GH_TOKEN }}
    include_private: "false"
    title: "Lenguajes más usados"
    output: "assets/languages.svg"
```

Generar el SVG sin hacer commit, para usarlo en otro paso de tu workflow:

```yaml
- uses: jvsiqueira1/gh-stats@v1
  with:
    token: ${{ secrets.GH_TOKEN }}
    commit: "false"
```

## Cómo funciona

1. Lista todos los repositorios que el token puede ver (`GET /user/repos`), con paginación.
2. Mantiene solo los que pertenecen a `username` y, por defecto, ignora los forks.
3. Obtiene los lenguajes de cada repositorio (`GET /repos/{owner}/{repo}/languages`), 10 a la vez.
4. Suma los bytes por lenguaje y genera el SVG.
5. Hace commit del SVG si cambió.

Los valores son **bytes de código**, calculados por el propio GitHub (el mismo cálculo de la barra de lenguajes de cada repositorio). Un solo repositorio grande puede pesar más que varios pequeños. Pasa el mouse sobre una barra, con el SVG abierto directamente en el navegador, para ver en cuántos repositorios aparece ese lenguaje.

### Privacidad

Los **nombres** de los repositorios privados no aparecen en el gráfico. Sus bytes de código, en cambio, sí se suman. Si el repositorio donde está el SVG es público, cualquiera puede ver esos totales. Usa `include_private: "false"` si prefieres no exponerlos.

### Limitaciones

- Los repositorios de organizaciones no se cuentan, aunque seas miembro.
- Los textos fijos del gráfico (el subtítulo y la barra "Outras") están en portugués. El título se puede cambiar con el input `title`.
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

Las opciones también se pueden pasar como variables de entorno: `OUTPUT`, `TITLE`, `MAX_BARS`, `INCLUDE_PRIVATE` e `INCLUDE_FORKS`.

## Licencia

[MIT](LICENSE)
