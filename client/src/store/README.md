# State Management with Zustand

This directory contains the state management implementation for the collaborative code editor, built with [Zustand](https://github.com/pmndrs/zustand) and TypeScript.

## 🏗 Architecture

The state is divided into multiple stores, each responsible for a specific domain:

```
store/
├── index.ts         # Main store configuration and exports
├── types.ts         # TypeScript types and interfaces
└── middleware/      # Custom middleware
    ├── persist.ts   # State persistence
    ├── logger.ts    # Action logging
    └── devtools.ts  # Redux DevTools integration
```

## 🗃️ Stores

### 1. Editor Store
Manages editor-related state including content, cursor position, and editor settings.

```typescript
const { content, language, isSaving } = useEditor();
const { setContent, setLanguage } = useEditorActions();
```

### 2. Room Store
Handles room state, user presence, and collaboration settings.

```typescript
const { currentRoom, users, isConnected } = useRoom();
const { joinRoom, leaveRoom, updateRoomSettings } = useRoomActions();
```

### 3. User Store
Manages authentication state and user preferences.

```typescript
const { currentUser, isAuthenticated, preferences } = useUser();
const { login, logout, updatePreferences } = useUserActions();
```

### 4. Socket Store
Tracks WebSocket connection status and handles real-time events.

```typescript
const { isConnected, latency, lastPing } = useSocket();
const { connect, disconnect } = useSocketActions();
```

### 5. UI Store
Manages UI state like modals, notifications, and theme.

```typescript
const { isSidebarOpen, notifications, theme } = useUI();
const { toggleSidebar, showNotification, setTheme } = useUIActions();
```

## 🎯 Key Features

### Type Safety
Full TypeScript support with strict type checking for all state and actions.

### Optimistic Updates
Smooth UI experience with automatic rollback on error.

```typescript
const { execute: saveContent, isSaving } = useOptimisticUpdate({
  setter: setEditorState,
  apiCall: async (content) => {
    const response = await api.saveDocument(content);
    return response.data;
  },
  onSuccess: () => showNotification({
    type: 'success',
    message: 'Document saved successfully!'
  })
});
```

### Middleware
- **Persistence**: Automatically persist state to localStorage
- **Logging**: Action logging in development
- **DevTools**: Time-travel debugging with Redux DevTools

### Performance Optimizations
- Memoized selectors
- Batched updates
- Selective re-renders

## 🧪 Testing

Run tests for the store:

```bash
npm test -- --coverage --collectCoverageFrom='src/store/**/*.{ts,tsx}'
```

## 📚 API Reference

### useStore()
The main hook to access the store.

```typescript
const state = useStore();
const { editor, room, user, socket, ui } = useStore();
```

### Selectors
For optimized re-renders, use selectors:

```typescript
// This will only re-render when editor.content changes
const content = useStore(state => state.editor.content);

// Use shallow equality for object comparison
const user = useStore(
  state => ({
    name: state.user.name,
    email: state.user.email
  }),
  shallow
);
```

### Actions
All state updates should go through actions:

```typescript
const setContent = useStore(state => state.setEditorState);

// Update state
setContent({ content: 'New content', isDirty: true });

// Or use a function for updates based on previous state
setContent(prev => ({
  ...prev,
  content: 'Updated content',
  lastModified: new Date()
}));
```

## 🛠 Development

### Adding a New Store
1. Add types to `types.ts`
2. Create a new slice in `index.ts`
3. Export selectors and actions
4. Add tests

### Debugging
1. Install Redux DevTools extension
2. Use the `useDebug` hook in components
3. Check browser console for action logs

## 📝 Best Practices

1. **Use Selectors**: Always use selectors to prevent unnecessary re-renders
2. **Keep Stores Focused**: Each store should have a single responsibility
3. **Use Actions**: Never modify state directly, always use actions
4. **Optimize Updates**: Batch updates when possible
5. **Test Thoroughly**: Write tests for all state updates and selectors
