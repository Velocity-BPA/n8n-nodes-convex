#!/bin/bash
set -e

echo "📦 Installing n8n-nodes-convex locally..."

# Build the project
./scripts/build.sh

# Create n8n custom directory if it doesn't exist
mkdir -p ~/.n8n/custom

# Remove existing symlink if present
rm -f ~/.n8n/custom/n8n-nodes-convex

# Create symlink
ln -s "$(pwd)" ~/.n8n/custom/n8n-nodes-convex

echo "✅ Installation complete!"
echo "🔄 Please restart n8n to load the new node."
echo ""
echo "📋 To verify installation:"
echo "   1. Start n8n: n8n start"
echo "   2. Open n8n in browser: http://localhost:5678"
echo "   3. Create a new workflow"
echo "   4. Search for 'Convex' in the nodes panel"
