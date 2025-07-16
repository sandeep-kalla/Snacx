"use client";

import { CldUploadWidget } from "next-cloudinary";

interface CloudinaryUploaderProps {
  onUploadSuccess: (url: string, publicId: string) => void;
  onUploadError?: (error: unknown) => void;
}

// Define minimal type for Cloudinary info
interface CloudinaryInfo {
  secure_url?: string;
  public_id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export default function CloudinaryUploader({
  onUploadSuccess,
  onUploadError,
}: CloudinaryUploaderProps) {
  return (
    <CldUploadWidget
      uploadPreset="meme-preset"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess={(results: any) => {
        // Type guard to ensure info has the expected structure
        if (results?.info && typeof results.info !== 'string') {
          const info = results.info as CloudinaryInfo;
          if (info.secure_url && info.public_id) {
            onUploadSuccess(info.secure_url, info.public_id);
          }
        }
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError={(error: any) => {
        console.error("Upload error:", error);
        if (onUploadError) onUploadError(error);
      }}
      options={{
        maxFiles: 1,
        resourceType: "image",
        clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
        maxFileSize: 10000000, // 10MB for memes
        folder: "memes",
        sources: ["local", "url", "camera"],
        styles: {
          palette: {
            window: "#171b23",
            windowBorder: "#1e2433",
            tabIcon: "#8b5cf6",
            menuIcons: "#a78bfa",
            textDark: "#FFFFFF",
            textLight: "#FFFFFF",
            link: "#8b5cf6",
            action: "#8b5cf6",
            inactiveTabIcon: "#7c3aed",
            error: "#ef4444",
            inProgress: "#8b5cf6",
            complete: "#22c55e",
            sourceBg: "#1e2433",
          },
        },
      }}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className="w-full bg-[#8b5cf6]/90 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#8b5cf6] transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/50 border border-[#8b5cf6]/30 text-sm sm:text-base"
        >
          Upload Image
        </button>
      )}
    </CldUploadWidget>
  );
}
