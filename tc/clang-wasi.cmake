set(CMAKE_SYSTEM_NAME wasi)
set(CMAKE_SYSTEM_PROCESSOR wasm32)

set(TC_TRIPLE wasm32-unknown-wasi)
set(CMAKE_C_COMPILER_TARGET ${TC_TRIPLE})
set(CMAKE_CXX_COMPILER_TARGET ${TC_TRIPLE})

set(CMAKE_SYSROOT /usr/share/wasi-sysroot)

set(CMAKE_C_COMPILER clang)
set(CMAKE_CXX_COMPILER clang++ -nostdlib++)

