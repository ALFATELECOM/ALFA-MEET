import React, { useEffect, useState } from 'react';
import { useReactions } from '../context/ReactionsContext';

const FloatingReaction = ({ reaction, onComplete }) => {
  const [position, setPosition] = useState({ x: reaction.x, y: reaction.y });
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        onComplete(reaction.id);
        return;
      }

      // Animate upward movement
      setPosition(prev => ({
        x: prev.x + (Math.random() - 0.5) * 2, // Slight horizontal drift
        y: prev.y - progress * 50 // Move up
      }));

      // Fade out and scale
      setOpacity(1 - progress);
      setScale(1 + progress * 0.5);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [reaction.id, onComplete]);

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div className="text-4xl animate-bounce">
        {reaction.emoji}
      </div>
      {reaction.userName && (
        <div className="text-xs text-white bg-black bg-opacity-50 rounded px-2 py-1 mt-1 text-center">
          {reaction.userName}
        </div>
      )}
    </div>
  );
};

const FloatingReactions = () => {
  const { activeReactions } = useReactions();
  const [displayReactions, setDisplayReactions] = useState([]);

  useEffect(() => {
    setDisplayReactions(activeReactions);
  }, [activeReactions]);

  const handleReactionComplete = (reactionId) => {
    setDisplayReactions(prev => prev.filter(r => r.id !== reactionId));
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {displayReactions.map((reaction) => (
        <FloatingReaction
          key={reaction.id}
          reaction={reaction}
          onComplete={handleReactionComplete}
        />
      ))}
    </div>
  );
};

export default FloatingReactions;
