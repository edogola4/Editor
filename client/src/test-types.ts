// Test file to verify types are working
import type { HeaderProps, UserPresence, ToolbarAction } from './types/index';

const testHeaderProps: HeaderProps = {
  documentId: 'test',
  users: []
};

console.log('Types are working correctly:', testHeaderProps);
