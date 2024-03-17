#ifndef BB_UNIQPTR_HPP
#define BB_UNIQPTR_HPP

namespace bb {

template <typename T>
struct default_delete {
    constexpr void operator()(T* ptr) noexcept
    {
        delete ptr;
    }
};

template <typename T, class Deleter = default_delete<T>>
struct uniqptr {
    T* ptr = nullptr;
    [[no_unique_address]] [[msvc::no_unique_address]] Deleter deleter{};

    constexpr uniqptr() noexcept = default;
    constexpr uniqptr(decltype(nullptr)) noexcept { }

    constexpr explicit uniqptr(T* p) noexcept
        : ptr{p}
    {
    }

    constexpr explicit uniqptr(T* p, Deleter d) noexcept
        : ptr{p}
        , deleter{static_cast<Deleter&&>(d)}
    {
    }

    constexpr uniqptr(uniqptr&& other) noexcept
        : ptr{other.release()}
        , deleter{static_cast<Deleter&&>(other.deleter)}
    {
    }

    uniqptr(const uniqptr& other) = delete;

    constexpr uniqptr& operator=(uniqptr&& other) noexcept
    {
        reset(other.release());
        deleter = static_cast<Deleter&&>(other.deleter);
        return *this;
    }

    constexpr uniqptr& operator=(decltype(nullptr)) noexcept
    {
        reset();
        return *this;
    }

    uniqptr operator=(const uniqptr& other) = delete;

    ~uniqptr()
    {
        reset();
    }

    [[nodiscard]]
    constexpr T* release() noexcept
    {
        auto ret = ptr;
        ptr = nullptr;
        return ret;
    }

    constexpr void reset(T* other = nullptr) noexcept
    {
        if (ptr)
            deleter(ptr);
        ptr = other;
    }

    [[nodiscard]]
    constexpr operator bool() const noexcept
    {
        return ptr != nullptr;
    }

    [[nodiscard]]
    constexpr T& operator*() const noexcept
    {
        return *ptr;
    }

    [[nodiscard]]
    constexpr T* operator->() const noexcept
    {
        return ptr;
    }
};

template <typename T1, class D1, typename T2, class D2>
[[nodiscard]] constexpr bool
operator==(const uniqptr<T1, D1>& a, const uniqptr<T2, D2>& b) noexcept
{
    return a.ptr == b.ptr;
}

template <typename T1, class D1, typename T2, class D2>
[[nodiscard]] constexpr bool
operator!=(const uniqptr<T1, D1>& a, const uniqptr<T2, D2>& b) noexcept
{
    return !(a == b);
}

template <typename T1, class D1, typename T2, class D2>
[[nodiscard]] constexpr bool
operator==(const uniqptr<T1, D1>& a, decltype(nullptr)) noexcept
{
    return !a;
}

template <typename T1, class D1, typename T2, class D2>
[[nodiscard]] constexpr bool
operator!=(const uniqptr<T1, D1>& a, decltype(nullptr)) noexcept
{
    return (bool)a;
}

template <typename T1, class D1, typename T2, class D2>
[[nodiscard]] constexpr bool
operator==(decltype(nullptr), const uniqptr<T1, D1>& a) noexcept
{
    return !a;
}

template <typename T1, class D1, typename T2, class D2>
[[nodiscard]] constexpr bool
operator!=(decltype(nullptr), const uniqptr<T1, D1>& a) noexcept
{
    return (bool)a;
}

} // namespace bb

#endif // Header guard
