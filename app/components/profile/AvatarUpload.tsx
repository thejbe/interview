"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AvatarUploadProps {
    uid: string;
    url: string | null;
    size?: number;
    onUploadComplete?: () => void;
}

export default function AvatarUpload({ uid, url, size = 150, onUploadComplete }: AvatarUploadProps) {
    const supabase = createClient();
    const router = useRouter();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(url);
    const [uploading, setUploading] = useState(false);

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${uid}/${Math.random()}.${fileExt}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);


            // 3. Update Profile
            const { error: updateError } = await supabase
                .from('recruiters')
                .update({ avatar_url: publicUrl })
                .eq('auth_user_id', uid);

            if (updateError) {
                throw updateError;
            }

            setAvatarUrl(publicUrl);
            router.refresh(); // Refresh page to update other components if needed
            if (onUploadComplete) onUploadComplete();
            toast.error('Error uploading avatar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group">
            <div
                className="bg-center bg-no-repeat bg-cover rounded-full border-4 border-white dark:border-[#1C1C1C] shadow-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-white/10"
                style={{
                    width: size,
                    height: size,
                    backgroundImage: avatarUrl ? `url("${avatarUrl}")` : 'none'
                }}
            >
                {!avatarUrl && <span className="material-symbols-outlined text-4xl text-gray-400">person</span>}

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="material-symbols-outlined text-white animate-spin">progress_activity</span>
                    </div>
                )}
            </div>

            <label className="absolute bottom-0 right-0 p-2 bg-primary text-[#142210] rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95" htmlFor="single">
                <span className="material-symbols-outlined text-xl">photo_camera</span>
                <input
                    style={{
                        visibility: 'hidden',
                        position: 'absolute',
                    }}
                    type="file"
                    id="single"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                />
            </label>
        </div>
    );
}
