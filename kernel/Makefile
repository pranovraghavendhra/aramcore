CC      = gcc
CFLAGS  = -m32 -ffreestanding -fno-pie -fno-stack-protector -nostdlib -nostdinc -O2
LD      = ld
LDFLAGS = -m elf_i386 -T linker.ld

all: kernel.bin

boot.o: boot.asm
	nasm -f elf32 boot.asm -o boot.o

kernel.o: kernel.c
	$(CC) $(CFLAGS) -c kernel.c -o kernel.o

vga.o: vga.c
	$(CC) $(CFLAGS) -c vga.c -o vga.o

kernel.bin: boot.o kernel.o vga.o
	$(LD) $(LDFLAGS) -o kernel.bin boot.o kernel.o vga.o

run:
	qemu-system-x86_64 -kernel kernel.bin -serial stdio -display none

clean:
	rm -f *.o *.bin