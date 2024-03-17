set(FE_OUTPUT_DIR "${CMAKE_CURRENT_BINARY_DIR}/dist")
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
