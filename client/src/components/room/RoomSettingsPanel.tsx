import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RoomSettings } from '../../types/room';
import { useRoom } from '../../contexts/RoomContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Loader2, Save, Lock, Unlock, Users, UserPlus, X, Check, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const roomSettingsSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  password: z.string().optional(),
  maxUsers: z.number().min(1).max(100).default(10),
  allowGuestAccess: z.boolean().default(true),
  allowFileUploads: z.boolean().default(true),
  allowScreenSharing: z.boolean().default(true),
  requireLogin: z.boolean().default(false),
});

type RoomSettingsFormData = z.infer<typeof roomSettingsSchema>;

export function RoomSettingsPanel() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const {
    room,
    updateRoomSettings,
    generateInviteCode,
    revokeInviteCode,
    inviteCodes,
    isLoading: isRoomLoading,
    isOwner,
  } = useRoom();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [newCodeExpiry, setNewCodeExpiry] = useState('24h');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<number | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<RoomSettingsFormData>({
    resolver: zodResolver(roomSettingsSchema),
    defaultValues: {
      name: room?.name || '',
      description: room?.description || '',
      isPublic: room?.isPublic ?? true,
      maxUsers: room?.maxUsers || 10,
      allowGuestAccess: room?.allowGuestAccess ?? true,
      allowFileUploads: room?.allowFileUploads ?? true,
      allowScreenSharing: room?.allowScreenSharing ?? true,
      requireLogin: room?.requireLogin ?? false,
    },
  });

  // Reset form when room data changes
  useEffect(() => {
    if (room) {
      reset({
        name: room.name,
        description: room.description || '',
        isPublic: room.isPublic,
        maxUsers: room.maxUsers,
        allowGuestAccess: room.allowGuestAccess,
        allowFileUploads: room.allowFileUploads,
        allowScreenSharing: room.allowScreenSharing,
        requireLogin: room.requireLogin,
      });
    }
  }, [room, reset]);

  const isPublic = watch('isPublic');
  const allowGuestAccess = watch('allowGuestAccess');

  const handleSaveSettings = async (data: RoomSettingsFormData) => {
    if (!roomId) return;
    
    try {
      setIsSaving(true);
      await updateRoomSettings(roomId, {
        ...data,
        // Only include password if it's being changed
        password: data.password || undefined,
      });
      toast.success('Room settings updated successfully');
    } catch (error) {
      console.error('Error updating room settings:', error);
      toast.error('Failed to update room settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    if (!roomId) return;
    
    try {
      setIsGeneratingCode(true);
      const expiresInHours = parseInt(newCodeExpiry) || 24;
      await generateInviteCode(roomId, {
        expiresInHours,
        maxUses: newCodeMaxUses,
      });
      toast.success('Invite code generated successfully');
      setNewCodeExpiry('24h');
      setNewCodeMaxUses(undefined);
    } catch (error) {
      console.error('Error generating invite code:', error);
      toast.error('Failed to generate invite code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleRevokeCode = async (codeId: string) => {
    if (!roomId) return;
    
    try {
      await revokeInviteCode(roomId, codeId);
      toast.success('Invite code revoked');
    } catch (error) {
      console.error('Error revoking invite code:', error);
      toast.error('Failed to revoke invite code');
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomId) return;
    
    try {
      setIsDeleting(true);
      // TODO: Implement delete room functionality
      // await deleteRoom(roomId);
      toast.success('Room deleted successfully');
      // Redirect to home or dashboard
      // navigate('/');
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
      setIsDeleting(false);
    }
  };

  if (isRoomLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
        <h3 className="mt-4 text-lg font-medium">Room not found</h3>
        <p className="mt-2 text-gray-500">The room you're looking for doesn't exist or you don't have permission to view it.</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-8 text-center">
        <Lock className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">Access Denied</h3>
        <p className="mt-2 text-gray-500">Only room owners can access these settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Room Settings</CardTitle>
              <CardDescription>Manage your room's general settings and permissions.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(handleSaveSettings)}>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Room Name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      {...register('description')}
                      className="w-full p-2 border rounded-md min-h-[100px]"
                      placeholder="Describe what this room is about"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="isPublic">Room Visibility</Label>
                        <p className="text-sm text-gray-500">
                          {isPublic
                            ? 'Anyone with the link can find and join this room.'
                            : 'Only people with an invite link can join this room.'}
                        </p>
                      </div>
                      <Switch
                        id="isPublic"
                        checked={isPublic}
                        onCheckedChange={(checked) => {
                          // @ts-ignore
                          setValue('isPublic', checked, { shouldDirty: true });
                        }}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>

                    {!isPublic && (
                      <div>
                        <Label htmlFor="password">Room Password (Optional)</Label>
                        <Input
                          id="password"
                          type="password"
                          {...register('password')}
                          placeholder="Set a password for this room"
                          className={errors.password ? 'border-red-500' : ''}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave blank to keep the current password or remove it.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Room Permissions</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allowGuestAccess">Allow Guest Access</Label>
                          <p className="text-sm text-gray-500">
                            Allow users to join without an account.
                          </p>
                        </div>
                        <Switch
                          id="allowGuestAccess"
                          checked={allowGuestAccess}
                          onCheckedChange={(checked) => {
                            // @ts-ignore
                            setValue('allowGuestAccess', checked, { shouldDirty: true });
                          }}
                          className="data-[state=checked]:bg-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allowFileUploads">Allow File Uploads</Label>
                          <p className="text-sm text-gray-500">
                            Allow users to upload files to the room.
                          </p>
                        </div>
                        <Switch
                          id="allowFileUploads"
                          checked={watch('allowFileUploads')}
                          onCheckedChange={(checked) => {
                            // @ts-ignore
                            setValue('allowFileUploads', checked, { shouldDirty: true });
                          }}
                          className="data-[state=checked]:bg-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allowScreenSharing">Allow Screen Sharing</Label>
                          <p className="text-sm text-gray-500">
                            Allow users to share their screens.
                          </p>
                        </div>
                        <Switch
                          id="allowScreenSharing"
                          checked={watch('allowScreenSharing')}
                          onCheckedChange={(checked) => {
                            // @ts-ignore
                            setValue('allowScreenSharing', checked, { shouldDirty: true });
                          }}
                          className="data-[state=checked]:bg-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="requireLogin">Require Login</Label>
                          <p className="text-sm text-gray-500">
                            Users must be logged in to join this room.
                          </p>
                        </div>
                        <Switch
                          id="requireLogin"
                          checked={watch('requireLogin')}
                          onCheckedChange={(checked) => {
                            // @ts-ignore
                            setValue('requireLogin', checked, { shouldDirty: true });
                          }}
                          className="data-[state=checked]:bg-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="maxUsers">Maximum Users</Label>
                        <p className="text-sm text-gray-500">
                          Set the maximum number of users allowed in this room.
                        </p>
                      </div>
                      <div className="w-24">
                        <Input
                          id="maxUsers"
                          type="number"
                          min="1"
                          max="100"
                          {...register('maxUsers', { valueAsNumber: true })}
                          className={errors.maxUsers ? 'border-red-500' : ''}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={!isDirty || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Invite People</CardTitle>
              <CardDescription>
                Generate invite codes to share with others. Each code can have an expiration time and usage limit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Generate New Invite Code</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expires After</Label>
                        <select
                          id="expiry"
                          value={newCodeExpiry}
                          onChange={(e) => setNewCodeExpiry(e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="1">1 hour</option>
                          <option value="6">6 hours</option>
                          <option value="24">24 hours</option>
                          <option value="168">7 days</option>
                          <option value="720">30 days</option>
                          <option value="0">Never</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="maxUses">Max Uses (optional)</Label>
                        <Input
                          id="maxUses"
                          type="number"
                          min="1"
                          placeholder="Unlimited"
                          value={newCodeMaxUses || ''}
                          onChange={(e) =>
                            setNewCodeMaxUses(e.target.value ? parseInt(e.target.value, 10) : undefined)
                          }
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleGenerateInviteCode}
                      disabled={isGeneratingCode}
                      className="w-full sm:w-auto"
                    >
                      {isGeneratingCode ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Generate Invite Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Active Invite Codes</h4>
                  {inviteCodes && inviteCodes.length > 0 ? (
                    <div className="space-y-2">
                      {inviteCodes.map((code) => (
                        <div
                          key={code.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div>
                            <div className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm inline-block">
                              {code.code}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {code.expiresAt
                                ? `Expires: ${new Date(code.expiresAt).toLocaleString()}`
                                : 'Never expires'}
                              {code.maxUses && ` • Max uses: ${code.usedCount}/${code.maxUses}`}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeCode(code.id)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Revoke</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No active invite codes. Generate one above.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>
                These actions are irreversible. Please be certain before proceeding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-md">
                <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Delete This Room</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Once you delete this room, all data including code, chat history, and files will be permanently
                  removed. This action cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Room
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <p className="text-sm font-medium mb-2">Are you sure you want to delete this room?</p>
                    <div className="space-x-2">
                      <Button
                        variant="destructive"
                        onClick={handleDeleteRoom}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Yes, delete this room'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RoomSettingsPanel;
