export type RSAOption = {
    type: "rsa"
    keyLength: number
    exponent: number
}

export type ECOption = {
    type: "ec"
    nistName: string,
    otherName: string,
}

export type KeyOption = RSAOption | ECOption

export const ecP256: ECOption = {type: "ec", nistName: "P-256", otherName: "prime256v1"}

// Values here are just for display. We just pass an index number to the WASM
// module which then generates a key matching these display values.
export const keyOptions: KeyOption[] = [
    ecP256,
    {type: "ec", nistName: "P-384", otherName: "secp384r1"},
    {type: "rsa", keyLength: 2048, exponent: 0x10001},
    {type: "rsa", keyLength: 4096, exponent: 0x10001},
]

export function keyLabel(keyopt: KeyOption): string
{
    switch (keyopt.type) {
        case "rsa":
            return `RSA (${keyopt.keyLength} bit)`

        case "ec":
            return `EC ${keyopt.nistName} (${keyopt.otherName})`
    }
}
