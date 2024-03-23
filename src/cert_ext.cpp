#include <mbedtls/asn1.h>
#include <mbedtls/asn1write.h>
#include <mbedtls/error.h>
#include <mbedtls/oid.h>
#include <mbedtls/x509_crt.h>

#include "cert_ext.hpp"

namespace bb {

int set_akid(mbedtls_x509write_cert* ctx, const unsigned char* kid, size_t kid_len)
{
    int ret = MBEDTLS_ERR_ERROR_CORRUPTION_DETECTED;

    unsigned char buf[1000];
    auto c = buf + sizeof(buf);
    size_t len = 0;

    MBEDTLS_ASN1_CHK_ADD(len, mbedtls_asn1_write_raw_buffer(&c, buf, kid, kid_len));

    MBEDTLS_ASN1_CHK_ADD(len, mbedtls_asn1_write_len(&c, buf, len));
    MBEDTLS_ASN1_CHK_ADD(len, mbedtls_asn1_write_tag(&c, buf, MBEDTLS_ASN1_CONTEXT_SPECIFIC | 0));

    MBEDTLS_ASN1_CHK_ADD(len, mbedtls_asn1_write_len(&c, buf, len));
    MBEDTLS_ASN1_CHK_ADD(len, mbedtls_asn1_write_tag(&c, buf, MBEDTLS_ASN1_CONSTRUCTED | MBEDTLS_ASN1_SEQUENCE));

    return mbedtls_x509write_crt_set_extension(
        ctx,
        MBEDTLS_OID_AUTHORITY_KEY_IDENTIFIER,
        MBEDTLS_OID_SIZE(MBEDTLS_OID_AUTHORITY_KEY_IDENTIFIER),
        0, c, len);
}

} // namespace bb
