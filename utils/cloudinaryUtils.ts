// Delete an image from Cloudinary using their API
export async function deleteCloudinaryImage(publicId: string): Promise<boolean> {
  try {
    // Get the current user's ID token for authentication
    const auth = await import('firebase/auth').then(mod => mod.getAuth());
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get the ID token
    const idToken = await currentUser.getIdToken();
    
    // We need to create a server endpoint to handle deletion securely
    // since we shouldn't expose API secret in client-side code
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        publicId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete image');
    }

    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error; // Re-throw the error so we can handle it in the component
  }
}