#include "process.h"
#include "vga.h"

/* serial port COM1 */
static void serial_char(char c)
{
    __asm__ volatile("outb %0, %1" : : "a"(c), "Nd"(0x3F8));
}

static void serial_print(const char *s)
{
    while(*s) serial_char(*s++);
}

/* simple int to string */
static void serial_int(int n)
{
    char buf[12];
    int i = 10;
    buf[11] = 0;
    if(n == 0) { serial_char('0'); return; }
    while(n > 0) { buf[i--] = '0' + (n % 10); n /= 10; }
    serial_print(&buf[i+1]);
}

static process_t proctable[MAX_PROCESSES];
static int next_pid = 1;

static const char *state_str(proc_state s)
{
    if(s == READY)      return "READY";
    if(s == RUNNING)    return "RUNNING";
    return "TERMINATED";
}

/* emit structured event to serial - python bridge reads this */
static void emit(const char *event, int pid, const char *name, proc_state state)
{
    serial_print("EVT:");
    serial_print(event);
    serial_print(":pid=");
    serial_int(pid);
    serial_print(":name=");
    serial_print(name);
    serial_print(":state=");
    serial_print(state_str(state));
    serial_print("\n");
}

void proc_init(void)
{
    int i;
    for(i = 0; i < MAX_PROCESSES; i++)
        proctable[i].active = 0;
    serial_print("EVT:KERNEL_INIT:pid=0:name=kernel:state=RUNNING\n");
}

int proc_create(const char *name)
{
    int i, j;
    for(i = 0; i < MAX_PROCESSES; i++)
    {
        if(!proctable[i].active)
        {
            proctable[i].pid    = next_pid++;
            proctable[i].state  = READY;
            proctable[i].active = 1;
            /* copy name */
            for(j = 0; j < 31 && name[j]; j++)
                proctable[i].name[j] = name[j];
            proctable[i].name[j] = 0;
            emit("PROC_CREATE", proctable[i].pid, proctable[i].name, READY);
            return proctable[i].pid;
        }
    }
    return -1;
}

void proc_run(int pid)
{
    int i;
    for(i = 0; i < MAX_PROCESSES; i++)
    {
        if(proctable[i].active && proctable[i].pid == pid)
        {
            proctable[i].state = RUNNING;
            emit("PROC_RUN", pid, proctable[i].name, RUNNING);
            return;
        }
    }
}

void proc_terminate(int pid)
{
    int i;
    for(i = 0; i < MAX_PROCESSES; i++)
    {
        if(proctable[i].active && proctable[i].pid == pid)
        {
            proctable[i].state  = TERMINATED;
            proctable[i].active = 0;
            emit("PROC_TERMINATE", pid, proctable[i].name, TERMINATED);
            return;
        }
    }
}