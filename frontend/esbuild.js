const fs = require("fs").promises
const path = require("path")
const esbuild = require("esbuild")

const markdownit = require("markdown-it")
const hljs = require("highlight.js")

// Frontend build is initiated by CMake, it sets some environment variables to
// configure the type of build we want (debug/prod) and some file locations.

function envstr(name) {
    const result = process.env[name]
    if (result === undefined)
        throw Error(`Environment variable ${name} must be set.`)

    return result
}

function envbool(name) {
    return process.env[name] === "1"
}

const isDev = !envbool("OPTIMISE")

const outDir = envstr("OUTPUT_DIR")
const scratchDir = envstr("SCRATCH_DIR")
const signPath = envstr("SIGN_PATH")

// Esbuild variables

const defines = {
    DEBUG: isDev ? "true" : "false",
}

const target = ["es2022", "chrome119", "firefox115", "safari16.6"]

const commonSettings = {
    target: target,
    minify: !isDev,
    define: defines,
    charset: "utf8",
    bundle: true,
}

const jsCommonSettings = {
    ...commonSettings,
    sourcemap: isDev,
    loader: {
        ".wasm": "file",
    },
    alias: {
        "sign.wasm": signPath,
    },
}

const cssCommonSettings = commonSettings

// Markdown settings

const md = markdownit({
    html: true,
    linkify: true,
    highlight: function(str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return '<pre><code class="hljs">' +
                hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                '</code></pre>'
        }

        return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>'
    }
})

md.renderer.rules.code_inline = function(tokens, idx, options, env, slf) {
    const token = tokens[idx]

    const baseHtml = md.utils.escapeHtml(token.content)

    // Undo escaping of <br->
    let withBrPrevent = baseHtml
    withBrPrevent = withBrPrevent.replaceAll("&lt;br-&gt;", "<br->")
    withBrPrevent = withBrPrevent.replaceAll("&lt;/br-&gt;", "</br->")

    // We want to prevent stuff like `--cacert` to be split after a '-' character.
    // Split into words and surround them with the <br-> tag.
    // If <br-> is being used for a section then we don't insert extra ones.
    const words = withBrPrevent.split(" ")
    const unbrokenParts = []
    let inBrPrevent = false
    for (const word of words) {
        if (!inBrPrevent)
            inBrPrevent = word.includes("<br->")

        if (inBrPrevent)
            unbrokenParts.push(word)
        else
            unbrokenParts.push(`<br->${word}</br->`)

        if (inBrPrevent)
            inBrPrevent = !word.includes("</br->")
    }

    return `<code${slf.renderAttrs(token)}>${unbrokenParts.join(" ")}</code>`
}

function mdRender(markdownText)
{
    let metaText = ""
    if (markdownText.startsWith("---\n")) {
        const metaEnding = markdownText.indexOf("\n---", 4)
        metaText = markdownText.substring(4, metaEnding)

        markdownText = markdownText.substring(metaEnding + 4)
    }

    const meta = {}
    for (const metaLine of metaText.split("\n")) {
        if (!metaLine.trim())
            continue

        const splitPoint = metaLine.indexOf(":")
        const key = metaLine.substring(0, splitPoint).trim()
        const value = metaLine.substring(splitPoint + 1).trim()
        meta[key] = value
    }

    return {
        meta,
        html: md.render(markdownText)
    }
}

// Main application bundle

async function makeBundle() {
    const result = await esbuild.build({
        ...jsCommonSettings,
        entryPoints: ["index.tsx"],
        platform: "browser",
        outdir: outDir,
        entryNames: "[dir]/[name]-[hash]",
        metafile: true,
    })

    let indexJs
    let signWasm
    for (const [output, props] of Object.entries(result.metafile.outputs)) {
        if (props.entryPoint === "index.tsx") {
            indexJs = path.basename(output)
        } else {
            const inputs = Object.entries(props.inputs)
            if (inputs.length === 1 && path.basename(inputs[0][0]) === "sign.wasm")
                signWasm = path.basename(output)
        }
    }

    if (!indexJs || !signWasm)
        throw Error("Couldn't find file in esbuild result")

    return { indexJs, signWasm }
}

async function getAppPrerender() {
    await esbuild.build({
        ...jsCommonSettings,
        entryPoints: ["prerender.tsx"],
        platform: "node",
        outdir: scratchDir,
    })
    return require(scratchDir + "/prerender.js").default
}

async function makeSheetCss() {
    let result = await esbuild.build({
        ...cssCommonSettings,
        entryPoints: ["sheet.css"],
        write: false,
    })

    return new TextDecoder().decode(result.outputFiles[0].contents).trim()
}

async function makeIndexHtml() {
    const [css, indexHtml] = await Promise.all([
        makeSheetCss(),
        fs.readFile("index.html", "utf-8")
    ])

    return indexHtml.replace("[[HEAD]]",
        `<style>${css}</style>\n[[HEAD]]`
    )
}

function canonicalParts(path) {
    let parts = path.split("/")
    parts = parts.filter(p => p !== "" && p !== ".")

    const finalParts = []
    for (const part of parts) {
        if (part === ".." && finalParts.length !== 0 && finalParts[finalParts.length - 1] !== "..")
            finalParts.pop()
        else
            finalParts.push(part)
    }

    return finalParts
}

function canonicalPath(path)
{
    return canonicalParts(path).join("/")
}

function relativePath(current, next) {
    let cparts = canonicalParts(current)
    let nparts = canonicalParts(next)

    const currentFile = cparts[cparts.length - 1]  // undefined for current="/"

    while (cparts.length && nparts.length) {
        if (cparts[0] === nparts[0]) {
            cparts.shift()
            nparts.shift()
        } else break
    }

    // Same path, in that case we can use an empty string to mean current/next
    if (cparts.length === 0 && nparts.length === 0)
        return ""

    const relativeParts = []
    if (cparts.length >= 2) {
        relativeParts.push(...new Array(cparts.length - 1).fill(".."))
    } else if (cparts.length === 1 && nparts.length === 0) {
        relativeParts.push(".")
    } else if (cparts.length === 0 && currentFile !== undefined) {
        relativeParts.push(currentFile)
    }

    return [...relativeParts, ...nparts].join("/")
}

function makeNav(current) {
    current = canonicalPath(current)

    const makeLoc = (loc) => {
        loc = canonicalPath(loc)
        let attrs = `href="${relativePath(current, loc)}"`
        if (loc === current)
            attrs += " data-active"

        return attrs
    }
    return `
        <nav>
            <a ${makeLoc("")}>App</a>
            <a ${makeLoc("/usage")}>Usage</a>
            <a ${makeLoc("/about")}>About</a>
        </nav>`
}

async function saveHtml({html, pagePath, description}) {
    pagePath = canonicalPath(pagePath)

    let filePath = `${pagePath || "index"}.html`

    if (!description) {
        html = html.replace("[[DESCRIPTION]]", "")
    } else {
        html = html.replace(
            "[[DESCRIPTION]]",
            `<meta name="description" content="${md.utils.escapeHtml(description)}">`
        )
    }

    html = html.replace("[[NAV]]", makeNav(pagePath))
    html = html.replace("[[HEAD]]", "")
    html = html.replace("[[BODY]]", "")

    await fs.writeFile(path.join(outDir, filePath), html)
}


async function makeAppHtml(indexHtml) {
    const [prerender, bundleResult] = await Promise.all([
        getAppPrerender(),
        makeBundle(),
    ])

    indexHtml = indexHtml.replace(
        "[[BODY]]",
        `<div id="app">${prerender}</div>`,
    )

    indexHtml = indexHtml.replace(
        "[[HEAD]]",
        [
            `<script async src="${bundleResult.indexJs}"></script>`,
            `<link rel="preload" as="fetch" crossorigin="anonymous" href="${bundleResult.signWasm}">`,
        ].join("\n")
    )

    await saveHtml({
        html: indexHtml,
        pagePath: "/",
        description: "Easy to use web app that lets you generate self-signed certificates. Gives you a ZIP file containing a proper certificate chain.",
    })
}

async function makeMarkdownPage(indexHtml, pageName) {
    const markdownData = await fs.readFile(`pages/${pageName}.md`)
    const markdownText = new TextDecoder().decode(markdownData)
    const rendered = mdRender(markdownText)

    let page = indexHtml
    page = page.replace("[[BODY]]", `<main class="doc">${rendered.html}</main>`)

    await saveHtml({
        html: page,
        pagePath: pageName,
        description: rendered.meta.description,
    })
}

async function buildAll() {
    await fs.rm(outDir, { force: true, recursive: true })

    await fs.mkdir(outDir, { recursive: true })
    await fs.mkdir(scratchDir, { recursive: true })

    const indexHtml = await makeIndexHtml()

    await Promise.all([
        fs.copyFile("favicon.ico", path.join(outDir, "favicon.ico")),
        makeAppHtml(indexHtml),
        makeMarkdownPage(indexHtml, "usage"),
        makeMarkdownPage(indexHtml, "about"),
    ])
}

buildAll()
    .then(() => {
        process.exit(0)
    })
    .catch(err => {
        console.error(err)
        process.exit(1)
    })
