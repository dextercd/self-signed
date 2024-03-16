#include <mbedtls/asn1.h>
#include <mbedtls/oid.h>

#include "comms.hpp"
#include "interface_ext_key_usage.hpp"

namespace bb {

bool cread(comms& c, ExtKeyUsageList* out)
{
    ext_key_usage key_usage;
    if (!cread(c, &key_usage))
        return false;

    if (!key_usage) {
        out = nullptr;
        return true;
    }

    ExtKeyUsageList result;
    auto tail = &result.ptr;

#define HANDLE_CASE(num, oid)                       \
    if (key_usage & num) {                          \
        auto current = new mbedtls_asn1_sequence{}; \
        *tail = current;                            \
        tail = &current->next;                      \
        current->buf.tag = MBEDTLS_ASN1_OID;        \
        current->buf.len = sizeof(oid) - 1;         \
        current->buf.p = (unsigned char*)oid;       \
    }

    HANDLE_CASE(ext_key_usage::server_auth, MBEDTLS_OID_SERVER_AUTH);
    HANDLE_CASE(ext_key_usage::client_auth, MBEDTLS_OID_CLIENT_AUTH);
    HANDLE_CASE(ext_key_usage::code_signing, MBEDTLS_OID_CODE_SIGNING);
    HANDLE_CASE(ext_key_usage::email_protection, MBEDTLS_OID_EMAIL_PROTECTION);
    HANDLE_CASE(ext_key_usage::time_stamping, MBEDTLS_OID_TIME_STAMPING);
    HANDLE_CASE(ext_key_usage::ocsp_signing, MBEDTLS_OID_OCSP_SIGNING);
    HANDLE_CASE(ext_key_usage::any, MBEDTLS_OID_ANY_EXTENDED_KEY_USAGE);

    *out = static_cast<ExtKeyUsageList&&>(result);

    return true;
}

} // namespace bb
