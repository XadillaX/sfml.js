// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_FACTORY_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_FACTORY_H_

namespace sfmlrmlui {

void RefreshDataFactoryOwnership();
void DrainDataFactoryReleases();
// Owned instances must detach native listeners before elements are destroyed.
void ReleaseOwnedDataFactoryInstances();
// Registered instancers are released only after Rml::Factory shuts down.
void ReleaseDataFactoryInstancers();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_FACTORY_H_
