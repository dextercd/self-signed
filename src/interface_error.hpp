#ifndef BB_INTERFACE_ERROR_HPP
#define BB_INTERFACE_ERROR_HPP

namespace bb {

enum class [[clang::enum_extensibility(closed)]] interface_error
{
    success,

    read_input = 100,
    read_cert,
    read_key,

    write_cert = 200,
    write_cert_info,
    write_key,

    cert_set_serial = 300,
    cert_set_validity,
    cert_set_issuer,
    cert_set_subject,
    cert_set_key_usage,
    cert_set_ext_key_usage,
    cert_set_skid,
    cert_set_akid,
    cert_set_san,

    generate_cert = 400,
    generate_key,
    cert_info,
    key_mismatch,

};

}

#endif
