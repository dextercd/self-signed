import { useId } from "preact/hooks"
import { ExtKeyUsage, extKeyUsageLabel, EXT_KEY_USAGE_VALUES } from "./ext_key_usage"

interface ExtKeyUsageInputParams {
    value: ExtKeyUsage
    onChange: (newValue: ExtKeyUsage) => void
}

export function ExtKeyUsageInput({ value, onChange }: ExtKeyUsageInputParams)
{
    const toggleValue = (toggle: ExtKeyUsage) => () => {
        onChange(value ^ toggle)
    }

    const ids = EXT_KEY_USAGE_VALUES.map(_ => useId())

    return (
        <ul class="checkbox-list">
            {EXT_KEY_USAGE_VALUES.map((keyUsage, idx) =>
                <li>
                    <input
                        id={ids[idx]}
                        type="checkbox"
                        checked={(value & keyUsage) !== 0}
                        onClick={toggleValue(keyUsage)}
                    />
                    <label for={ids[idx]}>{extKeyUsageLabel(keyUsage)}</label>
                </li>)}
        </ul>
    )
}
