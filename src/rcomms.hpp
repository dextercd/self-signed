#ifndef BB_RCOMMS_HPP
#define BB_RCOMMS_HPP

#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include "cstr.hpp"
#include "opt.hpp"

namespace bb {

class rcomms {
    FILE* file = nullptr;

public:
    rcomms() = default;

    rcomms(rcomms&& other)
        : file{other.file}
    {
        other.file = nullptr;
    }

    ~rcomms()
    {
        if (file)
            fclose(file);
    }

    [[nodiscard]]
    static opt<rcomms> open(const char* path)
    {
        auto f = fopen(path, "rb");
        if (!f)
            return {};

        rcomms c;
        c.file = f;
        return c;
    }

    opt<bool> read_bool()
    {
        unsigned char buf;
        if (fread(&buf, 1, 1, file) != 1 || buf > 1)
            return {};

        return {(bool)buf};
    }

    opt<uint32_t> read_uint()
    {
        unsigned char buf[4];
        if (fread(buf, 1, 4, file) != 4)
            return {};

        return (uint32_t)buf[0]
            | (uint32_t)buf[1] << 8
            | (uint32_t)buf[2] << 16
            | (uint32_t)buf[3] << 24;
    }

    opt<cstr> read_string()
    {
        auto length = read_uint();
        if (!length.has_value)
            return {};

        cstr str{(size_t)length.data};
        if (fread(str.str, 1, str.len, file) != str.len)
            return {};

        return str;
    }
};

inline bool cread(rcomms& c, bool* out)
{
    if (auto opt = c.read_bool()) {
        *out = *opt;
        return true;
    }
    return false;
}

inline bool cread(rcomms& c, uint32_t* out)
{
    if (auto opt = c.read_uint()) {
        *out = *opt;
        return true;
    }
    return false;
}

inline bool cread(rcomms& c, int32_t* out)
{
    if (auto opt = c.read_uint()) {
        *out = *opt;
        return true;
    }
    return false;
}

inline bool cread(rcomms& c, cstr* out)
{
    if (auto opt = c.read_string()) {
        *out = *opt;
        return true;
    }
    return false;
}

template<class T>
bool cread(rcomms& c, opt<T>* out)
{
    bool has_value{};
    if (!cread(c, &has_value))
        return false;

    if (has_value)
        *out = {};

    T value{};
    if (!cread(c, &value))
        return false;

    out = static_cast<T&&>(value);
    return true;
}

} // namespace bb

#endif
