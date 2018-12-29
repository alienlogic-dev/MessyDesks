################################################################################
# Automatically-generated file. Do not edit!
################################################################################

-include ../makefile.init

RM := rm -rf

# All of the sources participating in the build are defined here
-include sources.mk
-include src/subdir.mk
-include subdir.mk
-include objects.mk

ifneq ($(MAKECMDGOALS),clean)
ifneq ($(strip $(CC_DEPS)),)
-include $(CC_DEPS)
endif
ifneq ($(strip $(C++_DEPS)),)
-include $(C++_DEPS)
endif
ifneq ($(strip $(C_UPPER_DEPS)),)
-include $(C_UPPER_DEPS)
endif
ifneq ($(strip $(CXX_DEPS)),)
-include $(CXX_DEPS)
endif
ifneq ($(strip $(CPP_DEPS)),)
-include $(CPP_DEPS)
endif
ifneq ($(strip $(C_DEPS)),)
-include $(C_DEPS)
endif
endif

-include ../makefile.defs

# Add inputs and outputs from these tool invocations to the build variables 

# All Target
all: messydesk.axf

# Tool invocations
messydesk.axf: $(OBJS) $(USER_OBJS)
	@echo 'Building target: $@'
	@echo 'Invoking: MCU C++ Linker'
	../../../tools/bin/arm-none-eabi-c++ -nostdlib -L"/Users/chmod775/Documents/LPCXpresso_8.2.2/workspace/lpc_board_nxp_lpcxpresso_11u68/Debug" -L"/Users/chmod775/Documents/LPCXpresso_8.2.2/workspace/lpc_chip_11u6x/Debug" -Xlinker -Map="messydesk.map" -Xlinker --gc-sections -Xlinker -print-memory-usage -mcpu=cortex-m0 -mthumb -T "messydesk_Debug.ld" -o "messydesk.axf" $(OBJS) $(USER_OBJS) $(LIBS)
	@echo 'Finished building target: $@'
	@echo ' '
	$(MAKE) --no-print-directory post-build

# Other Targets
clean:
	-$(RM) $(CC_DEPS)$(C++_DEPS)$(EXECUTABLES)$(C_UPPER_DEPS)$(CXX_DEPS)$(OBJS)$(CPP_DEPS)$(C_DEPS) messydesk.axf
	-@echo ' '

post-build:
	-@echo 'Performing post-build steps'
	-../../../tools/bin/arm-none-eabi-size "messydesk.axf" ; ../../../tools/bin/arm-none-eabi-objcopy -v -O binary "messydesk.axf" "messydesk.bin" ; # checksum -p LPC11U68 -d "messydesk.bin"
	-@echo ' '

flash:
	cp messydesk.bin /Volumes/CRP\ DISABLD/firmware.bin
	sync
	
.PHONY: all clean dependents
.SECONDARY: post-build

-include ../makefile.targets
