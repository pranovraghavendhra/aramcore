#include "vga.h"

/* write directly to serial port COM1 for debug */
static void serial_write(char c)
{
    __asm__ volatile ("outb %0, %1" : : "a"(c), "Nd"(0x3F8));
}

static void serial_print(const char *str)
{
    while(*str)
        serial_write(*str++);
}

void kernel_main(void)
{
    serial_print("aramcore booting...\n");
    vga_init();
    vga_print("aramcore v0.1\n");
    vga_print("kernel booted successfully\n");
    serial_print("vga done\n");
    while(1);
}