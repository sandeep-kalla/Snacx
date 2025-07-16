import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    // Use environment variables for Firebase Admin SDK initialization
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin SDK environment variables are missing');
    }

    const serviceAccount = {
      projectId,
      clientEmail,
      privateKey
    };

    initializeApp({
      credential: cert(serviceAccount),
    });
    
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

// Initialize Firestore only if Firebase is initialized
let adminDb: any;
try {
  adminDb = getFirestore();
} catch (error) {
  console.error('Failed to initialize Firestore:', error);
}

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin was initialized
    if (!getApps().length) {
      return NextResponse.json(
        { error: 'Server configuration error. Firebase Admin not initialized.' }, 
        { status: 500 }
      );
    }
    
    // Get the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { publicId } = body;
    
    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }
    
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' }, 
        { status: 401 }
      );
    }
    
    const uid = decodedToken.uid;

    // Cloudinary API for deletion
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary configuration');
      return NextResponse.json(
        { error: 'Cloudinary configuration missing' }, 
        { status: 500 }
      );
    }

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    formData.append('timestamp', timestamp.toString());
    
    // Generate signature
    const crypto = require('crypto');
    const signature = crypto.createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest('hex');
    formData.append('signature', signature);

    // Call Cloudinary API
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await cloudinaryResponse.json();
    
    if (result.result !== 'ok') {
      console.error('Cloudinary deletion failed:', result);
      throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Cloudinary delete API:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}