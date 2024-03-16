#ifndef BB_INTERFACE_MD_HPP
#define BB_INTERFACE_MD_HPP

#include <mbedtls/md.h>

namespace bb {

enum class [[clang::enum_extensibility(closed)]] md_type {
    sha2_224,
    sha2_256,
    sha2_384,
    sha2_512,
    max_enum_value = sha2_512,
};

inline mbedtls_md_type_t get_md(md_type type)
{
    switch (type) {
    case md_type::sha2_224:
        return mbedtls_md_type_t::MBEDTLS_MD_SHA224;
    case md_type::sha2_256:
        return mbedtls_md_type_t::MBEDTLS_MD_SHA256;
    case md_type::sha2_384:
        return mbedtls_md_type_t::MBEDTLS_MD_SHA384;
    case md_type::sha2_512:
        return mbedtls_md_type_t::MBEDTLS_MD_SHA512;
    }
}

} // namespace bb

#endif // Header guard
