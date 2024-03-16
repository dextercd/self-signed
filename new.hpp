#ifndef BB_NEW_HPP
#define BB_NEW_HPP

#if __has_include(<new>)

#include <new>

#else

#include <stdlib.h>

// Placement new/delete
[[nodiscard]] inline void* operator new(size_t, void* p) noexcept { return p; }
[[nodiscard]] inline void* operator new[](size_t, void* p) noexcept { return p; }
inline void operator delete(void*, void*) noexcept {};
inline void operator delete[](void*, void*) noexcept {};

[[nodiscard]] void* operator new(size_t size);
void operator delete(void*) noexcept;
[[nodiscard]] void* operator new[](size_t size);
void operator delete[](void*) noexcept;

#endif

#endif // Header guard
