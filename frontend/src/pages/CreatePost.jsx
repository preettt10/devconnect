// src/pages/CreatePost.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, ImagePlus, X, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AppLayout from '../components/layout/AppLayout.jsx';
import Input from '../components/ui/Input.jsx';
import { Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { useCreatePost } from '../hooks/usePosts.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  tagInput: z.string().optional(),
});

const CreatePost = () => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(false);
  const [tags, setTags] = useState([]);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const { mutate: createPost, isPending } = useCreatePost();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const contentValue = watch('content', '');
  const tagInputValue = watch('tagInput', '');

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInputValue.trim()) {
      e.preventDefault();
      const tag = tagInputValue.trim().toLowerCase().replace(/^#/, '');
      if (!tags.includes(tag) && tags.length < 5) {
        setTags((prev) => [...prev, tag]);
      }
      setValue('tagInput', '');
    }
  };

  const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const onSubmit = async ({ title, content }) => {
    createPost(
      { title, content, tags },
      {
        onSuccess: async (post) => {
          // Upload cover image if selected
          if (coverFile) {
            setUploadingCover(true);
            const formData = new FormData();
            formData.append('cover', coverFile);
            try {
              await api.post(`/posts/${post._id}/cover`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
            } catch {
              toast.error('Post created but cover upload failed');
            } finally {
              setUploadingCover(false);
            }
          }
          navigate(`/posts/${post._id}`);
        },
      }
    );
  };

  return (
    <AppLayout sidebar={false}>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">New Post</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              className={`btn-ghost text-sm ${preview ? 'text-indigo-400' : ''}`}
              id="toggle-preview"
            >
              {preview ? <><Edit size={15} /> Edit</> : <><Eye size={15} /> Preview</>}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Cover image */}
          <div className="card overflow-hidden">
            {coverPreview ? (
              <div className="relative">
                <img src={coverPreview} alt="Cover" className="w-full h-52 object-cover" />
                <button
                  type="button"
                  onClick={() => { setCoverPreview(null); setCoverFile(null); }}
                  className="absolute top-3 right-3 bg-black/50 rounded-lg p-1.5 hover:bg-black/70 transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 cursor-pointer 
                               hover:bg-[var(--color-bg-elevated)] transition-colors group">
                <ImagePlus size={28} className="text-[var(--color-text-muted)] group-hover:text-indigo-400 transition-colors mb-2" />
                <span className="text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                  Add a cover image
                </span>
                <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" id="cover-upload" />
              </label>
            )}
          </div>

          {/* Title */}
          <Input
            placeholder="Post title..."
            id="post-title"
            className="text-2xl font-bold h-auto py-4 bg-transparent border-none focus:ring-0 
                       text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Tags */}
          <div className="card p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={15} className="text-[var(--color-text-muted)]" />
              {tags.map((tag) => (
                <Badge key={tag} variant="brand" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  #{tag} <X size={10} className="ml-1" />
                </Badge>
              ))}
              {tags.length < 5 && (
                <input
                  type="text"
                  placeholder="Add tags (press Enter)..."
                  className="bg-transparent text-sm text-[var(--color-text-secondary)] 
                             placeholder-[var(--color-text-muted)] outline-none flex-1 min-w-32"
                  {...register('tagInput')}
                  onKeyDown={addTag}
                  id="tag-input"
                />
              )}
            </div>
          </div>

          {/* Content / Preview */}
          {preview ? (
            <div className="card p-8 prose-devconnect min-h-64">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {contentValue || '*Nothing to preview yet...*'}
              </ReactMarkdown>
            </div>
          ) : (
            <Textarea
              placeholder="Write your post in Markdown..."
              id="post-content"
              rows={20}
              className="font-mono text-sm"
              error={errors.content?.message}
              {...register('content')}
            />
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isPending || uploadingCover}
              id="publish-post"
            >
              Publish Post
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default CreatePost;
