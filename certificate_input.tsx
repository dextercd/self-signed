import { JSX } from "preact"
import { useId } from "preact/hooks"

import { keyLabel, KeyOption, keyOptions } from "./key_options"
import { Validity, ValidityRange } from "./validity"
import { MD, mdOptions } from "./md_options"
import { SANListInput } from "./san_input"
import { SANList } from "./san_list"
import { KeyUsage } from "./key_usage"
import { KeyUsageInput } from "./key_usage_options"
import { ExtKeyUsage } from "./ext_key_usage"
import { ExtKeyUsageInput } from "./ext_key_usage_options"

interface KeyOptionSelectParams {
    value: KeyOption
    onChange: (newValue: KeyOption) => void
    id?: string
}

function KeyOptionSelect({value, onChange, id}: KeyOptionSelectParams)
{
    const selected = keyOptions.indexOf(value).toString()

    const handleChange = (event: JSX.TargetedEvent<HTMLSelectElement>) => {
        const newValue = keyOptions[parseInt(event.currentTarget.value)]
        onChange(newValue)
    }

    let warning
    if (value.type === "rsa") {
        if (value.keyLength > 4000)
            warning = "Generating an RSA key of this length can take multiple tens of seconds."
        else if (value.keyLength > 2000)
            warning = "Generating an RSA key of this length can take multiple seconds."
    }

    return (
        <div>
            {warning ? <p>Warning: {warning}</p> : null}
            <select id={id} value={selected} onChange={handleChange}>
                {keyOptions.map((option, idx) =>
                    <option key={idx} value={idx}>{keyLabel(option)}</option>)}
            </select>
        </div>
    )
}

interface MDSelectParams {
    value: MD
    onChange: (newValue: MD) => void
    id?: string
}

function MDSelect({value, onChange, id}: MDSelectParams)
{
    const selected = mdOptions.indexOf(value).toString()

    const handleChange = (event: JSX.TargetedEvent<HTMLSelectElement>) => {
        const newValue = mdOptions[parseInt(event.currentTarget.value)]
        onChange(newValue)
    }

    return (
        <div>
            <select id={id} value={selected} onChange={handleChange}>
                {mdOptions.map((option, idx) =>
                    <option key={idx} value={idx}>{option.name}</option>)}
            </select>
        </div>
    )
}

export interface CertInputValue {
    subjectName: string
    sanList: SANList
    keyGen: KeyOption
    md: MD
    validity: ValidityRange
    keyUsage: KeyUsage
    extKeyUsage: ExtKeyUsage
    isCa: boolean
}

interface CertificateInputProps {
    value: CertInputValue
    onChange: (newValue: CertInputValue) => void
    disabled?: boolean
    lockCa?: boolean
    lockSubject?: boolean
}

export function CertificateInput(props: CertificateInputProps)
{
    const { value, onChange } = props

    const onSubjectChange = (event: JSX.TargetedEvent<HTMLInputElement>) => {
        onChange({
            ...value,
            subjectName: event.currentTarget.value,
        })
    }

    const onSANListChange = (newValue: SANList) => {
        onChange({
            ...value,
            sanList: newValue,
        })
    }

    const onValidityChange = (newValue: ValidityRange) => {
        onChange({
            ...value,
            validity: newValue,
        })
    }

    const onKeyUsageChange = (newValue: KeyUsage) => {
        onChange({
            ...value,
            keyUsage: newValue,
        })
    }

    const onExtKeyUsageChange = (newValue: ExtKeyUsage) => {
        onChange({
            ...value,
            extKeyUsage: newValue,
        })
    }

    const onCaClick = () => {
        onChange({
            ...value,
            isCa: !value.isCa,
        })
    }

    const onKeyGenChange = (newValue: KeyOption) => {
        onChange({
            ...value,
            keyGen: newValue,
        })
    }

    const onMdChange = (newValue: MD) => {
        onChange({
            ...value,
            md: newValue,
        })
    }

    const sanListId = useId()
    const subjectId = useId()
    const isCaId = useId()
    const keyGenId = useId()
    const mdId = useId()

    return (
        <fieldset disabled={props.disabled}>
            <div class="field">
                <label for={subjectId}>Subject{props.lockSubject ? " (Locked)" : null}:</label>
                <input
                    id={subjectId}
                    value={value.subjectName}
                    onInput={onSubjectChange}
                    title="Optional. Comma separated list of element assignments, e.g., C=UK, O=Widget Corp."
                    disabled={props.lockSubject}
                />
            </div>

            <div class="field">
                <label for={sanListId}>SAN List:</label>
                <SANListInput
                    id={sanListId}
                    value={value.sanList}
                    onChange={onSANListChange}
                />
            </div>

            <div class="field">
                <label>Validity (UTC):</label>
                <Validity
                    value={value.validity}
                    onChange={onValidityChange}
                    required
                />
            </div>

            <div class="fields">
                <div class="field">
                    <label>Key Usage:</label>
                    <KeyUsageInput
                        value={value.keyUsage}
                        onChange={onKeyUsageChange}
                    />
                </div>
                <div class="field">
                    <label>Extended Key Usage:</label>
                    <ExtKeyUsageInput
                        value={value.extKeyUsage}
                        onChange={onExtKeyUsageChange}
                    />
                </div>
            </div>

            <div class="field">
                <div>
                    <label for={isCaId}>Is CA:</label>
                    <input
                        id={isCaId}
                        type="checkbox"
                        checked={props.lockCa}
                        onClick={onCaClick}
                        disabled={props.lockCa}
                    />
                </div>
            </div>

            <div class="fields">
                <div class="field">
                    <label for={keyGenId}>Key Algorithm:</label>
                    <KeyOptionSelect
                        id={keyGenId}
                        value={value.keyGen}
                        onChange={onKeyGenChange}
                    />
                </div>

                <div class="field">
                    <label for={mdId}>Signing MD:</label>
                    <MDSelect
                        id={mdId}
                        value={value.md}
                        onChange={onMdChange}
                    />
                </div>
            </div>
        </fieldset>
    )
}
