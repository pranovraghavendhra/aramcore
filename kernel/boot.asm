BITS 32

MBOOT_MAGIC   equ 0x1BADB002
MBOOT_ALIGN   equ 1 << 0
MBOOT_MEMINFO equ 1 << 1
MBOOT_FLAGS   equ MBOOT_ALIGN | MBOOT_MEMINFO
MBOOT_CHECK   equ -(MBOOT_MAGIC + MBOOT_FLAGS)

section .multiboot
align 4
    dd MBOOT_MAGIC
    dd MBOOT_FLAGS
    dd MBOOT_CHECK

section .text
global _start
extern kernel_main

_start:
    mov esp, stack_top
    call kernel_main
    hlt

section .bss
align 16
stack_bottom:
    resb 16384
stack_top: