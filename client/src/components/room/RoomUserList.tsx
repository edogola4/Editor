import React, { useState, useMemo } from 'react';
import { UserRole, RoomUser, RoomPermissions } from '../../types/room';
import { useRoom } from '../../contexts/RoomContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Crown, MoreVertical, Mic, MicOff, Video, VideoOff, MessageSquare, UserX, Shield, ShieldCheck, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RoomUserListProps {
  className?: string;
  showHeader?: boolean;
  maxHeight?: string;
  onUserClick?: (userId: string) => void;
}

export function RoomUserList({ className, showHeader = true, maxHeight = '400px', onUserClick }: RoomUserListProps) {
  const { user: currentUser } = useAuth();
  const { room, kickUser, updateUserRole, currentUser: roomUser } = useRoom();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Check if current user is the room owner
  const isOwner = room?.ownerId === currentUser?.id;
  
  // Get current user's role in the room
  const currentUserRole = roomUser?.role || UserRole.GUEST;
  
  // Check if current user has permission to manage users
  const canManageUsers = isOwner || currentUserRole === UserRole.ADMIN;
  
  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!room?.users) return [];
    
    return room.users
      .filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by role (owner first, then by name)
        if (a.role === UserRole.OWNER) return -1;
        if (b.role === UserRole.OWNER) return 1;
        if (a.role !== b.role) {
          const roleOrder = [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER, UserRole.GUEST];
          return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
        }
        return a.name.localeCompare(b.name);
      });
  }, [room?.users, searchQuery]);
  
  // Get role display info
  const getRoleInfo = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER:
        return { label: 'Owner', color: 'bg-amber-500' };
      case UserRole.ADMIN:
        return { label: 'Admin', color: 'bg-purple-500' };
      case UserRole.EDITOR:
        return { label: 'Editor', color: 'bg-blue-500' };
      case UserRole.VIEWER:
        return { label: 'Viewer', color: 'bg-green-500' };
      case UserRole.GUEST:
      default:
        return { label: 'Guest', color: 'bg-gray-500' };
    }
  };
  
  // Check if a role can be assigned by the current user
  const canAssignRole = (targetRole: UserRole) => {
    if (isOwner) return true; // Owner can assign any role
    if (currentUserRole === UserRole.ADMIN && targetRole !== UserRole.OWNER) return true; // Admins can assign any role except owner
    return false;
  };
  
  // Handle role update
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      // toast.success(`User role updated to ${getRoleInfo(newRole).label}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      // toast.error('Failed to update user role');
    }
  };
  
  // Handle user kick
  const handleKickUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user from the room?')) {
      try {
        await kickUser(userId);
        // toast.success('User removed from the room');
      } catch (error) {
        console.error('Error removing user:', error);
        // toast.error('Failed to remove user');
      }
    }
  };
  
  // Check if user is online (within last 30 seconds)
  const isUserOnline = (user: RoomUser) => {
    if (user.isOnline) return true;
    if (!user.lastActive) return false;
    const lastActive = new Date(user.lastActive);
    const now = new Date();
    return (now.getTime() - lastActive.getTime()) < 30000; // 30 seconds
  };
  
  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={cn('flex flex-col border rounded-lg overflow-hidden bg-background', className)}>
      {showHeader && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              {room?.users?.length || 0} {room?.users?.length === 1 ? 'Member' : 'Members'}
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm px-3 py-1.5 border rounded-md w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? 'No matching users found' : 'No users in the room'}
          </div>
        ) : (
          <ul className="divide-y">
            {filteredUsers.map((user) => {
              const roleInfo = getRoleInfo(user.role);
              const isOnline = isUserOnline(user);
              const isCurrentUser = user.id === currentUser?.id;
              
              return (
                <li key={user.id} className="hover:bg-accent/50 transition-colors">
                  <div className="flex items-center p-3">
                    <div 
                      className="flex items-center flex-1 min-w-0 cursor-pointer"
                      onClick={() => onUserClick?.(user.id)}
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-muted">
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background',
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          )}
                        />
                      </div>
                      
                      <div className="ml-3 overflow-hidden">
                        <div className="flex items-center">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                            {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                          </p>
                          {user.role === UserRole.OWNER && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-1">
                                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Room Owner</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        
                        <div className="flex items-center mt-0.5">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs font-normal',
                              roleInfo.color,
                              user.role === UserRole.OWNER ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' :
                              user.role === UserRole.ADMIN ? 'border-purple-500/30 text-purple-600 dark:text-purple-400' :
                              user.role === UserRole.EDITOR ? 'border-blue-500/30 text-blue-600 dark:text-blue-400' :
                              user.role === UserRole.VIEWER ? 'border-green-500/30 text-green-600 dark:text-green-400' :
                              'border-gray-500/30 text-gray-600 dark:text-gray-400'
                            )}
                          >
                            {roleInfo.label}
                          </Badge>
                          
                          {!isOnline && user.lastActive && (
                            <span className="text-xs text-muted-foreground ml-2">
                              Last seen {new Date(user.lastActive).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {/* User status indicators */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="p-1 rounded-full">
                              {user.isMuted ? (
                                <MicOff className="w-4 h-4 text-red-500" />
                              ) : user.isSpeaking ? (
                                <Mic className="w-4 h-4 text-green-500 animate-pulse" />
                              ) : (
                                <Mic className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.isMuted ? 'Muted' : user.isSpeaking ? 'Speaking' : 'Not speaking'}</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="p-1 rounded-full">
                              {user.isScreenSharing ? (
                                <Video className="w-4 h-4 text-green-500" />
                              ) : (
                                <VideoOff className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.isScreenSharing ? 'Sharing screen' : 'Not sharing screen'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* User actions dropdown */}
                      {canManageUsers && !isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">User actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Role assignment */}
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                              Change Role
                            </div>
                            {Object.values(UserRole).map((role) => (
                              <DropdownMenuItem 
                                key={role}
                                disabled={!canAssignRole(role) || user.role === role}
                                onClick={() => handleRoleChange(user.id, role)}
                                className="text-sm"
                              >
                                <span className={`w-2 h-2 rounded-full ${getRoleInfo(role).color} mr-2`} />
                                {getRoleInfo(role).label}
                                {user.role === role && <Check className="ml-auto h-4 w-4" />}
                              </DropdownMenuItem>
                            ))}
                            
                            <div className="h-px bg-border my-1" />
                            
                            {/* Other actions */}
                            <DropdownMenuItem 
                              className="text-sm text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                              onClick={() => handleKickUser(user.id)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Remove from room
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      {showHeader && (
        <div className="p-3 border-t bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                <span>Owner</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5" />
                <span>Admin</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
                <span>Editor</span>
              </div>
            </div>
            <div className="text-right">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} online
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomUserList;
