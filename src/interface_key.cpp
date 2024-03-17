#include <mbedtls/ecp.h>
#include <mbedtls/rsa.h>

#include "mbedtls/pk.h"
#include "opt.hpp"
#include "random.hpp"

#include "interface_key.hpp"

namespace {

bb::opt<bb::Key> generate_rsa(int bits)
{
    bb::Key key;

    if (mbedtls_pk_setup(&key, mbedtls_pk_info_from_type(MBEDTLS_PK_RSA)))
        return {};

    if (mbedtls_rsa_gen_key(mbedtls_pk_rsa(key), mt_rng, nullptr, bits, 0x10001))
        return {};

    return key;
}

bb::opt<bb::Key> generate_ec(mbedtls_ecp_group_id curve)
{
    bb::Key key;

    if (mbedtls_pk_setup(&key, mbedtls_pk_info_from_type(MBEDTLS_PK_ECKEY))) {
        return {};
    }

    if (mbedtls_ecp_gen_key(curve, mbedtls_pk_ec(key), mt_rng, nullptr)) {
        return {};
    }

    return key;
}

} // namespace

namespace bb {

bb::opt<bb::Key> generate_key(gen_key_type nr)
{
    switch (nr) {
    case gen_key_type::rsa_2048:
        return generate_rsa(2048);
    case gen_key_type::rsa_4096:
        return generate_rsa(4096);
    case gen_key_type::ec_p_256:
        return generate_ec(MBEDTLS_ECP_DP_SECP256R1);
    case gen_key_type::ec_p_384:
        return generate_ec(MBEDTLS_ECP_DP_SECP384R1);
    }
}

} // namespace bb
