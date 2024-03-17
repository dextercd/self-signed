#if !__has_include(<new>)

#include <stdlib.h>

void* operator new(size_t size) { return malloc(size); }
void operator delete(void* ptr) noexcept { return free(ptr); }
void* operator new[](size_t size) { return malloc(size); }
void operator delete[](void* ptr) noexcept { return free(ptr); }

#endif
