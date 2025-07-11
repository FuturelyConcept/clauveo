#!/bin/bash

# Ensure cargo is in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Run Tauri development server
cargo tauri dev