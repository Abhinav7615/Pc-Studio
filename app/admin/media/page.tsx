'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

interface UploadedFile {
  _id: string;
  filename: string;
  length: number;
  contentType: string;
  uploadDate: string;
  metadata?: {
    originalName?: string;
    contentType?: string;
  };
  url?: string;
}

export default function MediaManager() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/upload/list');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/admin/login';
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.role === 'admin' || session?.user?.role === 'staff') {
      fetchFiles();
    }
  }, [session, fetchFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Only image and video files are allowed');
      return;
    }

    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Max ${file.type.startsWith('video/') ? '100MB' : '5MB'} allowed`);
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('originalName', file.name);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        setUploading(false);
        setUploadProgress(0);
        
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setSuccess(`File "${file.name}" uploaded successfully!`);
          fetchFiles();
          
          // Copy URL to clipboard
          if (response.url) {
            navigator.clipboard.writeText(response.url);
            setTimeout(() => setSuccess(`File uploaded! URL copied to clipboard: ${response.url}`), 1000);
          }
        } else {
          const errorData = JSON.parse(xhr.responseText);
          setError(errorData.error || 'Upload failed');
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setUploadProgress(0);
        setError('Network error during upload');
      };

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      setError('Failed to upload file');
    }
  };

  const deleteFile = async (file: UploadedFile) => {
    if (!confirm(`Are you sure you want to delete "${file.metadata?.originalName || file.filename}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/upload?file=${encodeURIComponent(file.filename)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess('File deleted successfully');
        fetchFiles();
        setSelectedFile(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete file');
      }
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccess('URL copied to clipboard!');
  };

  const getFileUrl = (filename: string) => {
    return `/api/upload?file=${encodeURIComponent(filename)}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredFiles = files.filter((file) => {
    if (filterType === 'all') return true;
    if (filterType === 'image') return file.contentType?.startsWith('image/');
    if (filterType === 'video') return file.contentType?.startsWith('video/');
    return true;
  });

  const onCropComplete = useCallback((croppedArea: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (selectedFile && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(
          getFileUrl(selectedFile.filename),
          croppedAreaPixels
        );
        
        // Convert base64 to blob and upload
        const response = await fetch(croppedImage);
        const blob = await response.blob();
        const file = new File([blob], `cropped_${selectedFile.metadata?.originalName || selectedFile.filename}`, {
          type: 'image/jpeg'
        });
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('originalName', `cropped_${selectedFile.metadata?.originalName || selectedFile.filename}`);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          setSuccess(`Image cropped and saved! URL: ${data.url}`);
          fetchFiles();
          setIsCropping(false);
          setSelectedFile(null);
        } else {
          setError('Failed to save cropped image');
        }
      } catch (err) {
        console.error('Crop error:', err);
        setError('Failed to crop image');
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading media...</p>
        </div>
      </div>
    );
  }

  if (!session || (session.user?.role !== 'admin' && session.user?.role !== 'staff')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-gradient-to-r from-blue-50 via-white to-blue-50">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-2 text-slate-900">🖼️ Media Library</h1>
          <p className="text-slate-600">Upload and manage your website images and videos</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-700 font-semibold">{success}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">➕ Upload Media</h2>
              <p className="text-sm text-gray-500">Images: 5MB max • Videos: 100MB max</p>
            </div>
            
            <div className="flex gap-2">
              <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
                <span>➕</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Quick Tips */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Tips:</strong> After uploading, copy the file URL and paste it into the Brand Settings fields in 
              <a href="/admin/settings" className="underline font-semibold"> Settings → Customization</a>.
            </p>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({files.length})
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'image'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🖼️
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎥
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Grid View"
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="List View"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Files Display */}
        {filteredFiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No media files found</h3>
            <p className="text-gray-500">Upload your first file using the upload section above.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file._id}
                className="relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition cursor-pointer group"
                onClick={() => setSelectedFile(file)}
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {file.contentType?.startsWith('image/') ? (
                    <img
                      src={getFileUrl(file.filename)}
                      alt={file.metadata?.originalName || file.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+Preview';
                      }}
                    />
                  ) : file.contentType?.startsWith('video/') ? (
                    <div className="text-center">
                      <div className="text-4xl">🎥</div>
                      <p className="text-xs text-gray-500 mt-2">Video</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl">📄</div>
                      <p className="text-xs text-gray-500 mt-2">File</p>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate" title={file.metadata?.originalName || file.filename}>
                    {file.metadata?.originalName || file.filename}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.length)}</p>
                </div>
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(getFileUrl(file.filename));
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Copy URL"
                  >
                    {/* SVG Copy Icon (Heroicons) */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6.75A2.25 2.25 0 0014.25 4.5h-6A2.25 2.25 0 006 6.75v10.5A2.25 2.25 0 008.25 19.5h6a2.25 2.25 0 002.25-2.25v-1.5M9.75 15.75h6A2.25 2.25 0 0018 13.5v-6A2.25 2.25 0 0015.75 5.25h-6A2.25 2.25 0 007.5 7.5v6a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Preview</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">File Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Size</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Uploaded</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <tr key={file._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {file.contentType?.startsWith('image/') ? (
                          <img
                            src={getFileUrl(file.filename)}
                            alt={file.metadata?.originalName || file.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">📄</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                        {file.metadata?.originalName || file.filename}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{file.contentType || 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{formatFileSize(file.length)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">{formatDate(file.uploadDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(getFileUrl(file.filename))}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => deleteFile(file)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* File Detail Modal */}
        {selectedFile && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-10 p-4" onClick={() => setSelectedFile(null)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">File Details</h3>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Preview */}
                <div className="bg-gray-100 rounded-lg flex items-center justify-center mb-4" style={{ minHeight: '300px' }}>
                  {selectedFile.contentType?.startsWith('image/') ? (
                    <img
                      src={getFileUrl(selectedFile.filename)}
                      alt={selectedFile.metadata?.originalName || selectedFile.filename}
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  ) : selectedFile.contentType?.startsWith('video/') ? (
                    <video
                      src={getFileUrl(selectedFile.filename)}
                      controls
                      className="max-w-full max-h-[400px]"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-gray-500">Preview not available</p>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Name:</span>
                    <span className="font-semibold text-gray-900">{selectedFile.metadata?.originalName || selectedFile.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold text-gray-900">{selectedFile.contentType || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-semibold text-gray-900">{formatFileSize(selectedFile.length)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uploaded:</span>
                    <span className="font-semibold text-gray-900">{formatDate(selectedFile.uploadDate)}</span>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-1">File URL:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getFileUrl(selectedFile.filename)}
                        className="flex-1 border-2 border-gray-300 p-2 rounded-lg text-sm bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(getFileUrl(selectedFile.filename))}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    onClick={() => setIsCropping(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                  >
                    ✂️ Crop Image
                  </button>
                  <button
                    onClick={() => deleteFile(selectedFile)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                  >
                    🗑️ Delete File
                  </button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isCropping && selectedFile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-4">Crop Image</h3>
              <div className="relative w-96 h-96">
                <Cropper
                  image={getFileUrl(selectedFile.filename)}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setIsCropping(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}