#ifndef BB_WRITE_CERT_HPP
#define BB_WRITE_CERT_HPP

#include <mbedtls/pk.h>
#include <mbedtls/x509_crt.h>

namespace bb {

struct WriteCert : mbedtls_x509write_cert {
    WriteCert() noexcept
    {
        mbedtls_x509write_crt_init(static_cast<mbedtls_x509write_cert*>(this));
    }

    WriteCert(WriteCert&& other) noexcept
    {
        this->mbedtls_x509write_cert::operator=(other);
        mbedtls_x509write_crt_init(static_cast<mbedtls_x509write_cert*>(&other));
    }

    WriteCert& operator=(WriteCert&& other) noexcept
    {
        if (this == &other)
            return *this;

        mbedtls_x509write_crt_free(static_cast<mbedtls_x509write_cert*>(this));

        this->mbedtls_x509write_cert::operator=(other);
        mbedtls_x509write_crt_init(static_cast<mbedtls_x509write_cert*>(&other));

        return *this;
    }

    ~WriteCert()
    {
        mbedtls_x509write_crt_free(static_cast<mbedtls_x509write_cert*>(this));
    }

    WriteCert(const WriteCert& other) = delete;
    WriteCert& operator=(const WriteCert& other) = delete;
};

} // namespace bb

void mbedtls_x509write_crt_init(bb::WriteCert*) = delete;
void mbedtls_x509write_crt_free(bb::WriteCert*) = delete;

#endif // Header guard
