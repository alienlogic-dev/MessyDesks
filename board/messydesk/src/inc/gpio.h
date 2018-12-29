/*
 * gpio.h
 *
 *  Created on: Dec 28, 2018
 *      Author: chmod775
 */

#ifndef INC_GPIO_H_
#define INC_GPIO_H_

void setGPIO(uint8_t idx, bool asOutput);

void writeGPIO(uint8_t idx, bool value);

bool readGPIO(uint8_t idx);

#endif /* INC_GPIO_H_ */
