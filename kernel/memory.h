#ifndef MEMORY_H
#define MEMORY_H

void mem_init(void);
void mem_alloc(int pid, unsigned int size);
void mem_free(int pid);
unsigned int mem_used(void);

#endif