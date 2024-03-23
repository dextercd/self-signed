export enum InterfaceErrorCode
{
    Success,

    ReadInput = 100,
    ReadCert,
    ReadKey,

    WriteCert = 200,
    WriteCertInfo,
    WriteKey,

    CertSetSerial = 300,
    CertSetValidity,
    CertSetIssuer,
    CertSetSubject,
    CertSetKeyUsage,
    CertSetExtKeyUsage,
    CertSetSkid,
    CertSetAkid,
    CertSetSan,

    GenerateCert = 400,
    GenerateKey,
    CertInfo,
    KeyMismatch,
    ConvertPem,
    OpenFile,
}

export class InterfaceException extends Error {
    code: InterfaceErrorCode

    constructor(code: InterfaceErrorCode) {
        super(`InterfaceException: ${InterfaceErrorCode[code]}`)
        this.code = code
    }
}
