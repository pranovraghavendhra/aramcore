#include "memory.h"

#define MAX_ALLOCS 16

static void serial_char(char c)
{
    __asm__ volatile("outb %0, %1" : : "a"(c), "Nd"(0x3F8));
}

static void serial_print(const char *s)
{
    while(*s) serial_char(*s++);
}

static void serial_int(unsigned int n)
{
    char buf[12];
    int i = 10;
    buf[11] = 0;
    if(n == 0) { serial_char('0'); return; }
    while(n > 0) { buf[i--] = '0' + (n % 10); n /= 10; }
    serial_print(&buf[i+1]);
}

typedef struct {
    int          pid;
    unsigned int size;
    int          active;
} alloc_t;

static alloc_t allocs[MAX_ALLOCS];
static unsigned int total_used = 0;

void mem_init(void)
{
    int i;
    for(i = 0; i < MAX_ALLOCS; i++)
        allocs[i].active = 0;
    total_used = 0;
    serial_print("EVT:MEM_INIT:pid=0:size=0:used=0\n");
}

void mem_alloc(int pid, unsigned int size)
{
    int i;
    for(i = 0; i < MAX_ALLOCS; i++)
    {
        if(!allocs[i].active)
        {
            allocs[i].pid    = pid;
            allocs[i].size   = size;
            allocs[i].active = 1;
            total_used      += size;
            serial_print("EVT:MEM_ALLOC:pid=");
            serial_int(pid);
            serial_print(":size=");
            serial_int(size);
            serial_print(":used=");
            serial_int(total_used);
            serial_print("\n");
            return;
        }
    }
}

void mem_free(int pid)
{
    int i;
    for(i = 0; i < MAX_ALLOCS; i++)
    {
        if(allocs[i].active && allocs[i].pid == pid)
        {
            total_used        -= allocs[i].size;
            allocs[i].active   = 0;
            serial_print("EVT:MEM_FREE:pid=");
            serial_int(pid);
            serial_print(":size=0:used=");
            serial_int(total_used);
            serial_print("\n");
            return;
        }
    }
}

unsigned int mem_used(void)
{
    return total_used;
}