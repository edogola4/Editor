import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { useRoom } from '../../contexts/RoomContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, Lock, LogIn, User, Mail, Key } from 'lucide-react';
import { toast } from 'sonner';

const joinRoomSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().optional(),
  isGuest: z.boolean().default(false),
});

type JoinRoomFormData = z.infer<typeof joinRoomSchema>;

export function RoomJoin() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{
    name: string;
    hasPassword: boolean;
    isPublic: boolean;
    userCount: number;
    maxUsers: number;
  } | null>(null);

  const { user } = useAuth();
  const { joinRoom, getRoomInfo } = useRoom();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<JoinRoomFormData>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      roomId: searchParams.get('roomId') || '',
      username: user?.displayName || '',
      email: user?.email || '',
      isGuest: !user,
    },
  });

  const isGuest = watch('isGuest');
  const roomId = watch('roomId');

  const checkRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    try {
      setIsLoading(true);
      const info = await getRoomInfo(roomId);
      setRoomInfo({
        name: info.name,
        hasPassword: info.hasPassword,
        isPublic: info.isPublic,
        userCount: info.userCount,
        maxUsers: info.maxUsers,
      });

      if (info.hasPassword) {
        setRequiresPassword(true);
      } else {
        // If no password required, proceed to join directly
        handleJoinRoom({ roomId, username: watch('username'), isGuest: !user });
      }
    } catch (error) {
      console.error('Error checking room:', error);
      toast.error('Failed to find room. Please check the room ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (data: JoinRoomFormData) => {
    try {
      setIsLoading(true);
      const { roomId } = await joinRoom(data);
      toast.success('Successfully joined the room!');
      navigate(`/room/${roomId}`);
    } catch (error: any) {
      console.error('Error joining room:', error);
      
      if (error.response?.status === 401) {
        setError('password', { message: 'Incorrect password' });
        toast.error('Incorrect password. Please try again.');
      } else if (error.response?.status === 403) {
        toast.error('This room is full. Please try another room.');
      } else if (error.response?.status === 404) {
        toast.error('Room not found. Please check the room ID.');
      } else {
        toast.error('Failed to join room. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setRoomInfo(null);
    setRequiresPassword(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <LogIn className="w-5 h-5 mr-2" />
          {roomInfo ? 'Join Room' : 'Enter Room ID'}
        </CardTitle>
        <CardDescription>
          {roomInfo
            ? 'Enter the required information to join the room'
            : 'Enter the room ID to join an existing room'}
        </CardDescription>
      </CardHeader>

      <form onSubmit={!roomInfo ? checkRoom : handleSubmit(handleJoinRoom)}>
        <CardContent className="space-y-4">
          {!roomInfo ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="roomId">Room ID</Label>
                <Input
                  id="roomId"
                  placeholder="Enter room ID"
                  {...register('roomId')}
                  className={errors.roomId ? 'border-red-500' : ''}
                />
                {errors.roomId && <p className="text-sm text-red-500 mt-1">{errors.roomId.message}</p>}
              </div>

              {!user && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isGuest"
                      checked={isGuest}
                      onCheckedChange={(checked) => setValue('isGuest', checked)}
                      className="data-[state=checked]:bg-blue-500"
                    />
                    <Label htmlFor="isGuest">Join as guest</Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isGuest
                      ? 'You can join as a guest without creating an account.'
                      : 'Sign in to access your saved settings and history.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium">{roomInfo.name}</h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <span className="flex items-center mr-4">
                    <Users className="w-4 h-4 mr-1" />
                    {roomInfo.userCount}/{roomInfo.maxUsers} users
                  </span>
                  <span className="flex items-center">
                    {roomInfo.isPublic ? (
                      <Unlock className="w-4 h-4 mr-1" />
                    ) : (
                      <Lock className="w-4 h-4 mr-1" />
                    )}
                    {roomInfo.isPublic ? 'Public' : 'Private'} Room
                  </span>
                </div>
              </div>

              {!user && isGuest && (
                <div>
                  <Label htmlFor="username">Display Name *</Label>
                  <Input
                    id="username"
                    placeholder="Your name"
                    {...register('username')}
                    className={errors.username ? 'border-red-500' : ''}
                    leftIcon={<User className="w-4 h-4 text-gray-400" />}
                  />
                  {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>}
                </div>
              )}

              {!user && !isGuest && (
                <>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      {...register('email')}
                      className={errors.email ? 'border-red-500' : ''}
                      leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                </>
              )}

              {requiresPassword && (
                <div>
                  <Label htmlFor="password">Room Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter room password"
                    {...register('password')}
                    className={errors.password ? 'border-red-500' : ''}
                    leftIcon={<Key className="w-4 h-4 text-gray-400" />}
                  />
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
                </div>
              )}

              {roomInfo.userCount >= roomInfo.maxUsers && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Room Full</AlertTitle>
                  <AlertDescription>
                    This room has reached its maximum capacity of {roomInfo.maxUsers} users.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {roomInfo ? (
            <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button type="submit" disabled={isLoading || (roomInfo?.userCount ?? 0) >= (roomInfo?.maxUsers ?? 0)}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {roomInfo ? 'Joining...' : 'Checking...'}
              </>
            ) : roomInfo ? (
              'Join Room'
            ) : (
              'Continue'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default RoomJoin;
