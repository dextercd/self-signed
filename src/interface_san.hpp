#ifndef BB_INTERFACE_SAN_HPP
#define BB_INTERFACE_SAN_HPP

#include <mbedtls/x509_crt.h>

#include "rcomms.hpp"
#include "opt.hpp"
#include "uniqptr.hpp"

namespace bb {

enum class [[clang::enum_extensibility(closed)]] san_type {
    dns,
    ip,
    email,
    max_enum_value = email,
};

struct OwningSanListDeleter {
    void operator()(mbedtls_x509_san_list* san_list)
    {
        auto next = san_list->next;

        delete san_list->node.san.unstructured_name.p;
        delete san_list;

        if (next)
            (*this)(next);
    }
};

using OwningSanList = uniqptr<mbedtls_x509_san_list, OwningSanListDeleter>;

opt<OwningSanList> read_san_list(rcomms& c);

} // namespace bb

#endif // Header guard
