import { useState, useEffect } from "preact/hooks"

enum State {
    isServer,
    isClient,
    mountedAsClient,
}

let globalIsClient = false

export function useIsClient()
{
    const [state, setState] = useState(globalIsClient ? State.mountedAsClient : State.isServer)
    if (state !== State.mountedAsClient) {
        useEffect(() => {
            globalIsClient = true
            setState(State.isClient)
        }, [])
    }

    return state !== State.isServer
}
