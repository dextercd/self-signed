import { ConsoleStdout, File, OpenFile, PreopenDirectory, WASI } from "@bjorn3/browser_wasi_shim"
import { WComms } from "./wcomms"

import signPath from "sign.wasm"
import { KeyOption, keyOptions } from "./key_options"
import { ValidityRange } from "./validity"
import { MD, mdOptions } from "./md_options"
import { SANList } from "./san_list"
import { KeyUsage } from "./key_usage"
import { ExtKeyUsage } from "./ext_key_usage"
import { InterfaceErrorCode, InterfaceException } from "./interface_error"

function checkError(status: InterfaceErrorCode)
{
    if (status !== InterfaceErrorCode.Success)
        throw new InterfaceException(status)
}

function validityString(d: Date)
{
    const dateTimeStr = d.toISOString().substring(0, 19)
    return Array.from(dateTimeStr).filter(c => c >= "0" && c <= "9").join("")
}

function cleanSubject(settings: CertificateSettings)
{
    let subject = settings.subjectName.trim()
    if (subject.includes("CN=") || settings.sanList.length === 0)
        return subject

    return [subject, `CN=${settings.sanList[0][1]}`].filter(Boolean).join(",")
}

export class CertMaker {
    wasi: WASI
    instance: WebAssembly.Instance | undefined
    input: File
    output: File
    directory: PreopenDirectory

    private constructor(wasi: WASI, input: File, output: File, directory: PreopenDirectory)
    {
        this.wasi = wasi
        this.input = input
        this.output = output
        this.directory = directory
    }

    private fillRandom(offset: number, length: number)
    {
        // @ts-ignore
        const memory = this.instance.exports.memory.buffer as ArrayBuffer
        globalThis.crypto.getRandomValues(new Uint8Array(memory, offset, length))
    }

    private static async make(): Promise<CertMaker>
    {
        const input = new File([])
        const output = new File([])

        const args: string[] = []
        const env: string[] = []
        const directory = new PreopenDirectory(".", {
            "input": input,
            "result": output,
        })
        const fds = [
            new OpenFile(new File([])),
            ConsoleStdout.lineBuffered(msg => console.log(`[WASI stdout] ${msg}`)),
            ConsoleStdout.lineBuffered(msg => console.warn(`[WASI stderr] ${msg}`)),
            directory,
        ]

        const wasi = new WASI(args, env, fds, {debug: DEBUG})
        let certMaker = new CertMaker(
            wasi,
            input,
            output,
            directory,
        )

        const module = await WebAssembly.compileStreaming(fetch(signPath))
        const instance = await WebAssembly.instantiate(module, {
            wasi_snapshot_preview1: wasi.wasiImport,
            crypto: {
                fill_random: certMaker.fillRandom.bind(certMaker)
            }
        })

        // @ts-ignore
        wasi.initialize(instance)
        certMaker.instance = instance

        return certMaker
    }

    private static pendingCertMaker: Promise<CertMaker> | undefined
    static async get(): Promise<CertMaker>
    {
        if (!CertMaker.pendingCertMaker) {
            CertMaker.pendingCertMaker = CertMaker.make()
        }

        return CertMaker.pendingCertMaker
    }

    private setInput(c: WComms)
    {
        this.input.truncate()
        this.input.data = c.complete()
    }

    makeCertificate(settings: CertificateSettings): MakeCertificateResult
    {
        this.output.truncate()
        const certFile = new File([], {readonly: false})
        let keyFile: File

        if (settings.signMethod === "selfsigned") {
            keyFile = new File([], {readonly: false})
        } else {
            keyFile = this.binaryFile(new TextEncoder().encode(settings.signMethod.pem))
        }

        this.directory.dir.contents["cert"] = certFile
        this.directory.dir.contents["key"] = keyFile

        const c = new WComms()
        c.addString(settings.issuerName)
        c.addString(cleanSubject(settings))
        c.addBool(settings.isCa)
        c.addBool(settings.signMethod === "selfsigned")

        c.addUint32(settings.sanList.length)
        for (const [type, value] of settings.sanList) {
            c.addUint32(type)
            c.addString(value)
        }
        c.addUint32(keyOptions.indexOf(settings.keyGen))
        c.addUint32(mdOptions.indexOf(settings.md))
        c.addString(validityString(settings.validity.notBefore))
        c.addString(validityString(settings.validity.notAfter))
        c.addUint32(settings.keyUsage)
        c.addUint32(settings.extKeyUsage)
        this.setInput(c)

        // @ts-ignore
        checkError(this.instance.exports.run())

        const certPem = new TextDecoder().decode(certFile.data)
        const keyPem = new TextDecoder().decode(keyFile.data)

        return {certPem, keyPem}
    }

    private binaryFile(certificateData: ArrayBuffer)
    {
        const c = new Comms()
        c.addByteArray(certificateData)
        return new File(c.complete(), {readonly: false})
    }

    private readCertGist(buffer: ArrayBuffer)
    {
        const out = new Uint8Array(buffer)
        const isCa = out[0] !== 0
        const subjectName = new TextDecoder().decode(this.output.data.slice(1))
        return {isCa, subjectName}
    }

    getCertificateInfo(certificateData: ArrayBuffer): CertificateInfo
    {
        this.output.truncate()

        const certFile = this.binaryFile(certificateData)
        this.directory.dir.contents["cert"] = certFile

        // @ts-ignore
        checkError(this.instance.exports.cert_info())

        const {isCa, subjectName} = this.readCertGist(this.output.data)
        const certPem = new TextDecoder().decode(certFile.data)
        return {
            isCa,
            subjectName,
            certPem,
        }
    }

    getCertificateKeyInfo(certificateData: ArrayBuffer, keyData: ArrayBuffer): CertificateInfo
    {
        this.output.truncate()

        const certFile = this.binaryFile(certificateData)
        const keyFile = this.binaryFile(keyData)
        this.directory.dir.contents["cert"] = certFile
        this.directory.dir.contents["key"] = keyFile

        // @ts-ignore
        checkError(this.instance.exports.cert_key_info())

        const {isCa, subjectName} = this.readCertGist(this.output.data)
        const certPem = new TextDecoder().decode(certFile.data)
        const keyPem = new TextDecoder().decode(keyFile.data)
        return {
            isCa,
            subjectName,
            certPem,
            keyPem,
        }
    }
}

type SignMethod = "selfsigned" | { pem: string }

export interface CertificateSettings {
    issuerName: string
    subjectName: string
    signMethod: SignMethod
    sanList: SANList
    keyGen: KeyOption
    md: MD
    validity: ValidityRange
    keyUsage: KeyUsage
    extKeyUsage: ExtKeyUsage
    isCa: boolean
}

export interface MakeCertificateResult {
    certPem: string
    keyPem: string
}

export interface CertificateInfo {
    isCa: boolean
    subjectName: string
    certPem: string
    keyPem?: string
}
