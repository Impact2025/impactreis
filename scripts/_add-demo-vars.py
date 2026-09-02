#!/usr/bin/env python3
import sys, os

files = [
    "D:/apps/impactreis3/mijn-ondernemers-os/.env",
    "D:/apps/impactreis3/mijn-ondernemers-os/.env.local",
]

addition = """
# Demo account — publiek toegankelijk met één gedeeld wachtwoord
DEMO_EMAIL=demo@impactreis.nl
DEMO_PASSWORD=demo123
"""

for f in files:
    if not os.path.exists(f):
        print("SKIP (missing):", f); continue
    with open(f, "r", encoding="utf-8") as fh:
        content = fh.read()
    if "DEMO_EMAIL=" in content:
        print("SKIP (already has DEMO):", f); continue
    with open(f, "a", encoding="utf-8") as fh:
        fh.write(addition)
    print("APPEND OK:", f)
