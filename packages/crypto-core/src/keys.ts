// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { randomBytes } from 'node:crypto';

export function generateKey(length = 32): Buffer {
  return randomBytes(length);
}
