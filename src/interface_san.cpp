#include <mbedtls/x509_crt.h>

#include "comms.hpp"
#include "mbedtls/x509.h"
#include "opt.hpp"
#include "uniqptr.hpp"

#include "interface_san.hpp"

namespace {

bb::opt<bb::san_type> read_san_type(bb::comms& c)
{
    auto value = c.read_uint();
    if (!value || *value > (uint32_t)bb::san_type::max_enum_value)
        return {};

    return (bb::san_type)*value;
}

int get_san_type(bb::san_type san_type)
{
    switch (san_type) {
    case bb::san_type::dns:
        return MBEDTLS_X509_SAN_DNS_NAME;
    case bb::san_type::ip:
        return MBEDTLS_X509_SAN_IP_ADDRESS;
    case bb::san_type::email:
        return MBEDTLS_X509_SAN_RFC822_NAME;
    }
}

}

namespace bb {

opt<OwningSanList> read_san_list(bb::comms& c)
{
    OwningSanList start;
    mbedtls_x509_san_list** tail = &start.ptr;

    auto opt_count = c.read_uint();
    if (!opt_count)
        return {};

    for (auto count = *opt_count; count != 0; count--) {
        auto current = new mbedtls_x509_san_list{};
        *tail = current;
        tail = &current->next;

        auto opt_type = read_san_type(c);
        auto opt_value = c.read_string();
        if (!opt_type || !opt_value)
            return {};

        auto type = *opt_type;
        auto& value = *opt_value;

        current->node.type = get_san_type(type);

        if (type == bb::san_type::ip) {
            auto parsed_ip = new unsigned char[16];
            auto ip_length = mbedtls_x509_crt_parse_cn_inet_pton(value.str, parsed_ip);
            if (ip_length == 0) {
                delete[] parsed_ip;
                return {};
            }
            current->node.san.unstructured_name.len = ip_length;
            current->node.san.unstructured_name.p = parsed_ip;
        } else {
            current->node.san.unstructured_name.len = value.len;
            current->node.san.unstructured_name.p = (unsigned char*)value.release();
        }
    }

    return start;
}

} // namespace bb
