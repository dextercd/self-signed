declare module "file-saver" {
    export function saveAs(
        content: Blob | string,
        filename?: string,
        options?: { autoBom: boolean }
    )
}
