################################################################################
# Automatically-generated file. Do not edit!
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
C_SRCS += \
../src/adc_11u6x.c \
../src/chip_11u6x.c \
../src/clock_11u6x.c \
../src/crc_11u6x.c \
../src/dma_11u6x.c \
../src/eeprom.c \
../src/gpio_11u6x.c \
../src/gpiogroup_11u6x.c \
../src/i2c_11u6x.c \
../src/i2cm_11u6x.c \
../src/iap.c \
../src/iocon_11u6x.c \
../src/mtb.c \
../src/pinint_11u6x.c \
../src/pmu_11u6x.c \
../src/ring_buffer.c \
../src/romdiv_11u6x.c \
../src/rtc_11u6x.c \
../src/sct_11u6x.c \
../src/ssp_11u6x.c \
../src/stopwatch_11u6x.c \
../src/syscon_11u6x.c \
../src/sysinit_11u6x.c \
../src/timer_11u6x.c \
../src/uart_0_11u6x.c \
../src/uart_n_11u6x.c \
../src/wwdt_11u6x.c 

OBJS += \
./src/adc_11u6x.o \
./src/chip_11u6x.o \
./src/clock_11u6x.o \
./src/crc_11u6x.o \
./src/dma_11u6x.o \
./src/eeprom.o \
./src/gpio_11u6x.o \
./src/gpiogroup_11u6x.o \
./src/i2c_11u6x.o \
./src/i2cm_11u6x.o \
./src/iap.o \
./src/iocon_11u6x.o \
./src/mtb.o \
./src/pinint_11u6x.o \
./src/pmu_11u6x.o \
./src/ring_buffer.o \
./src/romdiv_11u6x.o \
./src/rtc_11u6x.o \
./src/sct_11u6x.o \
./src/ssp_11u6x.o \
./src/stopwatch_11u6x.o \
./src/syscon_11u6x.o \
./src/sysinit_11u6x.o \
./src/timer_11u6x.o \
./src/uart_0_11u6x.o \
./src/uart_n_11u6x.o \
./src/wwdt_11u6x.o 

C_DEPS += \
./src/adc_11u6x.d \
./src/chip_11u6x.d \
./src/clock_11u6x.d \
./src/crc_11u6x.d \
./src/dma_11u6x.d \
./src/eeprom.d \
./src/gpio_11u6x.d \
./src/gpiogroup_11u6x.d \
./src/i2c_11u6x.d \
./src/i2cm_11u6x.d \
./src/iap.d \
./src/iocon_11u6x.d \
./src/mtb.d \
./src/pinint_11u6x.d \
./src/pmu_11u6x.d \
./src/ring_buffer.d \
./src/romdiv_11u6x.d \
./src/rtc_11u6x.d \
./src/sct_11u6x.d \
./src/ssp_11u6x.d \
./src/stopwatch_11u6x.d \
./src/syscon_11u6x.d \
./src/sysinit_11u6x.d \
./src/timer_11u6x.d \
./src/uart_0_11u6x.d \
./src/uart_n_11u6x.d \
./src/wwdt_11u6x.d 


# Each subdirectory must supply rules for building sources it contributes
src/%.o: ../src/%.c
	@echo 'Building file: $<'
	@echo 'Invoking: MCU C Compiler'
	arm-none-eabi-gcc -D__REDLIB__ -DDEBUG -D__CODE_RED -D__USE_LPCOPEN -DCORE_M0PLUS -D__USE_ROMDIVIDE -I"/Users/chmod775/Documents/LPCXpresso_8.2.2/workspace/lpc_chip_11u6x/inc" -O0 -g3 -Wall -c -fmessage-length=0 -fno-builtin -ffunction-sections -fdata-sections -mcpu=cortex-m0 -mthumb -D__REDLIB__ -specs=redlib.specs -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@:%.o=%.o)" -MT"$(@:%.o=%.d)" -o "$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '


