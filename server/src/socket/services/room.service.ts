import { CustomSocket, Room, User, CursorPosition, SelectionRange } from '../types/events.js';
import { randomColor } from '../../utils/color.js';

interface UserPresence {
  user: User;
  cursorPosition?: CursorPosition;
  selection?: SelectionRange | null;
  lastSeen: Date;
  isTyping: boolean;
}

export class RoomService {
  private rooms: Map<string, Room> = new Map();
  private userRoomMap: Map<string, string> = new Map(); // userId -> roomId
  private userSockets: Map<string, CustomSocket> = new Map(); // userId -> socket
  private userPresence: Map<string, UserPresence> = new Map(); // userId -> UserPresence

  createRoom(roomId: string, roomName: string, owner: User, maxMembers: number = 10): Room {
    if (this.rooms.has(roomId)) {
      throw new Error('Room already exists');
    }

    // Assign a color if not provided
    if (!owner.color) {
      owner.color = randomColor();
    }

    const room: Room = {
      id: roomId,
      name: roomName,
      owner: owner.id,
      members: new Set([owner.id]),
      maxMembers,
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    this.userRoomMap.set(owner.id, roomId);
    
    // Initialize presence data
    this.userPresence.set(owner.id, {
      user: owner,
      lastSeen: new Date(),
      isTyping: false
    });
    
    return room;
  }

  joinRoom(roomId: string, user: User): Room {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.members.size >= room.maxMembers) {
      throw new Error('Room is full');
    }

    // If user was in another room, leave it first
    this.leaveCurrentRoom(user.id);

    // Assign a color if not provided
    if (!user.color) {
      user.color = randomColor();
    }

    room.members.add(user.id);
    this.userRoomMap.set(user.id, roomId);

    // Initialize or update presence data
    this.userPresence.set(user.id, {
      user,
      lastSeen: new Date(),
      isTyping: false
    });

    return room;
  }

  leaveRoom(userId: string): { roomId: string; isEmpty: boolean } | null {
    const roomId = this.userRoomMap.get(userId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.members.delete(userId);
    this.userRoomMap.delete(userId);

    const isEmpty = room.members.size === 0;
    if (isEmpty) {
      this.rooms.delete(roomId);
    }

    return { roomId, isEmpty };
  }

  private leaveCurrentRoom(userId: string): void {
    const currentRoomId = this.userRoomMap.get(userId);
    if (currentRoomId) {
      const room = this.rooms.get(currentRoomId);
      if (room) {
        room.members.delete(userId);
        if (room.members.size === 0) {
          this.rooms.delete(currentRoomId);
        }
      }
      this.userRoomMap.delete(userId);
    }
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getUserRoom(userId: string): Room | undefined {
    const roomId = this.userRoomMap.get(userId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  getRoomMembers(roomId: string): User[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.members)
      .map((userId: string) => this.userPresence.get(userId)?.user)
      .filter((user): user is User => user !== undefined);
  }

  updateCursorPosition(userId: string, position: CursorPosition): void {
    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.cursorPosition = position;
      presence.lastSeen = new Date();
      this.broadcastUserPresence(userId);
    }
  }

  updateSelection(userId: string, selection: SelectionRange | null): void {
    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.selection = selection;
      presence.lastSeen = new Date();
      this.broadcastUserPresence(userId);
    }
  }

  setUserTyping(userId: string, isTyping: boolean): void {
    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.isTyping = isTyping;
      presence.lastSeen = new Date();
      this.broadcastUserPresence(userId);
    }
  }

  private broadcastUserPresence(userId: string): void {
    const roomId = this.userRoomMap.get(userId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const socket = this.userSockets.get(userId);
    if (!socket) return;

    // Broadcast to all users in the room except the sender
    const members = this.getRoomMembers(roomId).map(user => {
      const presence = this.userPresence.get(user.id);
      return {
        ...user,
        cursorPosition: presence?.cursorPosition,
        selection: presence?.selection ?? undefined,
        isTyping: presence?.isTyping || false
      };
    });
    socket.to(roomId).emit('presence:update', members);
  }

  getUserPresence(userId: string): UserPresence | undefined {
    return this.userPresence.get(userId);
  }

  getAllPresenceData(roomId: string): UserPresence[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.members)
      .map((userId: string) => this.userPresence.get(userId))
      .filter((presence): presence is UserPresence => presence !== undefined);
  }

  registerUserSocket(userId: string, socket: CustomSocket): void {
    this.userSockets.set(userId, socket);
    
    // Update presence with socket data
    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.lastSeen = new Date();
      // Update user data from socket if needed
      presence.user = {
        ...presence.user,
        ...(socket.data.user || {})
      };
    } else {
      // Initialize presence if it doesn't exist
      this.userPresence.set(userId, {
        user: {
          ...socket.data.user,
          id: userId,
          username: socket.data.user?.username || `user-${userId.slice(0, 6)}`,
          color: socket.data.user?.color || randomColor()
        },
        lastSeen: new Date(),
        isTyping: false
      });
    }
  }

  removeUserSocket(userId: string): void {
    this.userSockets.delete(userId);
    
    // Update last seen when user disconnects
    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.lastSeen = new Date();
    }
  }

  getUserSocket(userId: string): CustomSocket | undefined {
    return this.userSockets.get(userId);
  }
}

export const roomService = new RoomService();
