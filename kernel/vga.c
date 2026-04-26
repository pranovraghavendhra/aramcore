#include "vga.h"

#define VGA_BASE  0xB8000
#define VGA_COLS  80
#define VGA_ROWS  25
#define COLOR     0x0A

static unsigned short *vga = (unsigned short *)VGA_BASE;
static int row = 0;
static int col = 0;

static void scroll(void)
{
    int i;
    for(i = 0; i < (VGA_ROWS-1) * VGA_COLS; i++)
        vga[i] = vga[i + VGA_COLS];
    for(i = (VGA_ROWS-1) * VGA_COLS; i < VGA_ROWS * VGA_COLS; i++)
        vga[i] = (COLOR << 8) | ' ';
    row = VGA_ROWS - 1;
}

void vga_init(void)
{
    int i;
    for(i = 0; i < VGA_ROWS * VGA_COLS; i++)
        vga[i] = (COLOR << 8) | ' ';
    row = 0;
    col = 0;
}

void vga_print(const char *str)
{
    while(*str)
    {
        if(*str == '\n')
        {
            col = 0;
            row++;
        }
        else
        {
            vga[row * VGA_COLS + col] = (COLOR << 8) | *str;
            col++;
            if(col >= VGA_COLS) { col = 0; row++; }
        }
        if(row >= VGA_ROWS) scroll();
        str++;
    }
}