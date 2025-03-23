import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const HandDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  const lessons = [
    { id: 'thumbs-up', gesture: 'Thumbs Up 👍', meaning: 'Good Job', hint: 'Extend your thumb upward with other fingers curled' },
    { id: 'thumbs-down', gesture: 'Thumbs Down 👎', meaning: 'Disapproval', hint: 'Extend your thumb downward with other fingers curled' },
    { id: 'peace-sign', gesture: 'Peace Sign ✌️', meaning: 'Victory/Peace', hint: 'Extend your index and middle fingers while keeping others curled' },
    { id: 'fist', gesture: 'Fist ✊', meaning: 'Strength/Solidarity', hint: 'Curl all fingers into a fist' },
    { id: 'pointing', gesture: 'Pointing 👆', meaning: 'Direction/Attention', hint: 'Extend only your index finger upward' },
    { id: 'open-hand', gesture: 'Open Hand 🖐️', meaning: 'Hello/Stop', hint: 'Extend all fingers with palm facing forward' },
    { id: 'pinky-promise', gesture: 'Pinky Promise 🤙', meaning: 'Promise', hint: 'Extend your pinky and thumb, keeping other fingers curled' },
    { id: 'ok-sign', gesture: 'OK Sign 👌', meaning: 'OK/Perfect', hint: 'Form a circle with your thumb and index finger, extending other fingers' },
    { id: 'rock-on', gesture: 'Rock On 🤘', meaning: 'Rock Music', hint: 'Extend your index and pinky fingers while curling others' },
    { id: 'call-me', gesture: 'Call Me 🤙', meaning: 'Call Me', hint: 'Extend your thumb and pinky while curling others' },
    { id: 'i-love-you', gesture: 'I Love You 🤟', meaning: 'I Love You', hint: 'Extend your thumb, index, and pinky while curling others' },
  ];

  const currentLesson = lessons[lessonIndex];

  // Helper function to calculate distance between landmarks
  const distance = (a, b) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
  };

  // Helper function to check if a finger is extended
  const isFingerExtended = useCallback((tipIdx, midIdx, baseIdx, landmarks) => {
    const tipToBase = distance(landmarks[tipIdx], landmarks[baseIdx]);
    const midToBase = distance(landmarks[midIdx], landmarks[baseIdx]);
    return tipToBase > midToBase * 1.2;
  }, []);

  // Improved gesture detection logic
  const detectGesture = useCallback((landmarks) => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const wrist = landmarks[0];

    const isThumbExtended = thumbTip.y < wrist.y;
    const isIndexExtended = isFingerExtended(8, 6, 5, landmarks);
    const isMiddleExtended = isFingerExtended(12, 10, 9, landmarks);
    const isRingExtended = isFingerExtended(16, 14, 13, landmarks);
    const isPinkyExtended = isFingerExtended(20, 18, 17, landmarks);

    // Thumbs Up 👍
    if (isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'Thumbs Up 👍';
    }

    // Thumbs Down 👎
    if (!isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended && thumbTip.y > wrist.y) {
      return 'Thumbs Down 👎';
    }

    // Peace Sign ✌️
    if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'Peace Sign ✌️';
    }

    // Fist ✊
    if (!isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'Fist ✊';
    }

    // Pointing 👆
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'Pointing 👆';
    }

    // Open Hand 🖐️
    if (isThumbExtended && isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      return 'Open Hand 🖐️';
    }

    // Pinky Promise 🤙
    if (isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended) {
      return 'Pinky Promise 🤙';
    }

    // OK Sign 👌
    if (distance(thumbTip, indexTip) < 0.1 && isMiddleExtended && isRingExtended && isPinkyExtended) {
      return 'OK Sign 👌';
    }

    // Rock On 🤘
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended) {
      return 'Rock On 🤘';
    }

    // Call Me 🤙
    if (isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended) {
      return 'Call Me 🤙';
    }

    // I Love You 🤟
    if (isThumbExtended && isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended) {
      return 'I Love You 🤟';
    }

    return 'No Gesture Detected';
  }, [isFingerExtended]);

  // Process results from MediaPipe Hands
  const processResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (videoRef.current) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
    }

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { 
          color: '#8B5CF6', 
          lineWidth: 3 
        });
        drawLandmarks(ctx, landmarks, { 
          color: '#F97316', 
          radius: 5,
          fillColor: '#ffffff'
        });

        const detectedGesture = detectGesture(landmarks);
        setGesture(detectedGesture);

        setTotalAttempts(prev => prev + 1);

        if (detectedGesture === currentLesson.gesture) {
          setFeedback('Correct! Great job! 🎉');
          setCorrectCount(prev => prev + 1);
        } else if (detectedGesture !== 'No Gesture Detected') {
          setFeedback(`That's the "${detectedGesture}" gesture. Try for "${currentLesson.gesture}"`);
        } else {
          setFeedback('Gesture not recognized. Try again!');
        }
      }
    } else {
      setGesture('No Hand Detected');
      setFeedback('Position your hand in the camera view');
    }

    ctx.restore();
  }, [currentLesson.gesture, detectGesture]);

  // Initialize MediaPipe Hands
  const initializeHands = useCallback(() => {
    handsRef.current = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsRef.current.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    handsRef.current.onResults(processResults);
  }, [processResults]);

  // Start camera
  const startCamera = useCallback(() => {
    if (videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          videoRef.current.srcObject = stream;

          cameraRef.current = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });

          cameraRef.current.start();
        })
        .catch(error => {
          console.error("Camera permission error:", error);
          setFeedback("Camera permission denied. Please allow camera access.");
          setCameraActive(false);
        });
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    setCameraActive(prev => !prev);
    setFeedback('');
  }, []);

  // Initialize camera and MediaPipe Hands when component mounts or cameraActive changes
  useEffect(() => {
    if (cameraActive) {
      initializeHands();
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [cameraActive, initializeHands, startCamera, stopCamera]);

  // Next lesson
  const nextLesson = () => {
    setLessonIndex((prevIndex) => (prevIndex + 1) % lessons.length);
    setFeedback('');
    setShowHint(false);
  };

  // Previous lesson
  const prevLesson = () => {
    setLessonIndex((prevIndex) => (prevIndex - 1 + lessons.length) % lessons.length);
    setFeedback('');
    setShowHint(false);
  };

  // Toggle hint
  const toggleHint = () => {
    setShowHint(prev => !prev);
  };

  // Calculate accuracy
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  // Feedback color class
  const getFeedbackColorClass = () => {
    if (feedback.includes('Correct')) return 'text-emerald-500';
    if (feedback.includes('not recognized') || feedback.includes('That\'s the')) return 'text-amber-500';
    return 'text-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Main Content */}
        <div className="p-6">
          {/* Lesson Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between bg-indigo-50 rounded-xl p-4">
            <div>
              <h2 className="text-2xl font-bold text-indigo-700 mb-1 flex items-center">
                <span className="text-3xl mr-2">{currentLesson.gesture.split(' ')[1]}</span>
                <span>{currentLesson.gesture.split(' ')[0]}</span>
              </h2>
              <p className="text-indigo-600">Meaning: <span className="font-medium">{currentLesson.meaning}</span></p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-2">
              <button 
                onClick={toggleHint}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                  showHint 
                    ? 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300' 
                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
              >
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
              <button 
                onClick={toggleCamera}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                  cameraActive 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {cameraActive ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>
          </div>
          
          {/* Hint Box */}
          {showHint && (
            <div className="bg-amber-50 p-4 rounded-xl mb-6 border-l-4 border-amber-400 flex items-start">
              <div className="text-amber-500 text-xl mr-3">💡</div>
              <p className="text-amber-800">{currentLesson.hint}</p>
            </div>
          )}
          
          {/* Camera and Canvas View */}
<div className="camera-canvas-container">
  {/* Video Feed */}
  <div className="video-container">
    {!cameraActive && (
      <div className="camera-placeholder">
        <div className="text-5xl mb-4">📷</div>
        <h3 className="text-xl font-medium mb-2">Camera Access Required</h3>
        <p className="text-gray-300 mb-4">Click "Start Camera" to begin practicing hand gestures</p>
        <button 
          onClick={toggleCamera}
          className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
        >
          Start Camera
        </button>
      </div>
    )}
    <video
      ref={videoRef}
      className="w-full h-full"
      autoPlay
      playsInline
    />
  </div>

  {/* Canvas Feed */}
  <div className="canvas-container">
    <canvas
      ref={canvasRef}
      width="640"
      height="480"
      className="w-full"
    />
  </div>
</div>
          
          {/* Stats Section */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Detected Gesture */}
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Detected Gesture</h3>
              <div className="text-2xl font-bold flex items-center">
                {gesture === 'No Hand Detected' ? (
                  <span className="text-red-500">No Hand Detected</span>
                ) : gesture === 'No Gesture Detected' ? (
                  <span className="text-amber-500">No Gesture Detected</span>
                ) : (
                  <span className="text-indigo-600">{gesture || 'None'}</span>
                )}
              </div>
            </div>
            
            {/* Feedback */}
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Feedback</h3>
              <p className={`text-lg font-medium ${getFeedbackColorClass()}`}>
                {feedback || 'Make a gesture to get feedback'}
              </p>
              {feedback.includes('Correct') && (
                <div className="mt-2 text-2xl animate-pulse">🎉</div>
              )}
            </div>
            
            
          </div>
          
          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
            <button
              onClick={prevLesson}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center"
            >
              <span className="mr-2">←</span>
              <span>Previous Lesson</span>
            </button>
            
            <button
              onClick={nextLesson}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 transition flex items-center justify-center"
            >
              <span>Next Lesson</span>
              <span className="ml-2">→</span>
            </button>
          </div>
          
          {/* Gesture Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-3 text-gray-700">Available Gestures</h3>
            <div className="flex flex-wrap gap-2">
              {lessons.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setLessonIndex(idx)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    idx === lessonIndex 
                      ? 'bg-indigo-600 text-white shadow-md scale-105' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {item.gesture}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandDetection;