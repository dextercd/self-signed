// https://en.wikipedia.org/wiki/Computation_of_cyclic_redundancy_checks#Multi-bit_computation
const crc32table = new Int32Array(256)
{
    let crc = 1
    for (let i = 128; i > 0; i >>= 1) {
        if (crc & 1) {
            crc = (crc >>> 1) ^ 0xedb88320
        } else {
            crc = crc >>> 1
        }
        for (let j = 0; j <= 255; j += i * 2) {
            crc32table[i + j] = crc ^ crc32table[j]
        }
    }
}

function crc32(data: ArrayBuffer): number
{
    let view = new Uint8Array(data)
    let crc = -1
    for (let i = 0; i != view.length; ++i) {
        let lookup = (crc ^ view[i]) & 0xff
        crc = (crc >>> 8) ^ crc32table[lookup]
    }
    return (crc ^ -1) >>> 0
}

function getDosDate(d: Date)
{
    return d.getDate() | d.getMonth() + 1 << 5 | (d.getFullYear() - 1980 & 0x7f) << 9
}

function getDosTime(d: Date)
{
    return d.getSeconds() >> 1 | d.getMinutes() << 5 | d.getHours() << 11
}

const SIGNATURE_LENGTH = 4
const localFileSignature = new Uint8Array([0x50, 0x4b, 0x03, 0x04])
const centralFileSignature = new Uint8Array([0x50, 0x4b, 0x01, 0x02])

const VERSION_LENGTH = 2
const versionMade = new Uint8Array([30, 3])

export class ZipWriter {
    private files: [string, ArrayBuffer, number][] = []

    addFile(fileName: string, fileContent: ArrayBuffer, mode: number = 0o100644 << 16)
    {
        this.files.push([fileName, fileContent, mode])
    }

    complete(): Blob
    {
        let fileEntriesByteLength = 0
        const fileEntries: (ArrayBuffer | DataView | Blob)[] = []

        let centralDirectoriesByteLength = 0
        const centralDirectories: (ArrayBuffer | DataView | Blob)[] = []

        const now = new Date()
        const date = getDosDate(now)
        const time = getDosTime(now)

        for (const [textFileName, fileContent, mode] of this.files) {
            const fileOffset = fileEntriesByteLength

            const fileName = new TextEncoder().encode(textFileName)
            const commonHeader = new DataView(new ArrayBuffer(26))
            commonHeader.setInt16(0, 10, true) // Version needed to extract
            //commonHeader.setInt16(2, 0) // General purpose flags
            //commonHeader.setInt16(4, 0) // Compression
            commonHeader.setUint16(6, time, true)
            commonHeader.setUint16(8, date, true)
            commonHeader.setUint32(10, crc32(fileContent), true)
            commonHeader.setUint32(14, fileContent.byteLength, true) // Compressed size
            commonHeader.setUint32(18, fileContent.byteLength, true) // Uncompressed size
            commonHeader.setInt16(22, fileName.byteLength, true)
            // commonHeader.setInt16(24, 0) // Extra field length

            fileEntries.push(localFileSignature, commonHeader, fileName, fileContent)
            fileEntriesByteLength +=
                SIGNATURE_LENGTH +
                commonHeader.byteLength +
                fileName.byteLength +
                fileContent.byteLength

            const centralExtra = new DataView(new ArrayBuffer(14))
            //centralExtra.setInt16(0, 0) // File comment length
            //centralExtra.setInt16(2, 0) // Disk number
            //centralExtra.setInt16(4, 0) // Internal file attributes
            centralExtra.setInt32(6, mode, true) // External file attributes
            centralExtra.setUint32(10, fileOffset, true) // Offset to local file header

            centralDirectories.push(centralFileSignature, versionMade, commonHeader, centralExtra, fileName)
            centralDirectoriesByteLength +=
                SIGNATURE_LENGTH +
                VERSION_LENGTH +
                commonHeader.byteLength +
                centralExtra.byteLength +
                fileName.byteLength
        }

        const endRecord = new DataView(new ArrayBuffer(22))
        endRecord.setUint32(0, 0x06054b50, true)
        //endRecord.setUint16(4, 0) // Disk number
        //endRecord.setUint16(6, 0) // Central directory disk start
        endRecord.setUint16(8, centralDirectories.length / 5, true) // On disk
        endRecord.setUint16(10, centralDirectories.length / 5, true) // Total
        endRecord.setUint32(12, centralDirectoriesByteLength, true)
        endRecord.setUint32(16, fileEntriesByteLength, true)
        // endRecord.setUint16(20, 0) // Comment length

        return new Blob(
            [...fileEntries, ...centralDirectories, endRecord],
            {type: "application/zip"}
        )
    }
}
