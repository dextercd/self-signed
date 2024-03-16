import { useId } from "preact/hooks"
import { KeyUsage, keyUsageLabel, KEY_USAGE_VALUES } from "./key_usage"

interface KeyUsageInputParams {
    value: KeyUsage
    onChange: (newValue: KeyUsage) => void
}

export function KeyUsageInput({ value, onChange }: KeyUsageInputParams)
{
    const toggleValue = (toggle: KeyUsage) => () => {
        onChange(value ^ toggle)
    }

    const ids = KEY_USAGE_VALUES.map(_ => useId())

    return (
        <ul class="checkbox-list">
            {KEY_USAGE_VALUES.map((keyUsage, idx) =>
                <li>
                    <input
                        id={ids[idx]}
                        type="checkbox"
                        checked={(value & keyUsage) !== 0}
                        onClick={toggleValue(keyUsage)}
                    />
                    <label for={ids[idx]}>{keyUsageLabel(keyUsage)}</label>
                </li>)}
        </ul>
    )
}
