#ifndef SELFSIGNED_MBEDTLS_CONFIG_H

// Defaults
#include <mbedtls/mbedtls_config.h>

#define MBEDTLS_NO_PLATFORM_ENTROPY

#undef MBEDTLS_HAVE_TIME_DATE
#undef MBEDTLS_HAVE_TIME
#undef MBEDTLS_TIMING_C
#undef MBEDTLS_NET_C
#undef MBEDTLS_AESNI_C

#endif // Header guard
