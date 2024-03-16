import { hydrate } from "preact"
import { App } from "./app"
import { CertMaker } from "./cert_maker"

function onLoad(f: () => void) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", f)
    } else {
        f()
    }
}

CertMaker.get()

onLoad(() => {
    hydrate(
        <App />,
        document.getElementById("app") as HTMLDivElement
    )
})

