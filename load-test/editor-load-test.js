import http from 'k6/http';
import { check, sleep } from 'k6';
import { WebSocket } from 'k6/experimental/websockets';
import { randomIntBetween, randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuration
const WS_URL = __ENV.WS_URL || 'ws://localhost:3001';
const API_URL = __ENV.API_URL || 'http://localhost:3000';
const DOCUMENT_ID = __ENV.DOCUMENT_ID || 'test-load-doc';
const TEST_DURATION = __ENV.DURATION || '1m';
const VUS = parseInt(__ENV.VUS) || 10;

// Test data
const LOREM_IPSUM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`;

// Shared state for virtual users
const shared = {
  wsParams: {
    tags: { type: 'ws' },
    headers: {
      'User-Agent': 'k6-load-test/1.0',
    },
  },
  httpParams: {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test-token`,
    },
    tags: { type: 'http' },
  },
};

export const options = {
  scenarios: {
    collaborative_editing: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: VUS }, // Ramp up to the target VUs
        { duration: TEST_DURATION, target: VUs }, // Stay at target
        { duration: '30s', target: 0 }, // Ramp down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'ws_ping{type:ws}': ['p(95)<100'], // 95% of pings should be below 100ms
    'http_req_duration{type:http}': ['p(95)<200'],
    'ws_connecting{type:ws}': ['p(95)<1000'],
  },
};

// Helper function to generate random operations
function generateOperation(content, position = null) {
  const ops = [];
  const opTypes = ['insert', 'delete'];
  const opType = opTypes[Math.floor(Math.random() * opTypes.length)];
  
  if (opType === 'insert') {
    const text = LOREM_IPSUM.split(' ')[Math.floor(Math.random() * 10)] + ' ';
    const pos = position || randomIntBetween(0, Math.max(0, content.length - 1));
    ops.push({ type: 'insert', text, pos });
    content = content.slice(0, pos) + text + content.slice(pos);
  } else {
    if (content.length > 10) {
      const pos = randomIntBetween(0, content.length - 5);
      const length = randomIntBetween(1, Math.min(5, content.length - pos));
      ops.push({ type: 'delete', pos, length });
      content = content.slice(0, pos) + content.slice(pos + length);
    }
  }
  
  return { ops, content };
}

export default function () {
  const userId = `user-${__VU}-${Date.now()}`;
  const username = `User ${__VU}`;
  let documentContent = LOREM_IPSUM;
  let version = 0;

  // Simulate initial document fetch
  const docRes = http.get(`${API_URL}/api/documents/${DOCUMENT_ID}`, shared.httpParams);
  if (docRes.status === 200) {
    const docData = JSON.parse(docRes.body);
    documentContent = docData.content || documentContent;
    version = docData.version || 0;
  }

  // Set up WebSocket connection
  const ws = new WebSocket(`${WS_URL}?documentId=${DOCUMENT_ID}&userId=${userId}`);
  
  // Set up event handlers
  ws.onopen = () => {
    console.log(`VU ${__VU}: WebSocket connected`);
    
    // Send authentication
    ws.send(JSON.stringify({
      type: 'authenticate',
      token: 'test-token',
      documentId: DOCUMENT_ID,
    }));
  };

  ws.onmessage = (e) => {
    const message = JSON.parse(e.data);
    
    switch (message.type) {
      case 'document:state':
        documentContent = message.content;
        version = message.version;
        break;
        
      case 'operation':
        // Apply remote operation to local content
        // In a real test, you'd implement OT logic here
        version = message.version;
        break;
    }
  };

  ws.onerror = (e) => {
    console.error(`VU ${__VU}: WebSocket error:`, e);
  };

  // Simulate user activity
  for (let i = 0; i < 20; i++) {
    const { ops, content: newContent } = generateOperation(documentContent);
    
    // Send operation
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'operation',
        documentId: DOCUMENT_ID,
        operation: ops,
        version,
      }));
      
      // Update cursor position
      ws.send(JSON.stringify({
        type: 'cursor:update',
        documentId: DOCUMENT_ID,
        cursor: { row: 0, column: randomIntBetween(0, newContent.length) },
        selection: null,
      }));
      
      documentContent = newContent;
      version++;
    }
    
    // Random delay between operations
    sleep(randomIntBetween(100, 1000) / 1000);
  }
  
  // Clean up
  ws.close();
}

export function teardown() {
  console.log('Load test completed');
}
