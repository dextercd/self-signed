add_executable(sign
    new.cpp
    interface.cpp
    interface_key.cpp
    interface_san.cpp
    interface_ext_key_usage.cpp
    copying.cpp
    cert_ext.cpp
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
