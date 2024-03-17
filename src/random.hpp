#ifndef BB_RANDOM_HPP
#define BB_RANDOM_HPP

#include <stddef.h>

[[using clang: import_module("crypto"), import_name("fill_random")]]
void fill_random(void* data, size_t data_len);

inline int mt_rng(void*, unsigned char* data, size_t data_len)
{
    fill_random(data, data_len);
    return 0;
}

#endif // Header guard
