import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ScreenShareView = ({ stream, userName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-6xl max-h-full p-4">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
            <p className="text-sm">
              {userName} is sharing their screen
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg transition duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Screen Share Video */}
        <video
          autoPlay
          playsInline
          className="w-full h-full object-contain"
          ref={(video) => {
            if (video && stream) {
              video.srcObject = stream;
            }
          }}
        />
      </div>
    </div>
  );
};

export default ScreenShareView;
