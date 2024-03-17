#ifndef BB_INTERFACE_KEY_USAGE_HPP
#define BB_INTERFACE_KEY_USAGE_HPP

#include <stdint.h>

#include <mbedtls/x509.h>

#include "comms.hpp"

namespace bb {

enum [[using clang: flag_enum, enum_extensibility(closed)]] key_usage {
    digital_signature = MBEDTLS_X509_KU_DIGITAL_SIGNATURE,
    non_repudiation = MBEDTLS_X509_KU_NON_REPUDIATION,
    key_encipherment = MBEDTLS_X509_KU_KEY_ENCIPHERMENT,
    data_encipherment = MBEDTLS_X509_KU_DATA_ENCIPHERMENT,
    key_agreement = MBEDTLS_X509_KU_KEY_AGREEMENT,
    key_cert_sign = MBEDTLS_X509_KU_KEY_CERT_SIGN,
    crl_sign = MBEDTLS_X509_KU_CRL_SIGN,
    encipher_only = MBEDTLS_X509_KU_ENCIPHER_ONLY,
    decipher_only = MBEDTLS_X509_KU_DECIPHER_ONLY,
};

inline bool cread(comms& c, key_usage* out)
{
    uint32_t raw;
    if (!cread(c, &raw))
        return false;

    auto valid_bits = key_usage::digital_signature
        | key_usage::non_repudiation
        | key_usage::key_encipherment
        | key_usage::data_encipherment
        | key_usage::key_agreement
        | key_usage::key_cert_sign
        | key_usage::crl_sign
        | key_usage::encipher_only
        | key_usage::decipher_only;

    if (raw & ~valid_bits)
        return false;

    *out = (key_usage)raw;
    return true;
}

} // namespace bb

#endif // Header guard
