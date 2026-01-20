import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Camera, Mail, User as UserIcon, Building, Phone, MapPin, Globe, Briefcase } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatar?: string;
  bio?: string;
  company?: string;
  location?: string;
  phone?: string;
  website?: string;
  preferences?: any;
}

interface UserPreferencesProps {
  userData?: UserData;
  onUpdate: () => void;
}

export default function UserPreferences({ userData, onUpdate }: UserPreferencesProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userData?.avatar || null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        onUpdate();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and public profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-xs text-muted-foreground">
                Click to upload a new photo
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              defaultValue={userData?.name}
              onChange={onUpdate}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  defaultValue={userData?.email}
                  className="pl-10"
                  onChange={onUpdate}
                />
              </div>
              <Button variant="outline">Verify</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This is the email address associated with your account
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              defaultValue={userData?.bio}
              rows={4}
              onChange={onUpdate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Optional details to complete your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="company"
                placeholder="Acme Corp"
                defaultValue={userData?.company}
                className="pl-10"
                onChange={onUpdate}
              />
            </div>
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="job-title">Job Title</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="job-title"
                placeholder="Software Engineer"
                className="pl-10"
                onChange={onUpdate}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="San Francisco, CA"
                defaultValue={userData?.location}
                className="pl-10"
                onChange={onUpdate}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                defaultValue={userData?.phone}
                className="pl-10"
                onChange={onUpdate}
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                defaultValue={userData?.website}
                className="pl-10"
                onChange={onUpdate}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account type and subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Account Type</p>
              <p className="text-sm text-muted-foreground">
                {userData?.role === 'admin' ? 'Administrator' : 'Standard User'}
              </p>
            </div>
            <Button variant="outline">Upgrade</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Account ID</p>
              <p className="text-sm text-muted-foreground font-mono">
                {userData?.id || 'Not available'}
              </p>
            </div>
            <Button variant="outline" size="sm">Copy</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Member Since</p>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}