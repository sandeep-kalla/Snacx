import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Return the necessary configuration for next-cloudinary
    return NextResponse.json({
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    });
  } catch (error) {
    console.error('Error getting upload configuration:', error);
    return NextResponse.json(
      { error: 'Error getting upload configuration' },
      { status: 500 }
    );
  }
}