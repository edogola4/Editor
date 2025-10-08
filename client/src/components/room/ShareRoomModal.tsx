import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom } from '../../contexts/RoomContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Check, Copy, Link as LinkIcon, Mail, MessageSquare, Share2, X, Facebook, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../ui/dialog';

type ShareMethod = 'link' | 'email' | 'message';

interface ShareRoomModalProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ShareRoomModal({ children, isOpen: externalIsOpen, onOpenChange }: ShareRoomModalProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, generateInviteCode, inviteCodes } = useRoom();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ShareMethod>('link');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Handle both internal and external open state
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  // Generate a new invite link when the modal opens
  useEffect(() => {
    const generateLink = async () => {
      if (!isOpen || !roomId) return;
      
      try {
        setIsGeneratingLink(true);
        // Try to use an existing invite code first
        if (inviteCodes && inviteCodes.length > 0) {
          const activeCode = inviteCodes.find(code => !code.expiresAt || new Date(code.expiresAt) > new Date());
          if (activeCode) {
            setInviteLink(`${window.location.origin}/invite/${activeCode.code}`);
            return;
          }
        }
        
        // If no active code, generate a new one
        const newCode = await generateInviteCode(roomId, { expiresInHours: 168 }); // 7 days
        setInviteLink(`${window.location.origin}/invite/${newCode.code}`);
      } catch (error) {
        console.error('Error generating invite link:', error);
        toast.error('Failed to generate invite link');
        setInviteLink(window.location.href); // Fallback to current URL
      } finally {
        setIsGeneratingLink(false);
      }
    };

    if (isOpen) {
      generateLink();
    }
  }, [isOpen, roomId, generateInviteCode, inviteCodes]);

  const handleCopyLink = () => {
    if (!inviteLink) return;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      setIsCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    });
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'email' && !email) {
      toast.error('Please enter an email address');
      return;
    }
    
    try {
      setIsSending(true);
      // TODO: Implement actual email/message sending
      // For now, just show a success message
      toast.success(`Invite sent via ${activeTab === 'email' ? 'email' : 'message'}!`);
      
      // Reset form
      if (activeTab === 'email') {
        setEmail('');
      } else {
        setMessage('');
      }
      
      // Close the modal after a short delay
      setTimeout(() => handleOpenChange(false), 1000);
    } catch (error) {
      console.error(`Error sending ${activeTab} invite:`, error);
      toast.error(`Failed to send ${activeTab} invite`);
    } finally {
      setIsSending(false);
    }
  };

  const shareOnSocial = (platform: string) => {
    const shareText = `Join me in our collaborative coding room: ${room?.name || 'Code Room'}`;
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(inviteLink)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteLink)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText} - ${inviteLink}`)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Room</DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="py-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ShareMethod)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="link">
                <LinkIcon className="w-4 h-4 mr-2" />
                Link
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="message">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="space-y-4">
              <div>
                <Label htmlFor="invite-link">Invite Link</Label>
                <div className="flex space-x-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      id="invite-link"
                      value={isGeneratingLink ? 'Generating link...' : inviteLink}
                      readOnly
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyLink}
                      disabled={isGeneratingLink}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      variant="ghost"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="sr-only">Copy link</span>
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={isGeneratingLink || isCopied}
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Anyone with this link can join the room.</p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Share on</p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial('twitter')}
                    className="flex-1"
                  >
                    <Twitter className="w-4 h-4 mr-2 text-blue-400" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial('facebook')}
                    className="flex-1"
                  >
                    <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial('linkedin')}
                    className="flex-1"
                  >
                    <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial('whatsapp')}
                    className="flex-1"
                  >
                    <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="email">
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email-message">Message (optional)</Label>
                  <textarea
                    id="email-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2 border rounded-md min-h-[100px]"
                    placeholder="Join me in our collaborative coding session!"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSending}>
                    {isSending ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="message">
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="message-text">Message</Label>
                  <textarea
                    id="message-text"
                    value={message || `Join me in our collaborative coding room: ${room?.name || 'Code Room'}`}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2 border rounded-md min-h-[100px]"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {message.length}/160 characters
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSending}>
                    {isSending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareRoomModal;
