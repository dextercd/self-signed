#ifndef BB_CERT_EXT_HPP
#define BB_CERT_EXT_HPP

#include <stddef.h>

#include <mbedtls/x509_crt.h>

namespace bb {

int set_akid(mbedtls_x509write_cert* ctx, const unsigned char* kid, size_t kid_len);

}

#endif // Header guard
