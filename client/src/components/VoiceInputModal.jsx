import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Volume2, Send, Loader } from 'lucide-react';
import { useAI } from '../contexts/AIContext';
import { useTask } from '../contexts/TaskContext';

function VoiceInputModal({ onClose }) {
  const { 
    voiceStatus, 
    voiceTranscript, 
    startVoiceRecording, 
    stopVoiceRecording, 
    processVoiceInput,
    extractedTasks,
    clearExtractedTasks,
    loading 
  } = useAI();
  
  const { createBulkTasks } = useTask();
  
  const [transcript, setTranscript] = useState('');
  const [showExtracted, setShowExtracted] = useState(false);

  // Clear extracted tasks when modal opens
  useEffect(() => {
    clearExtractedTasks();
    setShowExtracted(false);
    setTranscript('');
  }, []);

  useEffect(() => {
    setTranscript(voiceTranscript);
  }, [voiceTranscript]);

  useEffect(() => {
    if (extractedTasks.length > 0) {
      setShowExtracted(true);
    }
  }, [extractedTasks]);

  const handleStartRecording = () => {
    setTranscript('');
    clearExtractedTasks();
    setShowExtracted(false);
    startVoiceRecording();
  };

  const handleStopRecording = () => {
    stopVoiceRecording();
  };

  const handleClearAll = () => {
    setTranscript('');
    clearExtractedTasks();
    setShowExtracted(false);
  };

  const handleProcessVoice = async () => {
    if (!transcript.trim()) return;
    
    try {
      await processVoiceInput(transcript);
    } catch (error) {
      console.error('Voice processing failed:', error);
    }
  };

  const handleCreateTasks = async () => {
    if (extractedTasks.length === 0) return;
    
    try {
      await createBulkTasks(extractedTasks);
      onClose();
    } catch (error) {
      console.error('Failed to create tasks:', error);
    }
  };

  const handleTranscriptChange = (e) => {
    setTranscript(e.target.value);
  };

  const testSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Voice input is ready. You can start speaking now.');
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Voice Input</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Speak naturally to create multiple tasks. Say things like "Tomorrow dentist at 2pm, then grocery shopping"
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Voice Controls */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
              {voiceStatus === 'listening' ? (
                <button
                  onClick={handleStopRecording}
                  className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white voice-recording shadow-lg"
                >
                  <MicOff className="h-8 w-8" />
                </button>
              ) : (
                <button
                  onClick={handleStartRecording}
                  disabled={voiceStatus === 'unsupported'}
                  className="w-16 h-16 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 rounded-full flex items-center justify-center text-white shadow-lg"
                >
                  <Mic className="h-8 w-8" />
                </button>
              )}
              
              <button
                onClick={testSpeech}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600"
                title="Test audio"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            <div className="text-sm">
              {voiceStatus === 'listening' && (
                <p className="text-green-600 font-medium">🎤 Listening... Click to stop</p>
              )}
              {voiceStatus === 'processing' && (
                <p className="text-blue-600 font-medium">🤖 Processing speech...</p>
              )}
              {voiceStatus === 'idle' && (
                <p className="text-gray-600">Click the microphone to start recording</p>
              )}
              {voiceStatus === 'unsupported' && (
                <p className="text-red-600">Voice recognition not supported in this browser</p>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div>
            <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
              Speech Transcript
            </label>
            <textarea
              id="transcript"
              value={transcript}
              onChange={handleTranscriptChange}
              placeholder="Your speech will appear here, or type manually..."
              rows={4}
              className="textarea"
            />
          </div>

          {/* Process Button */}
          {transcript.trim() && !showExtracted && (
            <button
              onClick={handleProcessVoice}
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Processing with AI...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Send className="h-4 w-4 mr-2" />
                  Extract Tasks with AI
                </div>
              )}
            </button>
          )}

          {/* Extracted Tasks Preview */}
          {showExtracted && extractedTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Extracted Tasks ({extractedTasks.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {extractedTasks.map((task, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded ${
                            task.priority === 'High' ? 'bg-red-100 text-red-800' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {task.category}
                          </span>
                          {task.deadline && (
                            <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        AI: {Math.round((task.confidence_score || 0) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-2"
            >
              Cancel
            </button>
            
            {showExtracted && extractedTasks.length > 0 && (
              <>
                <button
                  onClick={handleClearAll}
                  className="btn-secondary px-4 py-2 text-red-600 hover:text-red-700"
                >
                  Clear Extracted Tasks
                </button>
                <button
                  onClick={handleCreateTasks}
                  className="btn-success px-6 py-2"
                >
                  Create {extractedTasks.length} Tasks
                </button>
              </>
            )}
            
            {transcript.trim() && !showExtracted && (
              <button
                onClick={handleClearAll}
                className="btn-secondary px-4 py-2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Voice Input Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Speak clearly and at a normal pace</li>
              <li>• Mention deadlines: "tomorrow", "next Friday", "in 2 hours"</li>
              <li>• Include priorities: "urgent", "important", "low priority"</li>
              <li>• Mention categories: "work meeting", "personal appointment", "health checkup"</li>
              <li>• Multiple tasks: "First call John, then send email, finally review report"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceInputModal;
