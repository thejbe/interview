#!/bin/bash

# verification script
echo "Running Type Check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ Type Check Failed"
    exit 1
fi

echo "Running Linter..."
npx eslint .
if [ $? -ne 0 ]; then
    echo "❌ Lint Check Failed"
    exit 1
fi

# Optional: Check for migration files if we could detect schema changes (complex)
# For now, just enforcing code quality.

echo "Running Unit Tests..."
npm run test
if [ $? -ne 0 ]; then
    echo "❌ Unit Tests Failed"
    exit 1
fi

echo "✅ All Checks Passed"
exit 0
