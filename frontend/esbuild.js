const fs = require("fs").promises
const path = require("path")
const esbuild = require("esbuild")

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

const defines = {
    DEBUG: isDev ? "true" : "false",
}

const target = ["es2022", "chrome119", "firefox115", "safari16.6"]

const commonSettings = {
    target: target,
    minify: !isDev,
    define: defines,
    charset: 'utf8',
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

async function makeBundle()
{
    const result = await esbuild.build({
        ...jsCommonSettings,
        entryPoints: ["index.tsx"],
        bundle: true,
        platform: "browser",
        outdir: outDir,
        entryNames: '[dir]/[name]-[hash]',
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

    return {indexJs, signWasm}
}

async function getAppPrerender()
{
    await esbuild.build({
        ...jsCommonSettings,
        entryPoints: ["prerender.tsx"],
        bundle: true,
        platform: "node",
        outdir: scratchDir,
    })
    return require(scratchDir + "/prerender.js").default
}

async function makeSheetCss()
{
    let result = await esbuild.build({
        ...cssCommonSettings,
        entryPoints: ["sheet.css"],
        write: false,
    })

    return new TextDecoder().decode(result.outputFiles[0].contents).trim()
}

async function makeIndexHtml()
{
    const [prerender, css, bundleResult] = await Promise.all([
        getAppPrerender(),
        makeSheetCss(),
        makeBundle(),
    ])

    let indexHtml = await fs.readFile("index.html", "utf-8")
    indexHtml = indexHtml.replace(
        '<div id="app"></div>',
        `<div id="app">${prerender}</div>`,
    )
    indexHtml = indexHtml.replace(
        '<link rel="stylesheet" href="sheet.css">',
        `<style>${css}</style>`,
    )
    indexHtml = indexHtml.replace(
        '<link rel="preload" as="fetch" crossorigin="anonymous" href="sign.wasm">',
        `<link rel="preload" as="fetch" crossorigin="anonymous" href="${bundleResult.signWasm}">`,
    )
    indexHtml = indexHtml.replace(
        '<script async src="index.js"></script>',
        `<script async src="${bundleResult.indexJs}"></script>`,
    )

    await fs.writeFile(path.join(outDir, "index.html"), indexHtml)
}

async function buildAll() {
    await fs.rm(outDir, { force: true, recursive: true })

    await fs.mkdir(outDir, { recursive: true })
    await fs.mkdir(scratchDir, { recursive: true })

    await Promise.all([
        fs.copyFile("favicon.ico", path.join(outDir, "favicon.ico")),
        makeIndexHtml(),
    ])
}

buildAll()
    .then(() => {
        process.exit(0)
    })
    .catch(err => {
        console.error(err)
        process.exit(1)
    });
