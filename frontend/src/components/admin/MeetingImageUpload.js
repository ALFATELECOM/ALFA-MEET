import React, { useState, useRef } from 'react';
import {
  PhotoIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const MeetingImageUpload = ({ meeting, onImageUpdate }) => {
  const [selectedImage, setSelectedImage] = useState(meeting?.meetingImage || null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = {
        url: e.target.result,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };

      setSelectedImage(imageData);
      onImageUpdate?.(imageData);
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    onImageUpdate?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const predefinedImages = [
    {
      id: 'business-1',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzNyIvPgo8L3N2Zz4K',
      name: 'Business Meeting'
    },
    {
      id: 'webinar-1',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNEY0NkU1Ii8+Cjwvc3ZnPgo=',
      name: 'Webinar'
    },
    {
      id: 'team-1',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMTBCOTgxIi8+Cjwvc3ZnPgo=',
      name: 'Team Meeting'
    },
    {
      id: 'training-1',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjU5RTBCIi8+Cjwvc3ZnPgo=',
      name: 'Training Session'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Meeting Image & Branding</h3>

      {/* Current Image Display */}
      {selectedImage && (
        <div className="mb-6">
          <div className="relative inline-block">
            <img
              src={selectedImage.url}
              alt="Meeting"
              className="w-32 h-32 object-cover rounded-lg shadow-md"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition duration-200"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-900">{selectedImage.name}</p>
            {selectedImage.size && (
              <p className="text-xs text-gray-500">
                {(selectedImage.size / 1024).toFixed(1)} KB • {selectedImage.type}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : selectedImage
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-blue-600">Uploading...</p>
          </div>
        ) : selectedImage ? (
          <div className="space-y-2">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto" />
            <p className="text-sm text-green-600 font-medium">Image uploaded successfully</p>
            <p className="text-xs text-gray-500">Drag a new image to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Predefined Images */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Select Templates</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {predefinedImages.map((image) => (
            <button
              key={image.id}
              onClick={() => {
                const imageData = {
                  url: image.url,
                  name: image.name,
                  type: 'template',
                  uploadedAt: new Date().toISOString()
                };
                setSelectedImage(imageData);
                onImageUpdate?.(imageData);
              }}
              className={`relative group rounded-lg overflow-hidden border-2 transition duration-200 ${
                selectedImage?.id === image.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-20 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-200"></div>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                <p className="text-xs font-medium truncate">{image.name}</p>
              </div>
              {selectedImage?.id === image.id && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Image Guidelines */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-medium text-blue-900">Image Guidelines</h5>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Recommended size: 400x400px or larger</li>
              <li>• Supported formats: PNG, JPG, GIF</li>
              <li>• Maximum file size: 5MB</li>
              <li>• Image will be displayed in meeting lobby and invitations</li>
              <li>• Use professional, brand-appropriate images</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingImageUpload;

