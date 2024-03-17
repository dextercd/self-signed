declare module "*.wasm" {
    const path: string
    export default path
}

const DEBUG: boolean
function require(path: string): any
