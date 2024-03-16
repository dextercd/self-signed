export enum ExtKeyUsage {
    none = 0,
    serverAuth = 1 << 0,
    clientAuth = 1 << 1,
    codeSigning = 1 << 2,
    emailProtection = 1 << 3,
    timeStamping = 1 << 4,
    ocspSigning = 1 << 5,
    any = 1 << 6,
}

export const EXT_KEY_USAGE_VALUES = [
    ExtKeyUsage.serverAuth,
    ExtKeyUsage.clientAuth,
    ExtKeyUsage.codeSigning,
    ExtKeyUsage.emailProtection,
    ExtKeyUsage.timeStamping,
    ExtKeyUsage.ocspSigning,
    ExtKeyUsage.any,
]

export function extKeyUsageLabel(ek: ExtKeyUsage): string {
    switch (ek) {
        case ExtKeyUsage.none:
            return "None"
        case ExtKeyUsage.serverAuth:
            return "TLS Web Server Authentication"
        case ExtKeyUsage.clientAuth:
            return "TLS Web Client Authentication"
        case ExtKeyUsage.codeSigning:
            return "Code Signing"
        case ExtKeyUsage.emailProtection:
            return "Email Protection"
        case ExtKeyUsage.timeStamping:
            return "Time Stamping"
        case ExtKeyUsage.ocspSigning:
            return "Signing OCSP Responses"
        case ExtKeyUsage.any:
            return "Any"
    }
}
