export interface MD {
    name: string
}

export const sha2_256 = {name: "SHA2-256"}

// Values here are just for display. We just pass an index number to the WASM
// module.
export const mdOptions: MD[] = [
    {name: "SHA2-224"},
    sha2_256,
    {name: "SHA2-384"},
    {name: "SHA2-512"},
]
