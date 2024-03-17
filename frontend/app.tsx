if (DEBUG) { require("preact/debug") }

import { saveAs } from "file-saver"
import { JSX } from "preact"
import { useEffect, useId, useRef, useState } from "preact/hooks"

import { CertMaker, CertificateInfo, CertificateSettings } from "./cert_maker"
import { CertInputValue, CertificateInput } from "./certificate_input"
import { ExtKeyUsage } from "./ext_key_usage"
import { useIsClient } from "./is_client"
import { ecP256 } from "./key_options"
import { KeyUsage } from "./key_usage"
import { sha2_256 } from "./md_options"
import { SANType } from "./san_list"
import { ZipWriter } from "./zipwriter"
import { InterfaceErrorCode, InterfaceException } from "./interface_error"

interface CAConfigureProps {
    value: CertInputValue
    onChange: (newValue: CertInputValue) => void
    certificateGenerated: boolean
    onStartNewCertificate: () => void
}

function CAConfigure(props: CAConfigureProps)
{
    return (
        <div>
            <button
                type="button"
                onClick={props.onStartNewCertificate}
                disabled={!props.certificateGenerated}
            >
                New CA certificate
            </button>

            <details>
                <summary>CA Certificate Details</summary>

                <CertificateInput
                    value={props.value}
                    onChange={props.onChange}
                    lockCa lockSubject
                    disabled={props.certificateGenerated}
                />
            </details>
        </div>
    )
}

function setFileInput(elem: HTMLInputElement, file: File | undefined) {
    const dataTransfer = new DataTransfer()
    if (file) {
        dataTransfer.items.add(file)
    }
    elem.files = dataTransfer.files
}

interface CAFilesProps {
    certFile?: File
    keyFile?: File
    onCertFile: (certFile: File | undefined) => void
    onKeyFile: (certFile: File | undefined) => void
    certError?: string
    keyError?: string
    certInfo?: CertificateInfo
    required?: boolean
}

function CAFiles(props: CAFilesProps)
{
    const handleCertChange = (event: JSX.TargetedEvent<HTMLInputElement>) => {
        let file = undefined
        if (event.currentTarget.files)
            file = event.currentTarget.files[0]

        props.onCertFile(file)
    }

    const handleKeyChange = (event: JSX.TargetedEvent<HTMLInputElement>) => {
        let file = undefined
        if (event.currentTarget.files)
            file = event.currentTarget.files[0]

        props.onKeyFile(file)
    }

    const certRef = useRef<HTMLInputElement>(null)
    const keyRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (certRef.current)
            setFileInput(certRef.current, props.certFile)

        if (keyRef.current)
            setFileInput(keyRef.current, props.keyFile)
    }, [])

    useEffect(() => {
        if (certRef.current) {
            certRef.current.setCustomValidity(props.certError ?? "")
            if (props.certError)
                certRef.current.reportValidity()
        }
    }, [props.certError])

    useEffect(() => {
        if (keyRef.current) {
            keyRef.current.setCustomValidity(props.keyError ?? "")
            if (props.keyError)
                keyRef.current.reportValidity()
        }
    }, [props.keyError])

    const certId = useId()
    const keyId = useId()

    return (
        <div>
            <div>
                <label for={certId}>Certificate: </label>
                <input
                    id={certId}
                    ref={certRef}
                    type="file"
                    onChange={handleCertChange}
                    required={props.required}
                />
            </div>
            <div>
                <label for={keyId}>Key: </label>
                <input
                    id={keyId}
                    ref={keyRef}
                    type="file"
                    onChange={handleKeyChange}
                    required={props.required}
                />
            </div>

            {props.certInfo ?
                <div>
                    <p>Certificate: {props.certInfo.subjectName}</p>
                    {!props.certInfo.isCa ?
                        <p class="warning">
                        Not marked as a CA certificate.
                        Programs are likely to reject certificates signed by this certificate.
                        </p>
                        : null}
                </div>
                : null}
        </div>
    )
}

function NoneCA() {
    return (
        <div>
            <p>Selecting this tab means the generated certificate won't be signed by a CA certificate.
            Instead, it will create a single self-signed certificate that's not part of a certificate chain.</p>

            <p>This is not recommended because it means your end/leaf certificate also acts as its own authority.
            Firefox does not accept these certificates and depending on the certificate's settings,
            Chrome refuses to import it through Chrome's certificate management UI on Linux.</p>

            <p>But hey, if none of that is an issue for you, then you can try this. :^)</p>
        </div>
    )
}

enum CaTab {
    Configure,
    UseFiles,
    None,
}

interface CertSignInfo {
    subjectName: string
    certPem: string
    keyPem: string
}

type SigningInfo = CertSignInfo | "selfsigned"

interface CaInterfaceProps {
    caCertSettings: CertInputValue
    setCaCertSettings: (newSettings: CertInputValue) => void
}

function useCaInterface(props: CaInterfaceProps)
{
    const [pemDataFor, setPemDataFor] = useState<CertInputValue>()
    const [confCertificatePem, setConfCertificatePem] = useState<string>()
    const [confKeyPem, setConfKeyPem] = useState<string>()

    const settingsLocked = pemDataFor === props.caCertSettings

    const [fileCertificatePem, setFileCertificatePem] = useState<string>()
    const [fileKeyPem, setFileKeyPem] = useState<string>()

    const [certFile, setCertFile] = useState<File>()
    const [keyFile, setKeyFile] = useState<File>()
    const [certFileError, setCertFileError] = useState<string>()
    const [keyFileError, setKeyFileError] = useState<string>()

    const [certFileInfo, setCertFileInfo] = useState<CertificateInfo>()

    const [tab, setTab] = useState(CaTab.Configure)

    const getCertificate = (certMaker: CertMaker): SigningInfo => {
        if (tab === CaTab.Configure) {
            let certPem = confCertificatePem
            let keyPem = confKeyPem
            if (pemDataFor !== props.caCertSettings) {
                const caCert = certMaker.makeCertificate({
                    ...props.caCertSettings,
                    issuerName: props.caCertSettings.subjectName,
                    signMethod: "selfsigned",
                })

                setConfCertificatePem(caCert.certPem)
                setConfKeyPem(caCert.keyPem)
                setPemDataFor(props.caCertSettings)

                certPem = caCert.certPem
                keyPem = caCert.keyPem
            }

            if (certPem === undefined || keyPem === undefined) {
                throw Error("Assertion failed")
            }

            return {
                subjectName: props.caCertSettings.subjectName,
                certPem: certPem,
                keyPem: keyPem,
            }
        }

        if (tab === CaTab.UseFiles) {
            if (!certFileInfo || !fileCertificatePem || !fileKeyPem)
                throw Error("Missing or bad CA files")

            return {
                subjectName: certFileInfo.subjectName,
                certPem: fileCertificatePem,
                keyPem: fileKeyPem
            }
        }

        if (tab === CaTab.None) {
            return "selfsigned"
        }

        throw Error("Unhandled CA tab")
    }

    const handleFileError = (error: any) => {
        if (error instanceof InterfaceException) {
            if (error.code == InterfaceErrorCode.ReadCert) {
                setCertFileError("Error reading certificate file.")
                return
            }

            if (error.code == InterfaceErrorCode.ReadKey) {
                setKeyFileError("Error reading private key file.")
                return
            }

            if (error.code == InterfaceErrorCode.KeyMismatch) {
                setKeyFileError("Private key doesn't match the supplied certificates.")
                return
            }
        }

        setCertFileError(`Unexpected error: ${error.toString()}`)
    }

    useEffect(() => {
        setCertFileInfo(undefined)
        setFileCertificatePem(undefined)
        setFileKeyPem(undefined)
        setCertFileError(undefined)
        setKeyFileError(undefined)

        if (!certFile) return

        let ignore = false

        certFile.arrayBuffer().then(async certContent => {
            let keyContent
            if (keyFile)
                keyContent = await keyFile.arrayBuffer()

            const certMaker = await CertMaker.get()

            if (ignore) return

            let certInfo: CertificateInfo
            try {
                certInfo = keyContent
                    ? certMaker.getCertificateKeyInfo(certContent, keyContent)
                    : certMaker.getCertificateInfo(certContent)
            } catch (error) {
                handleFileError(error)
                return
            }

            setCertFileInfo(certInfo)

            setFileCertificatePem(certInfo.certPem)
            if (certInfo.keyPem)
                setFileKeyPem(certInfo.keyPem)
        })

        return () => { ignore = true }
    }, [certFile, keyFile])

    const handleStartNewCertificate = () => {
        setPemDataFor(undefined)
    }

    const ui = (
        <div class="tabcontainer">
            <div class="tabbar">
                <button
                    type="button"
                    onClick={() => setTab(CaTab.Configure)}
                    data-active={tab === CaTab.Configure}
                >
                    Configure
                </button>

                <button
                    type="button"
                    onClick={() => setTab(CaTab.UseFiles)}
                    data-active={tab === CaTab.UseFiles}
                >
                    Use Files...
                </button>

                <button
                    type="button"
                    onClick={() => setTab(CaTab.None)}
                    data-active={tab === CaTab.None}
                >
                    None
                </button>
            </div>

            <div class="tabcontent">
                {tab === CaTab.Configure ?
                    <CAConfigure
                        value={props.caCertSettings}
                        onChange={props.setCaCertSettings}
                        certificateGenerated={settingsLocked}
                        onStartNewCertificate={handleStartNewCertificate}
                    />
                    : null}

                {tab === CaTab.UseFiles ?
                    <CAFiles
                        certFile={certFile}
                        keyFile={keyFile}
                        onCertFile={setCertFile}
                        onKeyFile={setKeyFile}
                        certInfo={certFileInfo}
                        certError={certFileError}
                        keyError={keyFileError}
                        required
                    />
                    : null}

                {tab === CaTab.None ?
                    <NoneCA />
                    : null}
            </div>
        </div>
    )

    return {
        ui,
        getCertificate
    }
}

function initialValidity(years: number)
{
    const notBefore = new Date()
    // Account for clock skew/configuration issues
    notBefore.setUTCHours(notBefore.getUTCHours() - 1)

    const notAfter = new Date(notBefore)
    // Seems to take care of leap years for us
    notAfter.setUTCFullYear(notAfter.getUTCFullYear() + years)

    return {notBefore, notAfter}
}

const initialCaValidity = () => initialValidity(10)
const initialLeafValidity = () => initialValidity(1)

interface CreateResult {
    caCert?: string
    caKey?: string
    endCert: string
    endKey: string
    endSettings: CertificateSettings
}

interface CertificateSettingsParams {
    onResult: (res: CreateResult) => void
}

function CertificateSettingsForm(props: CertificateSettingsParams)
{
    const isClient = useIsClient()

    const [caCertSettings, setCaCertSettings] = useState<CertInputValue>({
        subjectName: "C=NL, O=Easy Self Signed, CN=EASYROOTCA", // TODO: *branding*
        sanList: [],
        keyGen: ecP256,
        md: sha2_256,
        validity: initialCaValidity(),
        keyUsage: KeyUsage.keyCertSign,
        extKeyUsage: ExtKeyUsage.none,
        isCa: true,
    })

    const [leafSettings, setLeafSetting] = useState<CertInputValue>({
        subjectName: "",
        sanList: [],
        keyGen: ecP256,
        md: sha2_256,
        validity: initialLeafValidity(),
        keyUsage: KeyUsage.digitalSignature,
        extKeyUsage: ExtKeyUsage.serverAuth | ExtKeyUsage.clientAuth,
        isCa: false,
    })

    const caInterface = useCaInterface({
        caCertSettings: caCertSettings,
        setCaCertSettings: setCaCertSettings,
    })

    const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
        e.preventDefault()
        const certMaker = await CertMaker.get()

        const signingInfo = caInterface.getCertificate(certMaker)

        const settings: CertificateSettings = {
            ...leafSettings,
            issuerName: signingInfo === "selfsigned" ? leafSettings.subjectName : signingInfo.subjectName,
            signMethod: signingInfo === "selfsigned" ? "selfsigned" : {pem: signingInfo.keyPem}
        }

        const certData = certMaker.makeCertificate(settings)

        const result: CreateResult = {
            endCert: certData.certPem,
            endKey: certData.keyPem,
            endSettings: settings,
        }

        if (signingInfo !== "selfsigned") {
            result.caCert = signingInfo.certPem
            result.caKey = signingInfo.keyPem
        }
        props.onResult(result)
    }

    return (
        <form onSubmit={handleSubmit} autocomplete="off" inert={!isClient}>
            <h2>CA Certificate</h2>
            <p>Generally, using the "Configure" tab and its default settings should be fine.
            If you want to use an existing CA certificate, then switch to the "Use Files..." tab.</p>
            {caInterface.ui}

            <h2>End Certificate</h2>
            <p>For web development, you can add your domains to the SAN list and keep the rest on default.</p>
            <CertificateInput
                value={leafSettings}
                onChange={setLeafSetting}
            />

            <button>Make Certificates</button>
        </form>
    )
}

function certFirstName(settings: CertificateSettings): string {
    const cnMatch = settings.subjectName.match(/\bCN=([^,]*)/)
    if (cnMatch) {
        const commonName = cnMatch[1].trim()
        if (commonName)
            return commonName
    }

    for (const [type, value] of settings.sanList) {
        if (type === SANType.dns) {
            return value.replace("*", "star")
        }
    }

    return "cert"
}

function certFileName(settings: CertificateSettings) {
    let name = certFirstName(settings)
    name = name.replaceAll(/[^-.a-zA-Z0-9]/g, "")
    if (!name)
        name = "cert"

    return name
}

export function App() {
    const onDownload = (result: CreateResult) => {
        const name = certFileName(result.endSettings)

        const writer = new ZipWriter()
        writer.addFile(`${name}/${name}.crt`, new TextEncoder().encode(result.endCert))
        writer.addFile(`${name}/${name}.key`, new TextEncoder().encode(result.endKey))

        if (result.caCert)
            writer.addFile(`${name}/ca_cert.crt`, new TextEncoder().encode(result.caCert))

        if (result.caKey)
            writer.addFile(`${name}/ca_key.key`, new TextEncoder().encode(result.caKey))

        saveAs(writer.complete(), `${name}.zip`)
    }

    return (
        <div>
            <CertificateSettingsForm
                onResult={onDownload}
            />
        </div>
    )
}
