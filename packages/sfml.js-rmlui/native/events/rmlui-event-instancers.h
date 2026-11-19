// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_EVENT_INSTANCERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_EVENT_INSTANCERS_H_

#include <RmlUi/Core/Event.h>
#include <nan.h>

namespace sfmlrmlui {

// Preserve a real external EventPtr's release chain and JS ownership edges.
v8::MaybeLocal<v8::Object> WrapOwnedEvent(Rml::EventPtr event);

void RefreshEventInstancerOwnership();
void DrainEventInstancerReleases();
void ReleaseOwnedEvents();
void ReleaseEventInstancers();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_EVENT_INSTANCERS_H_
