export enum SANType {
    dns = 0,
    ip = 1,
    email = 2,
}

export type SANList = [SANType, string][]
