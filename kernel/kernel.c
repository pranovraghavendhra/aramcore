#include "vga.h"
#include "process.h"

void kernel_main(void)
{
    vga_init();
    vga_print("aramcore v0.1\n");
    vga_print("initializing process manager...\n");

    proc_init();

    int p1 = proc_create("shell");
    int p2 = proc_create("logger");
    int p3 = proc_create("monitor");

    proc_run(p1);
    proc_run(p2);
    proc_run(p3);

    proc_terminate(p2);
    proc_terminate(p1);

    vga_print("process demo done\n");
    vga_print("check serial for events\n");

    while(1);
}