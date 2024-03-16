export enum KeyUsage {
    digitalSignature = 0x80,
    nonRepudiation = 0x40,
    keyEncipherment = 0x20,
    dataEncipherment = 0x10,
    keyAgreement = 0x08,
    keyCertSign = 0x04,
    crlSign = 0x02,
    encipherOnly = 0x01,
    decipherOnly = 0x8000,
}

export const KEY_USAGE_VALUES = [
    KeyUsage.digitalSignature,
    KeyUsage.nonRepudiation,
    KeyUsage.keyEncipherment,
    KeyUsage.dataEncipherment,
    KeyUsage.keyAgreement,
    KeyUsage.keyCertSign,
    KeyUsage.crlSign,
    KeyUsage.encipherOnly,
    KeyUsage.decipherOnly,
]

export function keyUsageLabel(ku: KeyUsage): string {
    switch (ku) {
        case KeyUsage.digitalSignature:
            return "Digital Signature"
        case KeyUsage.nonRepudiation:
            return "Non Repudiation"
        case KeyUsage.keyEncipherment:
            return "Key Encipherment"
        case KeyUsage.dataEncipherment:
            return "Data Encipherment"
        case KeyUsage.keyAgreement:
            return "Key Agreement"
        case KeyUsage.keyCertSign:
            return "Certificate Sign"
        case KeyUsage.crlSign:
            return "CRL Sign"
        case KeyUsage.encipherOnly:
            return "Encipher Only"
        case KeyUsage.decipherOnly:
            return "Decipher Only"
        default:
            return ""
    }
}
