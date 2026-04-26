BITS 16
ORG 0x7C00

start:
    cli
    xor ax, ax
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov sp, 0x7C00

    mov si, msg
.print:
    lodsb
    or al, al
    jz halt
    mov ah, 0x0E
    int 0x10
    jmp .print

halt:
    hlt
    jmp halt

msg db "aramcore booting...", 0x0D, 0x0A, 0

TIMES 510 - ($ - $$) db 0
DW 0xAA55