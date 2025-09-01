import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AvatarProps {
  url: string | null
  size: number
  onUpload: (path: string) => void
  alt?: string
}

export default function Avatar({ url, size, onUpload, alt = "User avatar" }: AvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (url) downloadImage(url)
  }, [url])

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path)
      if (error) {
        throw error
      }
      const url = URL.createObjectURL(data)
      setAvatarUrl(url)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error downloading image: ', error.message)
      }
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      onUpload(filePath)
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="avatar-container">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={alt}
          className="avatar-image rounded-full object-cover"
          style={{ height: size, width: size }}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className="avatar-placeholder rounded-full bg-gray-200 flex items-center justify-center"
          style={{ height: size, width: size }}
          role="img"
          aria-label="No avatar uploaded"
        >
          <svg
            className="w-6 h-6 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
      <div className="mt-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={uploading}
          aria-describedby="upload-description"
        >
          <label htmlFor="avatar-upload" className="cursor-pointer">
            {uploading ? 'Uploading...' : 'Upload Avatar'}
          </label>
        </Button>
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="sr-only"
          aria-describedby="upload-description"
        />
        <div id="upload-description" className="sr-only">
          Select an image file to upload as your avatar
        </div>
      </div>
    </div>
  )
}