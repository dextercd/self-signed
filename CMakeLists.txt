cmake_minimum_required(VERSION 3.28)

option(BB_PUBLIC_BUILD "Optimise and obfuscate" FALSE)

project(selfsigned)

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
    GIT_TAG v3.5.2
)

set(MBEDTLS_CONFIG_FILE ${CMAKE_CURRENT_SOURCE_DIR}/mbedtls_config.h)
set(ENABLE_TESTING OFF)
set(ENABLE_PROGRAMS OFF)
FetchContent_MakeAvailable(Mbed_TLS)

# Libraries

add_executable(sign
    new.cpp
    interface.cpp
    interface_key.cpp
    interface_san.cpp
    interface_ext_key_usage.cpp
)

target_link_libraries(sign PRIVATE
    MbedTLS::mbedx509
)

if (CMAKE_SYSTEM_PROCESSOR STREQUAL wasm32)
    target_link_options(sign
        PUBLIC
            -mexec-model=reactor
    )
    if (BB_PUBLIC_BUILD)
        target_link_options(sign
            PUBLIC
                -Wl,-s
        )
    endif()
endif()

# Esbuild

set(FE_OUTPUT_DIR "${CMAKE_CURRENT_BINARY_DIR}/frontend")
set(FE_SCRATCH_DIR "${CMAKE_CURRENT_BINARY_DIR}/scratch")

if (BB_PUBLIC_BUILD)
    set(FE_OPTIMISE 1)
endif()

add_custom_target(esbuild ALL
    DEPENDS sign
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMAND ${CMAKE_COMMAND} -E env
        OUTPUT_DIR=${FE_OUTPUT_DIR}
        SCRATCH_DIR=${FE_SCRATCH_DIR}
        SIGN_PATH=$<TARGET_FILE:sign>
        OPTIMISE=${FE_OPTIMISE}
        -- node esbuild
)
