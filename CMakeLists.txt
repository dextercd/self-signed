cmake_minimum_required(VERSION 3.28)

project(selfsigned)

option(BB_PUBLIC_BUILD "Optimise and obfuscate" FALSE)

# Setup

SET(CMAKE_C_VISIBILITY_PRESET hidden)
SET(CMAKE_CXX_VISIBILITY_PRESET hidden)
SET(CMAKE_VISIBILITY_INLINES_HIDDEN ON)

set(CMAKE_POLICY_DEFAULT_CMP0077 NEW)
set(CMAKE_POLICY_DEFAULT_CMP0126 NEW)

if (CMAKE_SYSTEM_PROCESSOR STREQUAL "wasm32")
    set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
endif()

if (CMAKE_C_COMPILER_ID MATCHES "Clang|GNU")
    add_compile_options(-Wno-unknown-attributes)
endif()

# We don't use the C++ standard library and our own code doesn't use exceptions.
# Exception support isn't great at the moment on WebAssembly I believe.
string(APPEND CMAKE_CXX_FLAGS " -fno-exceptions -fno-rtti")

# Dependencies

include(FetchContent)

FetchContent_Declare(
    Mbed_TLS
    GIT_REPOSITORY https://github.com/Mbed-TLS/mbedtls.git
    GIT_TAG v3.6.3
)

set(MBEDTLS_CONFIG_FILE ${CMAKE_CURRENT_SOURCE_DIR}/src/mbedtls_config.h)
set(ENABLE_TESTING OFF)
set(ENABLE_PROGRAMS OFF)
FetchContent_MakeAvailable(Mbed_TLS)

find_program(WASM_OPT NAME wasm-opt REQUIRED)

# Targets

add_subdirectory(src)
add_subdirectory(frontend)
