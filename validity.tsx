import { useId } from "preact/hooks"
import { useIsClient } from "./is_client"
import { JSX } from "preact/jsx-runtime"

export interface ValidityRange {
    notBefore: Date
    notAfter: Date
}

type ValidityKey = "notBefore" | "notAfter"

export interface ValidityProps {
    value: ValidityRange
    onChange: (newValue: ValidityRange) => void
    required?: boolean
}

function dateInputValue(d: Date)
{
    return d.toISOString().substring(0, 19)
}

export function Validity(props: ValidityProps)
{
    const isClient = useIsClient()

    const inputArgs = (args: object) => {
        const common = {
            type: "datetime-local",
            step: 1,
            min: "1970-01-01T00:00:00",
            max: "9999-12-31T23:59:59",
            required: props.required,
        }

        if (!isClient)
            return {...common, disabled: true}

        return {...common, ...args}
    }

    const handleInput = (key: ValidityKey) => (event: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputVal = event.currentTarget.value
        if (!inputVal)
            return

        const [date, time] = inputVal.split("T")
        const [year, month, day] = date.split("-")
        const [hour, minute, second] = time.split(":")
        const newDate = new Date(Date.UTC(
            parseInt(year), parseInt(month), parseInt(day),
            parseInt(hour), parseInt(minute), second ? parseInt(second) : 0
        ))
        props.onChange({
            ...props.value,
            [key]: newDate,
        })
    }

    const notBeforeId = useId()
    const notAfterId = useId()

    return (
        <div class="fields">
            <div class="field">
                <label for={notBeforeId}>Not before:</label>
                <input
                    {...inputArgs({value: dateInputValue(props.value.notBefore)})}
                    id={notBeforeId}
                    onInput={handleInput("notBefore")}
                />
            </div>
            <div class="field">
                <label for={notAfterId}>Not after:</label>
                <input
                    {...inputArgs({value: dateInputValue(props.value.notAfter)})}
                    id={notAfterId}
                    onInput={handleInput("notAfter")}
                />
            </div>
        </div>
    )
}
