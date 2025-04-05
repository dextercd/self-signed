add_executable(sign
    new.cpp
    interface.cpp
    interface_key.cpp
    interface_san.cpp
    interface_ext_key_usage.cpp
    copying.cpp
    cert_ext.cpp
)

target_compile_options(sign PRIVATE -fno-exceptions -fno-rtti -nostdinc++)

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

# Optimise binary with wasm-opt
add_custom_command(
    TARGET sign POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:sign> $<TARGET_FILE:sign>.unopt

    # `cmake -E true` if debug build otherwise invoke wasm-opt
    COMMAND "$<IF:$<CONFIG:Debug>,${CMAKE_COMMAND},${WASM_OPT}>"
        $<$<CONFIG:Debug>:-E>
        $<$<CONFIG:Debug>:true>
        -o $<TARGET_FILE:sign>
        -Os
        --strip-debug
        --strip-producers
        --strip-target-features
        $<TARGET_FILE:sign>.unopt
)
