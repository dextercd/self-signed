#ifndef BB_INTERFACE_EXT_KEY_USAGE_HPP
#define BB_INTERFACE_EXT_KEY_USAGE_HPP

#include "comms.hpp"
#include "uniqptr.hpp"

#include <mbedtls/asn1.h>

namespace bb {

enum [[using clang: flag_enum, enum_extensibility(closed)]] ext_key_usage {
    server_auth = 1 << 0,
    client_auth = 1 << 1,
    code_signing = 1 << 2,
    email_protection = 1 << 3,
    time_stamping = 1 << 4,
    ocsp_signing = 1 << 5,
    any = 1 << 6,
};

inline bool cread(comms& c, ext_key_usage* out)
{
    uint32_t raw;
    if (!cread(c, &raw))
        return false;

    auto valid_bits = ext_key_usage::server_auth
        | ext_key_usage::client_auth
        | ext_key_usage::code_signing
        | ext_key_usage::email_protection
        | ext_key_usage::time_stamping
        | ext_key_usage::time_stamping
        | ext_key_usage::ocsp_signing
        | ext_key_usage::any;

    if (raw & ~valid_bits)
        return false;

    *out = (ext_key_usage)raw;
    return true;
}

struct ExtKeyUsageListDeleter {
    void operator()(mbedtls_asn1_sequence* exts)
    {
        auto next = exts->next;

        delete exts;

        if (next)
            (*this)(next);
    }
};

using ExtKeyUsageList = uniqptr<mbedtls_asn1_sequence, ExtKeyUsageListDeleter>;

bool cread(comms& c, ExtKeyUsageList* out);

} // namespace bb

#endif // Header guard
