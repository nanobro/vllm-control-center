#!/usr/bin/env python3
"""Run the v0.79 recipe lifecycle on a real DGX Spark and save evidence.

This script intentionally uses only the Python standard library. Run it from the
repository root with the controller dependencies installed in VCC_PYTHON and the
intended vLLM executable available on PATH.
"""

from __future__ import annotations

import json
import os
import pathlib
import signal
import subprocess
import sys
import