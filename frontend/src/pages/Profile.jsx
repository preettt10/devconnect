// src/pages/Profile.jsx
import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Camera, Edit2, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '../components/layout/AppLayout.jsx';
import ProfileCard from '../components/user/ProfileCard.jsx';
import PostCard from '../components/post/PostCard.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Input from '../components/ui/Input.jsx';
import { Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  useUserProfile,
  useUserPostsList,
  useUpdateProfile,
  useUploadAvatar,
  useRemoveAvatar,
} from '../hooks/useUsers.js';

const editSchema = z.object({
  name: z.string().min(2).max(60),
  bio: z.string().max(300).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  skills: z.string().optional(),
});

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef(null);

  const isOwnProfile = currentUser?.username === username;

  // Fetch user profile
  const { data, isLoading } = useUserProfile(username);

  // Fetch user posts
  const { data: postsData } = useUserPostsList(data?._id);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(editSchema),
    values: {
      name: data?.name || '',
      bio: data?.bio || '',
      githubUrl: data?.githubUrl || '',
      portfolioUrl: data?.portfolioUrl || '',
      skills: data?.skills?.join(', ') || '',
    },
  });

  // Update profile
  const { mutate: saveProfile, isPending: saving } = useUpdateProfile(username);

  const handleSaveProfile = (formData) => {
    saveProfile(formData, {
      onSuccess: (updatedUser) => {
        updateUser(updatedUser);
        setEditing(false);
      },
    });
  };

  // Upload avatar
  const { mutate: uploadAvatar, isPending: uploadingAvatar } = useUploadAvatar(username);

  const handleUploadAvatar = (file) => {
    uploadAvatar(file, {
      onSuccess: (avatarUrl) => {
        updateUser({ avatar: avatarUrl });
      },
    });
  };

  // Remove avatar
  const { mutate: removeAvatar, isPending: removingAvatar } = useRemoveAvatar(username);

  const handleRemoveAvatar = () => {
    removeAvatar(undefined, {
      onSuccess: () => {
        updateUser({ avatar: '' });
      },
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="card p-12 text-center">
          <h2 className="text-xl font-bold">User not found</h2>
        </div>
      </AppLayout>
    );
  }

  const posts = postsData?.posts || [];

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Profile card */}
        <div className="w-full lg:w-72 flex-shrink-0">
          {isOwnProfile ? (
            <div className="card p-6">
              {/* Avatar with upload */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar
                    src={currentUser?.avatar}
                    name={currentUser?.name}
                    size="2xl"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-8 h-8 bg-indigo-600 rounded-full 
                               flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg"
                    title="Change avatar"
                    id="change-avatar"
                  >
                    {uploadingAvatar ? <Spinner size="sm" /> : <Camera size={14} className="text-white" />}
                  </button>
                  {currentUser?.avatar && (
                    <button
                      onClick={() => handleRemoveAvatar()}
                      className="absolute top-1 right-1 w-8 h-8 bg-red-600/90 rounded-full 
                                 flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
                      title="Remove avatar"
                      id="remove-avatar"
                      type="button"
                    >
                      {removingAvatar ? <Spinner size="sm" /> : <X size={14} className="text-white" />}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && handleUploadAvatar(e.target.files[0])}
                  />
                </div>

                {editing ? (
                  <form onSubmit={handleSubmit(handleSaveProfile)} className="w-full space-y-4 text-left mt-4">
                    <Input label="Name" error={errors.name?.message} {...register('name')} />
                    <Input
                      label="Email (cannot be changed)"
                      value={currentUser?.email || data?.email || ''}
                      disabled
                      className="bg-opacity-50 cursor-not-allowed opacity-60"
                    />
                    <Textarea label="Bio" rows={3} error={errors.bio?.message} {...register('bio')} />
                    <Input label="Skills (comma-separated)" placeholder="react, node, python" {...register('skills')} />
                    <Input label="GitHub URL" placeholder="https://github.com/..." {...register('githubUrl')} />
                    <Input label="Portfolio URL" placeholder="https://yoursite.com" {...register('portfolioUrl')} />
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" size="sm" isLoading={saving} leftIcon={<Check size={14} />}>
                        Save
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}
                        leftIcon={<X size={14} />}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mt-2">{data.name}</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">@{data.username}</p>
                    {data.bio && <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">{data.bio}</p>}

                    {/* Follower stats */}
                    <div className="flex items-center gap-6 mt-4 py-3 border-t border-b border-[var(--color-border)] w-full justify-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-[var(--color-text-primary)]">{data.followers?.length ?? 0}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">Followers</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-[var(--color-text-primary)]">{data.following?.length ?? 0}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">Following</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-[var(--color-text-primary)]">{postsData?.pagination?.total ?? 0}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">Posts</span>
                      </div>
                    </div>

                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                        {data.skills.map((skill) => (
                          <span key={skill} className="badge badge-brand">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    {(data.githubUrl || data.portfolioUrl) && (
                      <div className="flex items-center gap-3 mt-4">
                        {data.githubUrl && (
                          <a href={data.githubUrl} target="_blank" rel="noopener noreferrer"
                            className="btn-ghost p-2 rounded-lg text-sm" title="GitHub">
                            GitHub ↗
                          </a>
                        )}
                        {data.portfolioUrl && (
                          <a href={data.portfolioUrl} target="_blank" rel="noopener noreferrer"
                            className="btn-ghost p-2 rounded-lg text-sm" title="Portfolio">
                            Portfolio ↗
                          </a>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => setEditing(true)}
                      className="btn-secondary text-sm mt-4 w-full justify-center"
                      id="edit-profile"
                    >
                      <Edit2 size={14} /> Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <ProfileCard user={data} postCount={postsData?.pagination?.total || 0} />
          )}
        </div>

        {/* Right: Posts */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Posts ({postsData?.pagination?.total || 0})
            </h2>
            {isOwnProfile && (
              <Link to="/create" className="btn-primary text-sm">
                + New Post
              </Link>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-[var(--color-text-muted)]">
                {isOwnProfile ? 'You haven\'t published any posts yet.' : `${data.name} hasn't posted yet.`}
              </p>
              {isOwnProfile && (
                <Link to="/create" className="btn-primary inline-flex mt-4">
                  Write your first post
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => <PostCard key={post._id} post={post} />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
