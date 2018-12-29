################################################################################
# Automatically-generated file. Do not edit!
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
S_SRCS += \
../src/aeabi_romdiv_patch.s 

CPP_SRCS += \
../src/cr_cpp_config.cpp \
../src/cr_startup_lpc11u6x.cpp \
../src/gpio.cpp \
../src/messydesk.cpp 

C_SRCS += \
../src/crp.c \
../src/gpio.c \
../src/mtb.c \
../src/sysinit.c 

OBJS += \
./src/aeabi_romdiv_patch.o \
./src/cr_cpp_config.o \
./src/cr_startup_lpc11u6x.o \
./src/crp.o \
./src/gpio.o \
./src/messydesk.o \
./src/mtb.o \
./src/sysinit.o 

CPP_DEPS += \
./src/cr_cpp_config.d \
./src/cr_startup_lpc11u6x.d \
./src/gpio.d \
./src/messydesk.d 

C_DEPS += \
./src/crp.d \
./src/gpio.d \
./src/mtb.d \
./src/sysinit.d 


# Each subdirectory must supply rules for building sources it contributes
src/%.o: ../src/%.s
	@echo 'Building file: $<'
	@echo 'Invoking: MCU Assembler'
	../../../tools/bin/arm-none-eabi-gcc -c -x assembler-with-cpp -DDEBUG -D__CODE_RED -DCORE_M0PLUS -D__USE_ROMDIVIDE -D__USE_LPCOPEN -D__LPC11U6X__ -I"../../lpc_board_nxp_lpcxpresso_11u68/inc" -I"../../lpc_chip_11u6x/inc" -g3 -mcpu=cortex-m0 -mthumb -o "$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '

src/%.o: ../src/%.cpp
	@echo 'Building file: $<'
	@echo 'Invoking: MCU C++ Compiler'
	../../../tools/bin/arm-none-eabi-c++ -DDEBUG -D__CODE_RED -DCORE_M0PLUS -D__MTB_DISABLE -D__MTB_BUFFER_SIZE=256 -D__USE_ROMDIVIDE -D__USE_LPCOPEN -DCPP_USE_HEAP -D__LPC11U6X__ -I"../../lpc_board_nxp_lpcxpresso_11u68/inc" -I"../../lpc_chip_11u6x/inc" -O0 -fno-common -g3 -Wall -c -fmessage-length=0 -fno-builtin -ffunction-sections -fdata-sections -fno-rtti -fno-exceptions -mcpu=cortex-m0 -mthumb -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@:%.o=%.o)" -MT"$(@:%.o=%.d)" -o "$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '

src/%.o: ../src/%.c
	@echo 'Building file: $<'
	@echo 'Invoking: MCU C Compiler'
	../../../tools/bin/arm-none-eabi-gcc -DDEBUG -D__CODE_RED -DCORE_M0PLUS -D__MTB_DISABLE -D__MTB_BUFFER_SIZE=256 -D__USE_ROMDIVIDE -D__USE_LPCOPEN -DCPP_USE_HEAP -D__LPC11U6X__ -I"../../lpc_board_nxp_lpcxpresso_11u68/inc" -I"../../lpc_chip_11u6x/inc" -O0 -fno-common -g3 -Wall -c -fmessage-length=0 -fno-builtin -ffunction-sections -fdata-sections -mcpu=cortex-m0 -mthumb -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@:%.o=%.o)" -MT"$(@:%.o=%.d)" -o "$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '


