#ifndef BB_WCOMMS_HPP
#define BB_WCOMMS_HPP

#include <stdint.h>
#include <stdio.h>

#include "cstr.hpp"
#include "opt.hpp"

namespace bb {

class wcomms {
    FILE* file = nullptr;

public:
    wcomms() = default;

    wcomms(wcomms&& other)
        : file{other.file}
    {
        other.file = nullptr;
    }

    ~wcomms()
    {
        if (file)
            fclose(file);
    }

    [[nodiscard]]
    static opt<wcomms> open(const char* path)
    {
        auto f = fopen(path, "wb");
        if (!f)
            return {};

        wcomms c;
        c.file = f;
        return c;
    }

    void write_bool(bool value)
    {
        unsigned char buf = value;
        fwrite(&buf, 1, 1, file);
    }

    void write_uint(uint32_t value)
    {
        unsigned char buf[4]{
            (unsigned char)(value),
            (unsigned char)(value >> 8),
            (unsigned char)(value >> 16),
            (unsigned char)(value >> 24),
        };
        fwrite(buf, 1, 4, file);
    }

    void write_string(const bb::cstr& str)
    {
        return write_bytelen(str.str, str.len);
    }

    void write_bytelen(void* data, uint32_t len)
    {
        write_uint(len);
        fwrite(data, 1, len, file);
    }
};

} // namespace bb

#endif
