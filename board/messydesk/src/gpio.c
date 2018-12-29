/*
 * gpio.c
 *
 *  Created on: Dec 28, 2018
 *      Author: chmod775
 */
#include "inc/gpio.h"

#define MAXGPIO 16
static const uint8_t gpioports[MAXGPIO] = {1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
static const uint8_t gpiopins[MAXGPIO] = {24, 7, 2, 6, 8, 9, 18, 19, 20, 23, 16, 22, 11, 12, 13, 14};

void setGPIO(uint8_t idx, bool asOutput) {
	if (idx < MAXGPIO)
		if (asOutput)
			Chip_GPIO_SetPinDIROutput(LPC_GPIO, gpioports[idx], gpiopins[idx]);
		else
			Chip_GPIO_SetPinDIRInput(LPC_GPIO, gpioports[idx], gpiopins[idx]);
}

void writeGPIO(uint8_t idx, bool value) {
	if (idx < MAXGPIO)
		Chip_GPIO_SetPinState(LPC_GPIO, gpioports[idx], gpiopins[idx], value);
}

bool readGPIO(uint8_t idx) {
	if (idx < MAXGPIO)
		return Chip_GPIO_GetPinState(LPC_GPIO, gpioports[idx], gpiopins[idx]);
	return false;
}
