import React, { useState, useMemo } from 'react';
import { UserRole, RoomUser, RoomPermissions } from '../../types/room';
import { useRoom } from '../../contexts/RoomContext';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Check, X, Shield, ShieldCheck, User, UserCog, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface UserRoleManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const rolePermissions: Record<UserRole, RoomPermissions> = {
  [UserRole.OWNER]: {
    canEdit: true,
    canInvite: true,
    canKick: true,
    canShareScreen: true,
    canUploadFiles: true,
    canManageRoom: true,
    canModerate: true,
  },
  [UserRole.ADMIN]: {
    canEdit: true,
    canInvite: true,
    canKick: true,
    canShareScreen: true,
    canUploadFiles: true,
    canManageRoom: true,
    canModerate: true,
  },
  [UserRole.EDITOR]: {
    canEdit: true,
    canInvite: false,
    canKick: false,
    canShareScreen: true,
    canUploadFiles: true,
    canManageRoom: false,
    canModerate: false,
  },
  [UserRole.VIEWER]: {
    canEdit: false,
    canInvite: false,
    canKick: false,
    canShareScreen: false,
    canUploadFiles: false,
    canManageRoom: false,
    canModerate: false,
  },
  [UserRole.GUEST]: {
    canEdit: false,
    canInvite: false,
    canKick: false,
    canShareScreen: false,
    canUploadFiles: false,
    canManageRoom: false,
    canModerate: false,
  },
};

export function UserRoleManager({ isOpen, onClose }: UserRoleManagerProps) {
  const { room, currentUser, updateUserRole, kickUser } = useRoom();
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  
  // Filter out the current user and owner (owner role can't be changed)
  const managedUsers = useMemo(() => {
    if (!room?.users) return [];
    return room.users.filter(
      (user) => user.id !== currentUser?.id && user.role !== UserRole.OWNER
    );
  }, [room?.users, currentUser]);
  
  // Check if current user can manage roles
  const canManageRoles = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.ADMIN;
  
  // Handle role change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!canManageRoles || !room) return;
    
    try {
      setUpdatingUser(userId);
      await updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdatingUser(null);
    }
  };
  
  // Handle user kick
  const handleKickUser = async (userId: string, userName: string) => {
    if (!canManageRoles) return;
    
    if (window.confirm(`Are you sure you want to remove ${userName} from the room?`)) {
      try {
        setUpdatingUser(userId);
        await kickUser(userId);
        toast.success('User removed from the room');
      } catch (error) {
        console.error('Error removing user:', error);
        toast.error('Failed to remove user');
      } finally {
        setUpdatingUser(null);
      }
    }
  };
  
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
  
  // Get available roles that can be assigned by the current user
  const getAvailableRoles = (currentRole: UserRole) => {
    const allRoles = Object.values(UserRole);
    
    if (currentUser?.role === UserRole.OWNER) {
      // Owner can assign any role except owner (owner is set at room creation and can't be changed)
      return allRoles.filter(role => role !== UserRole.OWNER);
    } else if (currentUser?.role === UserRole.ADMIN) {
      // Admin can assign editor, viewer, or guest roles
      return [UserRole.EDITOR, UserRole.VIEWER, UserRole.GUEST];
    }
    
    return [];
  };
  
  // Check if a user can be managed by the current user
  const canManageUser = (userRole: UserRole) => {
    if (currentUser?.role === UserRole.OWNER) return true;
    if (currentUser?.role === UserRole.ADMIN && userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
      return true;
    }
    return false;
  };
  
  // Get permission label
  const getPermissionLabel = (hasPermission: boolean) => {
    return hasPermission ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-gray-300 dark:text-gray-600" />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserCog className="w-5 h-5 mr-2" />
            Manage User Roles & Permissions
          </DialogTitle>
          <DialogDescription>
            Manage user roles and permissions for this room. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="lg:col-span-2">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Change Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Room Owner (not editable) */}
                  {room?.users
                    .filter(user => user.role === UserRole.OWNER)
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium">
                                {user.name}
                                {user.id === currentUser?.id && (
                                  <span className="ml-1 text-xs text-muted-foreground">(You)</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{user.email || 'No email'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                            {getRoleInfo(user.role).label}
                          </Badge>
                        </TableCell>
                        <TableCell colSpan={2} className="text-muted-foreground">
                          Room owner (cannot be changed)
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  {/* Other users */}
                  {managedUsers.length > 0 ? (
                    managedUsers.map((user) => {
                      const roleInfo = getRoleInfo(user.role);
                      const availableRoles = getAvailableRoles(user.role);
                      const isUpdating = updatingUser === user.id;
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium">
                                  {user.name}
                                  {user.id === currentUser?.id && (
                                    <span className="ml-1 text-xs text-muted-foreground">(You)</span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">{user.email || 'No email'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'font-normal',
                                user.role === UserRole.ADMIN ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                                user.role === UserRole.EDITOR ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                                user.role === UserRole.VIEWER ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                                'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                              )}
                            >
                              {roleInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                              disabled={!canManageUser(user.role) || isUpdating}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    <div className="flex items-center">
                                      <span className={`w-2 h-2 rounded-full ${getRoleInfo(role).color} mr-2`} />
                                      {getRoleInfo(role).label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleKickUser(user.id, user.name)}
                              disabled={!canManageUser(user.role) || isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              <span className="ml-1">Remove</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No users to manage
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {!canManageRoles && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm rounded-md border border-yellow-100 dark:border-yellow-900/30">
                <p>You don't have permission to manage user roles. Only room owners and admins can manage user permissions.</p>
              </div>
            )}
          </div>
          
          {/* Permissions Guide */}
          <div className="lg:col-span-1">
            <div className="rounded-md border p-4 bg-muted/20">
              <h3 className="font-medium mb-3 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Role Permissions
              </h3>
              
              <div className="space-y-4">
                {Object.entries(rolePermissions).map(([role, permissions]) => {
                  const roleInfo = getRoleInfo(role as UserRole);
                  
                  return (
                    <div key={role} className="border rounded-md overflow-hidden">
                      <div 
                        className={cn(
                          'px-3 py-2 text-sm font-medium flex items-center',
                          role === UserRole.OWNER ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                          role === UserRole.ADMIN ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' :
                          role === UserRole.EDITOR ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                          role === UserRole.VIEWER ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                          'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                        )}
                      >
                        <span className={`w-2 h-2 rounded-full ${roleInfo.color} mr-2`} />
                        {roleInfo.label} {role === currentUser?.role && '(You)'}
                      </div>
                      <div className="p-3 bg-background">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            {getPermissionLabel(permissions.canEdit)}
                            <span className="ml-2">Edit code</span>
                          </li>
                          <li className="flex items-center">
                            {getPermissionLabel(permissions.canInvite)}
                            <span className="ml-2">Invite users</span>
                          </li>
                          <li className="flex items-center">
                            {getPermissionLabel(permissions.canKick)}
                            <span className="ml-2">Remove users</span>
                          </li>
                          <li className="flex items-center">
                            {getPermissionLabel(permissions.canShareScreen)}
                            <span className="ml-2">Share screen</span>
                          </li>
                          <li className="flex items-center">
                            {getPermissionLabel(permissions.canUploadFiles)}
                            <span className="ml-2">Upload files</span>
                          </li>
                          <li className="flex items-center">
                            {getPermissionLabel(permissions.canManageRoom)}
                            <span className="ml-2">Manage room settings</span>
                          </li>
                          <li className="flex items-center">
                            {getPermissionLabel(permissions.canModerate)}
                            <span className="ml-2">Moderate content</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-900/30">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Permission Notes
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Only room owners can assign admin roles</li>
                <li>• Admins cannot modify other admins or the owner</li>
                <li>• Changes take effect immediately</li>
                <li>• Users will be notified of role changes</li>
              </ul>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserRoleManager;
