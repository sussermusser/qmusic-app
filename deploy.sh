#!/bin/bash

echo "🔨 Building application..."
npm run build

echo "📋 Copying to Qortal Browser..."
cp -r dist/* /home/iffiolen/Desktop/QortalPoliticalDebate/q-browser-0.24.0/ui/qmusic-app/

echo "✅ Deployment complete!"
echo "🚀 Ready to test in Qortal Browser"
