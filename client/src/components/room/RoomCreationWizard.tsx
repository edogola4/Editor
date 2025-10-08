import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RoomFormData } from '../../types/room';
import { useRoom } from '../../contexts/RoomContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Lock, Unlock, Users, Upload, ScreenShare, LogIn } from 'lucide-react';
import { toast } from 'sonner';

const roomFormSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters').max(50, 'Room name cannot exceed 50 characters'),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
  isPublic: z.boolean().default(true),
  password: z.string().optional(),
  maxUsers: z.number().min(1).max(100).default(10),
  allowGuestAccess: z.boolean().default(true),
  allowFileUploads: z.boolean().default(true),
  allowScreenSharing: z.boolean().default(true),
  requireLogin: z.boolean().default(false),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

export function RoomCreationWizard({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRoom } = useRoom();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: '',
      description: '',
      isPublic: true,
      maxUsers: 10,
      allowGuestAccess: true,
      allowFileUploads: true,
      allowScreenSharing: true,
      requireLogin: false,
    },
  });

  const isPublic = watch('isPublic');
  const requireLogin = watch('requireLogin');

  const onSubmit = async (data: RoomFormValues) => {
    try {
      setIsSubmitting(true);
      const room = await createRoom(data);
      toast.success('Room created successfully!');
      if (onComplete) {
        onComplete();
      } else {
        navigate(`/room/${room.id}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Room Name *</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    placeholder="My Awesome Room"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                )}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    id="description"
                    rows={3}
                    className="w-full p-2 border rounded-md"
                    placeholder="What's this room about?"
                  />
                )}
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="isPublic"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isPublic"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-green-500"
                  />
                )}
              />
              <Label htmlFor="isPublic">
                {isPublic ? (
                  <span className="flex items-center text-green-600">
                    <Unlock className="w-4 h-4 mr-1" /> Public Room
                  </span>
                ) : (
                  <span className="flex items-center text-amber-600">
                    <Lock className="w-4 h-4 mr-1" /> Private Room
                  </span>
                )}
              </Label>
            </div>

            {!isPublic && (
              <div>
                <Label htmlFor="password">Password (Optional)</Label>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      placeholder="Set a password for this room"
                      className={errors.password ? 'border-red-500' : ''}
                    />
                  )}
                />
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="maxUsers">Maximum Users</Label>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <Controller
                  name="maxUsers"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="maxUsers"
                      type="number"
                      min={1}
                      max={100}
                      className="w-24"
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  )}
                />
                <span className="text-sm text-gray-500">users</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allowGuestAccess" className="flex items-center">
                  <LogIn className="w-4 h-4 mr-2" /> Allow Guest Access
                </Label>
                <Controller
                  name="allowGuestAccess"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="allowGuestAccess"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  )}
                />
              </div>
              <p className="text-xs text-gray-500">Allow users to join without an account</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allowFileUploads" className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" /> Allow File Uploads
                </Label>
                <Controller
                  name="allowFileUploads"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="allowFileUploads"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  )}
                />
              </div>
              <p className="text-xs text-gray-500">Allow users to upload files to the room</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allowScreenSharing" className="flex items-center">
                  <ScreenShare className="w-4 h-4 mr-2" /> Allow Screen Sharing
                </Label>
                <Controller
                  name="allowScreenSharing"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="allowScreenSharing"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  )}
                />
              </div>
              <p className="text-xs text-gray-500">Allow users to share their screens</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="requireLogin" className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" /> Require Login
                </Label>
                <Controller
                  name="requireLogin"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="requireLogin"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  )}
                />
              </div>
              <p className="text-xs text-gray-500">Require users to log in before joining</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="text-lg font-medium text-green-800 dark:text-green-200">Ready to create your room!</h3>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                Review your settings and click 'Create Room' to get started.
              </p>
            </div>
            <div className="text-left space-y-2 text-sm">
              <p>
                <span className="font-medium">Room Name:</span> {watch('name')}
              </p>
              {watch('description') && (
                <p>
                  <span className="font-medium">Description:</span> {watch('description')}
                </p>
              )}
              <p>
                <span className="font-medium">Visibility:</span>{' '}
                {watch('isPublic') ? 'Public' : 'Private'}
                {!watch('isPublic') && watch('password') && ' (with password)'}
              </p>
              <p>
                <span className="font-medium">Max Users:</span> {watch('maxUsers')}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create a New Room</CardTitle>
        <CardDescription>
          {step === 1 && 'Set up the basic information for your room'}
          {step === 2 && 'Configure room settings and permissions'}
          {step === 3 && 'Review and create your room'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= i ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {i}
                </div>
                <span className="text-xs mt-1">
                  {i === 1 ? 'Basics' : i === 2 ? 'Settings' : 'Review'}
                </span>
              </div>
            ))}
          </div>

          {renderStep()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
          >
            Previous
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={nextStep} disabled={!watch('name') || isSubmitting}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default RoomCreationWizard;
