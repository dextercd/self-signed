export class RComms {
    data: DataView
    offset: number = 0

    constructor(buffer: ArrayBuffer | Uint8Array)
    {
        if (!(buffer instanceof ArrayBuffer))
            buffer = buffer.buffer

        this.data = new DataView(buffer)
    }

    read_bool(): boolean
    {
        return this.data.getInt8(this.offset++) !== 0
    }

    read_uint(): number
    {
        const value = this.data.getUint32(this.offset, true)
        this.offset += 4
        return value
    }

    read_string(): string
    {
        const length = this.read_uint()
        const utf8 = new Uint8Array(this.data.buffer, this.offset, length)
        this.offset += length
        return new TextDecoder().decode(utf8)
    }

    read_bytes(): ArrayBuffer
    {
        const length = this.read_uint()
        const data = new Uint8Array(this.data.buffer, this.offset, length)
        this.offset += length
        return data
    }
}
