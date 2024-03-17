#ifndef BB_CERT_HPP
#define BB_CERT_HPP

#include <mbedtls/pk.h>
#include <mbedtls/x509_crt.h>

namespace bb {

struct Cert : mbedtls_x509_crt {
    Cert() noexcept
    {
        mbedtls_x509_crt_init(static_cast<mbedtls_x509_crt*>(this));
    }

    Cert(Cert&& other) noexcept
    {
        this->mbedtls_x509_crt::operator=(other);
        mbedtls_x509_crt_init(static_cast<mbedtls_x509_crt*>(&other));
    }

    Cert& operator=(Cert&& other) noexcept
    {
        if (this == &other)
            return *this;

        mbedtls_x509_crt_free(static_cast<mbedtls_x509_crt*>(this));

        this->mbedtls_x509_crt::operator=(other);
        mbedtls_x509_crt_init(static_cast<mbedtls_x509_crt*>(&other));

        return *this;
    }

    ~Cert()
    {
        mbedtls_x509_crt_free(static_cast<mbedtls_x509_crt*>(this));
    }

    Cert(const Cert& other) = delete;
    Cert& operator=(const Cert& other) = delete;
};

} // namespace bb

void mbedtls_x509_crt_init(bb::Cert*) = delete;
void mbedtls_x509_crt_free(bb::Cert*) = delete;

#endif // Header guard
