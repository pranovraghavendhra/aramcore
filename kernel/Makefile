CC = gcc
CFLAGS = -m32 -ffreestanding -fno-pie -nostdlib -nostdinc

all: os.bin

boot.o: boot.asm
	nasm -f elf32 boot.asm -o boot.o

kernel.o: kernel.c
	$(CC) $(CFLAGS) -c kernel.c -o kernel.o

kernel.bin: boot.o kernel.o
	ld -m elf_i386 -T linker.ld -o kernel.bin boot.o kernel.o

os.bin: kernel.bin
	objcopy -O binary kernel.bin os.bin

run:
	qemu-system-x86_64 -drive format=raw,file=os.bin -nographic

clean:
	rm -f *.o *.bin