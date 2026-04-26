#include "vga.h"
#include "process.h"
#include "memory.h"

void kernel_main(void)
{
    vga_init();
    vga_print("aramcore v0.1\n");
    vga_print("booting...\n");

    proc_init();
    mem_init();

    int p1 = proc_create("shell");
    int p2 = proc_create("logger");
    int p3 = proc_create("monitor");

    mem_alloc(p1, 4096);
    mem_alloc(p2, 2048);
    mem_alloc(p3, 8192);

    proc_run(p1);
    proc_run(p2);
    proc_run(p3);

    proc_terminate(p2);
    mem_free(p2);

    proc_terminate(p1);
    mem_free(p1);

    vga_print("kernel ready\n");

    while(1);
}