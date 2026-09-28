#!/bin/sh
# Bumps the ?v=N version tag on every file in index.html (see the comment there).
# Run before each push so visitors get the new files together.
cd "$(dirname "$0")/.." || exit 1
perl -pi -e 's/\?v=(\d+)/"?v=".($1+1)/ge' index.html
grep -o '?v=[0-9][0-9]*' index.html | sort -u
