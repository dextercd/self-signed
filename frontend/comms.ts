export class Comms {
    data: Uint8Array = new Uint8Array
    size: number = 0

    private addBytes(arr: Uint8Array) {
        let newSize = this.size + arr.byteLength

        if (this.data.byteLength < newSize)
            this.grow(newSize - this.data.byteLength)

        this.data.set(arr, this.size)
        this.size = newSize
    }

    private grow(by: number) {
        const add = Math.ceil(by / 1024) * 1024
        const buffer = new Uint8Array(this.data.byteLength + add)
        buffer.set(this.data)
        this.data = buffer
    }

    addBool(b: boolean) {
        this.addBytes(new Uint8Array([b && 1 || 0]))
    }

    addInt32(num: number) {
        const data = new ArrayBuffer(4)
        new DataView(data).setInt32(0, num, true)
        this.addBytes(new Uint8Array(data))
    }

    addUint32(num: number) {
        const data = new ArrayBuffer(4)
        new DataView(data).setUint32(0, num, true)
        this.addBytes(new Uint8Array(data))
    }

    addString(str: string) {
        const utf8 = new TextEncoder().encode(str)
        this.addUint32(utf8.byteLength)
        this.addBytes(utf8)
    }

    addByteArray(byteArray: ArrayBuffer) {
        this.addUint32(byteArray.byteLength)
        this.addBytes(new Uint8Array(byteArray))
    }

    complete(): Uint8Array {
        return new Uint8Array(this.data).subarray(0, this.size)
    }
}
