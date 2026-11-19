// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cstdio>

extern "C" FILE* OfficialOpenScoresFile(const char* file, const char* mode);

// Preserve the original parser/serializer while selecting application-owned
// score storage. Include stdio first so the Windows CRT's dllimport
// declaration of fopen is not redirected to the application-owned function.
#define fopen OfficialOpenScoresFile
#include "third_party/rmlui/Samples/invaders/src/HighScores.cpp"  // NOLINT(build/include)
#undef fopen
