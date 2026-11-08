#!/bin/bash

if [ -t 0 ] && [ $# -eq 0 ]; then
    echo "Usage: echo '#define...' | $0"
    echo "       $0 input_file.h"
    exit 1
fi

sed -E -n 's/^#define[[:space:]]+([A-Za-z0-9_]+)[[:space:]]+"([0-9a-fA-F]{8})-([0-9a-fA-F]{4})-([0-9a-fA-F]{4})-([0-9a-fA-F]{4})-([0-9a-fA-F]{12})".*/#define \1 NimBLEUUID(0x\2, 0x\3, 0x\4, 0x\5\6)/p' "$@"
