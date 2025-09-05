import React from 'react';
import { useMeetingFeatures } from '../context/MeetingFeaturesContext';
import { HandRaisedIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const RaiseHandIndicator = ({ isHost = false }) => {
  const { raisedHands, acknowledgeHand, lowerHand } = useMeetingFeatures();

  if (raisedHands.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-40">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center space-x-2">
          <HandRaisedIcon className="h-4 w-4 text-yellow-600" />
          <span>Raised Hands ({raisedHands.length})</span>
        </h3>
      </div>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {raisedHands.map((hand) => (
          <div
            key={hand.id}
            className={`flex items-center justify-between p-2 rounded-lg ${
              hand.acknowledged ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <HandRaisedIcon className={`h-4 w-4 ${hand.acknowledged ? 'text-green-600' : 'text-yellow-600'}`} />
              <span className="text-sm font-medium text-gray-800">{hand.userName}</span>
              {hand.acknowledged && (
                <CheckIcon className="h-3 w-3 text-green-600" />
              )}
            </div>
            
            {isHost && (
              <div className="flex items-center space-x-1">
                {!hand.acknowledged && (
                  <button
                    onClick={() => acknowledgeHand(hand.id)}
                    className="p-1 hover:bg-green-100 rounded transition duration-200"
                    title="Acknowledge"
                  >
                    <CheckIcon className="h-3 w-3 text-green-600" />
                  </button>
                )}
                <button
                  onClick={() => lowerHand(hand.userId)}
                  className="p-1 hover:bg-red-100 rounded transition duration-200"
                  title="Lower hand"
                >
                  <XMarkIcon className="h-3 w-3 text-red-600" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {isHost && raisedHands.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => raisedHands.forEach(hand => lowerHand(hand.userId))}
            className="w-full text-xs text-gray-600 hover:text-gray-800 transition duration-200"
          >
            Lower all hands
          </button>
        </div>
      )}
    </div>
  );
};

export default RaiseHandIndicator;
