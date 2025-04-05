#include <mbedtls/ecp.h>
#include <mbedtls/error.h>
#include <mbedtls/pk.h>
#include <mbedtls/rsa.h>
#include <mbedtls/oid.h>
#include <mbedtls/x509.h>
#include <mbedtls/x509_crt.h>
#include <mbedtls/pem.h>
#include <mbedtls/base64.h>

#include <stdint.h>
#include <stdio.h>

#include "cert.hpp"
#include "rcomms.hpp"
#include "cstr.hpp"
#include "interface_error.hpp"
#include "interface_ext_key_usage.hpp"
#include "interface_key.hpp"
#include "interface_key_usage.hpp"
#include "interface_md.hpp"
#include "interface_san.hpp"
#include "mbedtls/asn1.h"
#include "random.hpp"
#include "wcomms.hpp"
#include "write_cert.hpp"
#include "cert_ext.hpp"

bb::opt<bb::Key> read_key();
bb::interface_error write_cert(mbedtls_x509_crt* cert);
bool write_key(mbedtls_pk_context* pk);

bb::opt<bb::gen_key_type> read_key_type(bb::rcomms& c)
{
    auto value = c.read_uint();
    if (!value || *value > (uint32_t)bb::gen_key_type::max_enum_value)
        return {};

    return (bb::gen_key_type)*value;
}

bb::opt<bb::md_type> read_md_type(bb::rcomms& c)
{
    auto value = c.read_uint();
    if (!value || *value > (uint32_t)bb::md_type::max_enum_value)
        return {};

    return (bb::md_type)*value;
}

[[clang::export_name("run")]]
bb::interface_error run()
{
    auto cc = bb::rcomms::open("input");
    if (!cc) {
        fprintf(stderr, "Couldn't open input file.\n");
        return bb::interface_error::read_input;
    }

    auto& c = *cc;

    bb::cstr issuer;
    bb::cstr subject;
    bool is_ca;
    bool self_signed;

    if (!bb::cread(c, &issuer)) {
        fprintf(stderr, "Couldn't read issuer string.\n");
        return bb::interface_error::read_input;
    }

    if (!bb::cread(c, &subject)) {
        fprintf(stderr, "Couldn't read subject string.\n");
        return bb::interface_error::read_input;
    }

    if (!bb::cread(c, &is_ca)) {
        fprintf(stderr, "Couldn't read is ca flag.\n");
        return bb::interface_error::read_input;
    }

    if (!bb::cread(c, &self_signed)) {
        fprintf(stderr, "Couldn't read is self-signed flag.\n");
        return bb::interface_error::read_input;
    }

    bb::cstr akid;
    if (!bb::cread(c, &akid)) {
        fprintf(stderr, "Couldn't read AKID.\n");
        return bb::interface_error::read_input;
    }

    auto opt_san_list = bb::read_san_list(c);
    if (!opt_san_list) {
        fprintf(stderr, "Couldn't read SAN list.\n");
        return bb::interface_error::read_input;
    }

    auto opt_key_type = read_key_type(c);
    if (!opt_key_type) {
        fprintf(stderr, "Couldn't read key type.\n");
        return bb::interface_error::read_input;
    }

    auto opt_md_type = read_md_type(c);
    if (!opt_md_type) {
        fprintf(stderr, "Couldn't read message digest type.\n");
        return bb::interface_error::read_input;
    }

    auto opt_not_before = c.read_string();
    if (!opt_not_before) {
        fprintf(stderr, "Couldn't read notBefore string.\n");
        return bb::interface_error::read_input;
    }

    auto opt_not_after = c.read_string();
    if (!opt_not_after) {
        fprintf(stderr, "Couldn't read notAfter string.\n");
        return bb::interface_error::read_input;
    }

    bb::key_usage key_usage;
    if (!bb::cread(c, &key_usage)) {
        fprintf(stderr, "Couldn't read key usage.\n");
        return bb::interface_error::read_input;
    }

    bb::ExtKeyUsageList ext_key_usage;
    if (!bb::cread(c, &ext_key_usage)) {
        fprintf(stderr, "Couldn't read extended key usage.\n");
        return bb::interface_error::read_input;
    }

    auto& san_list = *opt_san_list;
    auto key_type = *opt_key_type;
    auto md_type = *opt_md_type;
    auto& not_before = *opt_not_before;
    auto& not_after = *opt_not_after;

    bb::WriteCert cert;

    mbedtls_x509write_crt_set_version(&cert, MBEDTLS_X509_CRT_VERSION_3);

    unsigned char serial_number_bytes[16];
    fill_random(serial_number_bytes, sizeof(serial_number_bytes));
    // Skip leading 0 bytes, otherwise theres a 1/256 chance the cert is invalid
    // because of a malformed INTEGER. (Confirmed by asn1parse)
    auto sn_length = sizeof(serial_number_bytes);
    auto serial_number = serial_number_bytes;
    while (sn_length && serial_number[0] == '\0') { --sn_length; ++serial_number; }

    if (mbedtls_x509write_crt_set_serial_raw(&cert, serial_number, sn_length)) {
        fprintf(stderr, "Couldn't set serial number.\n");
        return bb::interface_error::cert_set_serial;
    }

    if (mbedtls_x509write_crt_set_validity(&cert, not_before.str, not_after.str)) {
        fprintf(stderr, "Couldn't set validity range.\n");
        return bb::interface_error::cert_set_validity;
    }

    if (!issuer.empty()) {
        if (mbedtls_x509write_crt_set_issuer_name(&cert, issuer.str)) {
            fprintf(stderr, "Couldn't set issuer name.\n");
            return bb::interface_error::cert_set_issuer;
        }
    }

    if (!subject.empty()) {
        if (mbedtls_x509write_crt_set_subject_name(&cert, subject.str)) {
            fprintf(stderr, "Couldn't set subject name.\n");
            return bb::interface_error::cert_set_subject;
        }
    }

    mbedtls_x509write_crt_set_basic_constraints(&cert, is_ca, -1);

    if (key_usage) {
        if (mbedtls_x509write_crt_set_key_usage(&cert, key_usage)) {
            fprintf(stderr, "Couldn't set key usage.\n");
            return bb::interface_error::cert_set_key_usage;
        }
    }

    if (ext_key_usage) {
        if (mbedtls_x509write_crt_set_ext_key_usage(&cert, ext_key_usage.ptr)) {
            fprintf(stderr, "Couldn't set extended key usage.\n");
            return bb::interface_error::cert_set_ext_key_usage;
        }
    }

    auto opt_subject_key = bb::generate_key(key_type);
    if (!opt_subject_key) {
        fprintf(stderr, "Couldn't generate key.\n");
        return bb::interface_error::generate_key;
    }

    auto subject_key = &opt_subject_key.data;

    mbedtls_pk_context* authority_key;
    bb::Key ak_owner;

    if (self_signed) {
        authority_key = subject_key;
    } else if (auto key = read_key()) {
        ak_owner = static_cast<bb::Key&&>(key.data);
        authority_key = &ak_owner;
    } else {
        fprintf(stderr, "Couldn't get authority key.\n");
        return bb::interface_error::read_key;
    }

    mbedtls_x509write_crt_set_issuer_key(&cert, authority_key);
    mbedtls_x509write_crt_set_subject_key(&cert, subject_key);

    if (akid.len) {
        if (bb::set_akid(&cert, (unsigned  char*)akid.str, akid.len)) {
            fprintf(stderr, "Couldn't set authority key identifier.\n");
            return bb::interface_error::cert_set_akid;
        }
    }

    if (mbedtls_x509write_crt_set_subject_key_identifier(&cert)) {
        fprintf(stderr, "Couldn't set subject key identifier.\n");
        return bb::interface_error::cert_set_skid;
    }

    mbedtls_x509write_crt_set_md_alg(&cert, bb::get_md(md_type));

    if (san_list) {
        if (mbedtls_x509write_crt_set_subject_alternative_name(&cert, san_list.ptr)) {
            fprintf(stderr, "Couldn't set SAN list.\n");
            return bb::interface_error::cert_set_san;
        }
    }

    bb::cstr der_buffer(8196);

new_buffer_retry:
    auto der_length = mbedtls_x509write_crt_der(
        &cert,
        (unsigned char*)der_buffer.str,
        der_buffer.len,
        mt_rng,
        nullptr
    );

    if (der_length < 0) {
        if (der_length == MBEDTLS_ERR_BASE64_BUFFER_TOO_SMALL
         || der_length == MBEDTLS_ERR_ASN1_BUF_TOO_SMALL)
        {
            der_buffer = bb::cstr(der_buffer.len * 2);
            goto new_buffer_retry;
        }

        fprintf(stderr, "Couldn't serialise certificate.\n");
        fprintf(stderr, "Err (%d): [%s] %s\n", der_length, mbedtls_low_level_strerr(der_length), mbedtls_high_level_strerr(der_length));
        return bb::interface_error::generate_cert;
    }

    auto der = (unsigned char*)der_buffer.str + der_buffer.len - der_length;

    bb::Cert out_cert;
    auto parse_err = mbedtls_x509_crt_parse_der(&out_cert, der, der_length);
    if (parse_err) {
        fprintf(stderr, "Err (%d): [%s] %s\n", parse_err, mbedtls_low_level_strerr(parse_err), mbedtls_high_level_strerr(parse_err));
        return bb::interface_error::read_cert;
    }

    if (!write_key(subject_key)) {
        fprintf(stderr, "Couldn't write key.\n");
        return bb::interface_error::write_key;
    }

    return write_cert(&out_cert);
}

bb::opt<bb::Cert> read_cert()
{
    auto cc = bb::rcomms::open("cert");
    if (!cc) {
        fprintf(stderr, "Couldn't open cert file.\n");
        return {};
    }
    auto& c = *cc;

    bb::cstr cert_data;
    if (!bb::cread(c, &cert_data)) {
        fprintf(stderr, "Couldn't read input buffer.\n");
        return {};
    }

    int certlen = cert_data.len;
    if (strstr(cert_data.str, "-----BEGIN ")) {
        ++certlen; // For PEM the keylen parameter must include the null byte
    }

    bb::Cert cert_chain;
    auto err = mbedtls_x509_crt_parse(&cert_chain, (unsigned char*)cert_data.str, certlen);
    if (err < 0) {
        fprintf(stderr, "Couldn't parse certificate.\n");
        fprintf(stderr, "Err (%d): [%s] %s\n", err, mbedtls_low_level_strerr(err), mbedtls_high_level_strerr(err));
        return {};
    }

    return cert_chain;
}

bb::opt<bb::Key> read_key()
{
    auto cc = bb::rcomms::open("key");
    if (!cc) {
        fprintf(stderr, "Couldn't open key file.\n");
        return {};
    }
    auto& c = *cc;

    bb::cstr key_data;
    if (!bb::cread(c, &key_data)) {
        fprintf(stderr, "Couldn't get key data.\n");
        return {};
    }

    int keylen = key_data.len;
    if (strstr(key_data.str, "-----BEGIN ")) {
        ++keylen; // For PEM the keylen parameter must include the null byte
    }

    bb::Key key;
    if (mbedtls_pk_parse_key(&key, (unsigned char*)key_data.str, keylen, nullptr, 0, mt_rng, nullptr)) {
        fprintf(stderr, "Couldn't parse key.\n");
        return {};
    }

    return key;
}

[[clang::export_name("cert_info")]]
bb::interface_error cert_info()
{
    auto opt_cert = read_cert();
    if (!opt_cert) {
        fprintf(stderr, "Couldn't get certificate.\n");
        return bb::interface_error::read_cert;
    }

    auto& cert_chain = *opt_cert;

    mbedtls_x509_crt* last_cert = &cert_chain;
    while (last_cert->next)
        last_cert = last_cert->next;

    return write_cert(last_cert);
}

[[clang::export_name("cert_key_info")]]
bb::interface_error cert_key_info()
{
    auto opt_cert = read_cert();
    if (!opt_cert) {
        fprintf(stderr, "Couldn't get certificate.\n");
        return bb::interface_error::read_cert;
    }

    auto opt_key = read_key();
    if (!opt_key) {
        fprintf(stderr, "Couldn't get key.\n");
        return bb::interface_error::read_key;
    }

    auto& cert_chain = *opt_cert;
    auto& key = *opt_key;

    mbedtls_x509_crt* cert = &cert_chain;
    while (cert && mbedtls_pk_check_pair(&cert->pk, &key, mt_rng, nullptr) != 0)
        cert = cert->next;

    if (!cert) {
        fprintf(stderr, "No cert in chain matches given key.\n");
        return bb::interface_error::key_mismatch;
    }

    if (!write_key(&key)) {
        fprintf(stderr, "Couldn't write key.\n");
        return bb::interface_error::write_key;
    }

    return write_cert(cert);
}

bb::interface_error write_cert(mbedtls_x509_crt* cert)
{
    auto pem_buffer = bb::cstr(28 * 2 + cert->raw.len * 2);
    auto pem_buffer_len = pem_buffer.len;

    auto pem_result = mbedtls_pem_write_buffer(
        "-----BEGIN CERTIFICATE-----\n",
        "-----END CERTIFICATE-----\n",
        cert->raw.p,
        cert->raw.len,
        (unsigned char*)pem_buffer.str,
        pem_buffer_len,
        &pem_buffer_len
    );

    if (pem_result != 0) {
        fprintf(stderr, "Couldn't turn cert DER into PEM.\n");
        return bb::interface_error::convert_pem;
    }

    auto len_without_null = pem_buffer_len - 1;

    char dnstr[1024];
    int dnlength = mbedtls_x509_dn_gets(dnstr, sizeof(dnstr), &cert->subject);
    if (dnlength < 0) {
        fprintf(stderr, "Couldn't get certificate subject.\n");
        return bb::interface_error::cert_info;
    }

    bool is_ca = cert->private_ext_types & MBEDTLS_X509_EXT_BASIC_CONSTRAINTS && cert->private_ca_istrue;

    auto out_ = bb::wcomms::open("cert");
    if (!out_) {
        fprintf(stderr, "Couldn't open cert file.\n");
        return bb::interface_error::open_file;
    }
    auto& out = *out_;

    out.write_bytelen(pem_buffer.str, len_without_null);
    out.write_bool(is_ca);
    out.write_bytelen(dnstr, dnlength);
    out.write_bytelen(cert->subject_key_id.p, cert->subject_key_id.len);

    return bb::interface_error::success;
}

bool write_key(mbedtls_pk_context* pk)
{
    auto max_der = 10240; // Kind or arbitrary

    auto pem_buffer = bb::cstr(32 * 2 + max_der * 2);
    auto pem_buffer_len = pem_buffer.len;

    auto pem_result = mbedtls_pk_write_key_pem(pk, (unsigned char*)pem_buffer.str, pem_buffer_len);
    if (pem_result != 0) {
        fprintf(stderr, "Couldn't turn key DER into PEM.\n");
        return false;
    }

    auto out = fopen("key", "wb");
    if (!out) {
        fprintf(stderr, "Couldn't open key file.\n");
        return false;
    }

    fputs(pem_buffer.str, out);
    fclose(out);

    return true;
}
