#ifndef BB_INTERFACE_KEY_HPP
#define BB_INTERFACE_KEY_HPP

#include <mbedtls/pk.h>

#include "opt.hpp"

namespace bb {

struct Key : mbedtls_pk_context {
    Key()
    {
        mbedtls_pk_init(static_cast<mbedtls_pk_context*>(this));
    }

    Key(Key&& other)
    {
        this->mbedtls_pk_context::operator=(other);
        mbedtls_pk_init(static_cast<mbedtls_pk_context*>(&other));
    }

    Key& operator=(Key&& other)
    {
        if (this == &other)
            return *this;

        mbedtls_pk_free(static_cast<mbedtls_pk_context*>(this));

        this->mbedtls_pk_context::operator=(other);
        mbedtls_pk_init(static_cast<mbedtls_pk_context*>(&other));

        return *this;
    }

    ~Key()
    {
        mbedtls_pk_free(this);
    }

    Key(const Key& other) = delete;
    Key& operator=(const Key& other) = delete;
};

void mbedtls_pk_init(Key*) = delete;
void mbedtls_pk_free(Key*) = delete;

enum class [[clang::enum_extensibility(closed)]] gen_key_type {
    ec_p_256,
    ec_p_384,
    rsa_2048,
    rsa_4096,
    max_enum_value = rsa_4096,
};

opt<Key> generate_key(gen_key_type nr);

} // namespace bb

#endif // Header guard
