#!/bin/bash

echo "🚀 Starting Collaborative Code Editor - Real-time Testing Demo"
echo "============================================================"
echo ""
echo "📋 Instructions:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Start typing code in the Monaco Editor"
echo "3. Open a new browser tab with the same URL"
echo "4. Watch the real-time collaboration in action!"
echo ""
echo "✨ Features to test:"
echo "• Live code synchronization between tabs"
echo "• Real-time cursor position tracking"
echo "• User presence indicators"
echo "• Typing indicators"
echo "• Language switching synchronization"
echo "• Multi-user collaborative editing"
echo ""
echo "🔧 Technical Features:"
echo "• Document rooms for isolated sessions"
echo "• WebSocket real-time communication"
echo "• Automatic reconnection handling"
echo "• User identification and tracking"
echo "• Conflict-free replicated editing"
echo ""
echo "🎯 Test Scenarios:"
echo "1. Type in Tab 1 → See changes in Tab 2"
echo "2. Change language in Tab 1 → See in Tab 2"
echo "3. Move cursor in Tab 1 → See cursor in Tab 2"
echo "4. Open 3+ tabs to see multiple cursors"
echo ""
echo "📊 Server Status:"
echo "• Backend: http://localhost:5000 ✅"
echo "• Frontend: http://localhost:5173 ✅"
echo "• WebSocket: ws://localhost:5000 ✅"
echo ""
echo "🌐 Ready to test! Open http://localhost:5173 in multiple tabs"
echo "============================================================"

# Open multiple browser tabs (this will work on macOS)
echo ""
echo "🔍 Opening browser tabs for testing..."
sleep 2

if command -v open &> /dev/null; then
    echo "Opening Tab 1..."
    open "http://localhost:5173"
    sleep 1

    echo "Opening Tab 2..."
    open "http://localhost:5173"
    sleep 1

    echo "Opening Tab 3..."
    open "http://localhost:5173"
    sleep 1

    echo "✅ Multiple tabs opened successfully!"
    echo "🎉 Start testing real-time collaboration now!"
else
    echo "ℹ️  Please manually open http://localhost:5173 in multiple browser tabs"
    echo "💡 On macOS: open http://localhost:5173"
    echo "💡 On Linux: xdg-open http://localhost:5173"
    echo "💡 On Windows: start http://localhost:5173"
fi

echo ""
echo "🔄 Keep this terminal open to monitor the collaboration demo"
echo "📝 Check browser console for WebSocket connection logs"
