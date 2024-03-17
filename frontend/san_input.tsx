import { useRef, useState } from "preact/hooks"
import { JSX } from "preact/jsx-runtime"
import { SANType, SANList } from "./san_list"

function typeLabel(type: SANType): string
{
    switch (type) {
        case SANType.dns:
            return "DNS"
        case SANType.ip:
            return "IP"
        case SANType.email:
            return "EMAIL"
    }
}

function inputTypeAttributes(type: SANType)
{
    switch (type) {
        case SANType.dns:
            return {
                maxLength: 253,
                pattern: "([0-9a-zA-Z_\\-]{1,63}|\\*)(\.[0-9a-zA-Z_\\-]{1,63})*",
                class: "lower-case"
            }
        case SANType.ip:
            return {
                maxLength: 39,
                pattern: "(((^|\\.)((25[0-5])|(2[0-4]\\d)|(1\\d\\d)|([1-9]?\\d))){4})|(([a-f0-9:]+:+)+[a-f0-9]+)$",
            }
        case SANType.email:
            return {
                type: "email",
            }
    }
}

export interface SANListInputParams {
    value: SANList
    onChange: (newValue: SANList) => void
    id?: string
}

const emailDomainRegex = /@[^@]*$/g

function normaliseValue(type: SANType, value: string)
{
    switch (type) {
    case SANType.dns:
        return value.toLowerCase()
    case SANType.email:
        return value.replaceAll(emailDomainRegex, v => v.toLowerCase())
    default:
        return value;
    }
}


export function SANListInput({ value, onChange, id }: SANListInputParams)
{
    const [nextType, setNextType] = useState(SANType.dns)
    const [nextValue, setNextValue] = useState("")

    const inputRef = useRef<HTMLInputElement>(null)

    const handleTypeChange = (event: JSX.TargetedEvent<HTMLSelectElement>) => {
        setNextType(parseInt(event.currentTarget.value))
        setNextValue("")
    }

    const handleNextValueChange = (event: JSX.TargetedEvent<HTMLInputElement>) => {
        setNextValue(event.currentTarget.value)
    }

    const doSubmit = () => {
        if (!nextValue || inputRef.current && !inputRef.current.reportValidity()) {
            return;
        }

        const normValue = normaliseValue(nextType, nextValue)
        const alreadyHasValue = value.find(([t, v]) => t === nextType && v === normValue)
        if (!alreadyHasValue) {
            onChange(value.concat([[nextType, normValue]]))
        }
        setNextValue("")
    }

    const handleSubmit = (event: JSX.TargetedEvent<HTMLButtonElement>) => {
        event.preventDefault()
        doSubmit()
    }

    const checkEnter = (event: JSX.TargetedEvent<HTMLInputElement, KeyboardEvent>) => {
        if (event.key === "Enter") {
            event.preventDefault()
            doSubmit()
        }
    }

    const remove = (idx: number) => () => {
        const newValue = [...value]
        newValue.splice(idx, 1)
        onChange(newValue)
    }

    return (
        <div>
            <select
                form="disassociate-form"
                aria-label="Name type"
                value={nextType}
                onChange={handleTypeChange}
            >
                <option value={SANType.dns}>{typeLabel(SANType.dns)}</option>
                <option value={SANType.ip}>{typeLabel(SANType.ip)}</option>
            </select>
            {" "}
            <input
                id={id}
                key={nextType}
                ref={inputRef}
                form="disassociate-form"
                value={nextValue}
                onInput={handleNextValueChange}
                onKeyPress={checkEnter}
                {...inputTypeAttributes(nextType)}
            />
            {" "}
            <button type="button" onClick={handleSubmit}>Add</button>

            <ul>
                {value.map(([type, value], idx) =>
                    <li key={idx}>
                        <button type="button" onClick={remove(idx)}>Remove</button>
                        {" "}{typeLabel(type)}: {value}
                    </li>)}
            </ul>
        </div>
    )
}
