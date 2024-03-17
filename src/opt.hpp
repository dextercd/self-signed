#ifndef BB_OPT_HPP
#define BB_OPT_HPP

#include "new.hpp" // IWYU pragma: keep

namespace bb {

template<typename T>
struct opt {
    union {
        T data;
    };
    bool has_value = false;

    opt() {}

    opt(T value)
    {
        new (&data) T{static_cast<T&&>(value)};
        has_value = true;
    }

    opt(opt&& other)
    {
        if (!other.has_value)
            return;

        new (&data) T{static_cast<T&&>(other.data)};
        other.reset();
    }

    opt(const opt& other)
    {
        if (!other.has_value)
            return;

        new (&data) T{other.data};
        other.reset();
    }

    void reset()
    {
        if (has_value) {
            (&data)->~T();
            has_value = false;
        }
    }

    ~opt()
    {
        reset();
    }

    explicit operator bool()
    {
        return has_value;
    }

    T& operator*()
    {
        return data;
    }
};

} // bb::

#endif // Header guard
