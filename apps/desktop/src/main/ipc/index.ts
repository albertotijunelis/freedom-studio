// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { registerInferenceHandlers } from './inferenceHandler';
import { registerModelsHandlers } from './modelsHandler';
import { registerServerHandlers } from './serverHandler';
import { registerTorHandlers } from './torHandler';
import { registerCryptoHandlers } from './cryptoHandler';
import { registerChatHandlers } from './chatHandler';

export function registerAllHandlers(): void {
  registerInferenceHandlers();
  registerModelsHandlers();
  registerServerHandlers();
  registerTorHandlers();
  registerCryptoHandlers();
  registerChatHandlers();
}
