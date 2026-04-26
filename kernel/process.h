#ifndef PROCESS_H
#define PROCESS_H

#define MAX_PROCESSES 16

typedef enum {
    READY,
    RUNNING,
    TERMINATED
} proc_state;

typedef struct {
    int        pid;
    char       name[32];
    proc_state state;
    int        active;
} process_t;

void     proc_init(void);
int      proc_create(const char *name);
void     proc_run(int pid);
void     proc_terminate(int pid);
void     proc_list(void);

#endif