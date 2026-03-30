// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { ElectronAPI } from '@freedom-studio/types';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
