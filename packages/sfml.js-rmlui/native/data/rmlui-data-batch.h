// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_BATCH_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_BATCH_H_

#include <nan.h>

#include <memory>

namespace sfmlrmlui {

struct DataModelState;

// Model teardown clears callback edges; retained planes own only their bytes.
void InvalidateDataBatches(const std::shared_ptr<DataModelState>& model);
NAN_MODULE_INIT(InitializeRmlDataBatch);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_BATCH_H_
