#ifndef BB_CSTR_HPP
#define BB_CSTR_HPP

#include <string.h>

namespace bb {

namespace detail {

const char nullchar = '\0';

}

struct cstr {
    char* str = (char*)detail::nullchar;
    size_t len = 0;

    cstr() = default;

    explicit cstr(size_t l)
        : str{new char[l + 1]{}}
        , len{l}
    {
    }

    cstr(cstr&& other)
        : str{other.str}
        , len{other.len}
    {
        other.release();
    }

    cstr(const cstr& other)
        : str{new char[other.len + 1]}
        , len{other.len}
    {
        memcpy(str, other.str, len);
        str[len] = '\0';
    }

    cstr& operator=(const cstr& other)
    {
        clear();
        if (!other.empty()) {
            str = new char[other.len + 1];
            len = other.len;

            memcpy(str, other.str, len);
            str[len] = '\0';
        }

        return *this;
    }

    cstr& operator=(cstr&& other) noexcept
    {
        clear();
        len = other.len;
        str = other.release();
        return *this;
    }

    ~cstr()
    {
        clear();
    }

    void clear() noexcept
    {
        if (len)
            delete[] release();

        str = (char*)detail::nullchar;
        len = 0;
    }

    char* release() noexcept
    {
        auto ret = str;
        str = (char*)detail::nullchar;
        len = 0;
        return ret;
    }

    [[nodiscard]]
    bool empty() const noexcept
    {
        return len == 0;
    }
};

} // namespace bb

#endif // Header guard
