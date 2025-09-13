import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useAI } from '../contexts/AIContext';
import { useTask } from '../contexts/TaskContext';

function BulkImportModal({ onClose }) {
  const { extractTasks, extractedTasks, clearExtractedTasks, loading } = useAI();
  const { createBulkTasks } = useTask();
  
  const [text, setText] = useState('');
  const [showExtracted, setShowExtracted] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set());

  // Auto-select all tasks when extractedTasks updates
  useEffect(() => {
    if (extractedTasks.length > 0) {
      const allTaskIds = new Set(extractedTasks.map((_, index) => index));
      setSelectedTasks(allTaskIds);
    }
  }, [extractedTasks]);

  const sampleTexts = [
    {
      title: "Email Example",
      content: `Hi team, quick reminder about upcoming items:
- Board meeting presentation due Friday 3PM
- Doctor appointment rescheduled to Thursday 2PM  
- Pick up dry cleaning before Saturday
- Submit expense report by end of month
- Call mom for her birthday on Sunday
Thanks!`
    },
    {
      title: "Meeting Notes",
      content: `Action items from today's meeting:
1. Research competitor pricing - high priority - due Wednesday
2. Update website copy - medium priority 
3. Schedule user interviews - next week
4. Review Q3 budget numbers - urgent - by tomorrow
5. Prepare demo for client - Thursday presentation`
    },
    {
      title: "Personal Tasks",
      content: `Weekend todos:
- Buy groceries for dinner party Saturday
- Book dentist appointment for next month
- Call insurance company about claim
- Finish reading project proposal
- Exercise at gym - Sunday morning
- Plan vacation for next month`
    }
  ];

  const handleProcessText = async () => {
    if (!text.trim()) return;
    
    try {
      // Clear previous extracted tasks before processing new input
      clearExtractedTasks();
      await extractTasks(text);
      setShowExtracted(true);
      // Wait a moment for state to update then select all tasks
      setTimeout(() => {
        // This will be set in useEffect when extractedTasks updates
      }, 100);
    } catch (error) {
      console.error('Text processing failed:', error);
    }
  };

  const handleCreateTasks = async () => {
    const tasksToCreate = extractedTasks.filter((_, index) => selectedTasks.has(index));
    
    if (tasksToCreate.length === 0) return;
    
    try {
      await createBulkTasks(tasksToCreate);
      onClose();
    } catch (error) {
      console.error('Failed to create tasks:', error);
    }
  };

  const handleTaskToggle = (index) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    const allTaskIds = new Set(extractedTasks.map((_, index) => index));
    setSelectedTasks(allTaskIds);
  };

  const handleDeselectAll = () => {
    setSelectedTasks(new Set());
  };

  const loadSampleText = (sample) => {
    setText(sample.content);
    setShowExtracted(false);
    clearExtractedTasks();
    setSelectedTasks(new Set()); // Clear selected tasks
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Bulk Import Tasks</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Paste emails, notes, or any text containing tasks. AI will automatically extract and organize them.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Sample Text Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Start Examples:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sampleTexts.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => loadSampleText(sample)}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 text-sm">{sample.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {sample.content.split('\n')[0]}...
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label htmlFor="bulk-text" className="block text-sm font-medium text-gray-700 mb-2">
              Paste your text here
            </label>
            <textarea
              id="bulk-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your email, notes, or any text containing tasks here. For example:&#10;&#10;- Board meeting presentation due Friday 3PM&#10;- Doctor appointment Thursday 2PM&#10;- Submit expense report by end of month&#10;- Call client about project status"
              rows={8}
              className="textarea resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {text.length} characters • AI works best with clear, actionable items
              </p>
              {text.trim() && !showExtracted && (
                <button
                  onClick={handleProcessText}
                  disabled={loading}
                  className="btn-primary px-4 py-2"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="h-4 w-4 mr-2" />
                      Extract Tasks
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Extracted Tasks */}
          {showExtracted && extractedTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Extracted Tasks ({extractedTasks.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Deselect All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => {
                      clearExtractedTasks();
                      setShowExtracted(false);
                      setSelectedTasks(new Set());
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                  <span className="text-sm text-gray-500">
                    ({selectedTasks.size} selected)
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {extractedTasks.map((task, index) => (
                  <div key={index} className={`border rounded-lg p-4 transition-colors ${
                    selectedTasks.has(index) ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(index)}
                        onChange={() => handleTaskToggle(index)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            
                            <div className="flex items-center space-x-3 text-xs">
                              <span className={`px-2 py-1 rounded-full ${
                                task.priority === 'High' ? 'bg-red-100 text-red-800' :
                                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {task.priority}
                              </span>
                              
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                {task.category}
                              </span>
                              
                              {task.deadline && (
                                <span className="text-gray-500">
                                  Due: {new Date(task.deadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <div className={`flex items-center text-xs ${
                              (task.confidence_score || 0) > 0.7 ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {(task.confidence_score || 0) > 0.7 ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <AlertCircle className="h-3 w-3 mr-1" />
                              )}
                              {Math.round((task.confidence_score || 0) * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No tasks found */}
          {showExtracted && extractedTasks.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-4">
                The AI couldn't find clear actionable tasks in the provided text. 
                Try adding more specific items with action words.
              </p>
              <button
                onClick={() => {
                  setShowExtracted(false);
                  clearExtractedTasks();
                }}
                className="btn-secondary px-4 py-2"
              >
                Try Again
              </button>
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
            
            {showExtracted && selectedTasks.size > 0 && (
              <button
                onClick={handleCreateTasks}
                className="btn-success px-6 py-2"
              >
                Create {selectedTasks.size} Selected Tasks
              </button>
            )}
            
            {text.trim() && !showExtracted && (
              <button
                onClick={() => setText('')}
                className="btn-secondary px-4 py-2"
              >
                Clear Text
              </button>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Best Practices:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use action words: "call", "send", "review", "complete", "buy"</li>
              <li>• Include deadlines: "by Friday", "tomorrow", "next week", "urgent"</li>
              <li>• Be specific: "Call John about project status" vs "Call John"</li>
              <li>• Use bullet points or numbered lists for better extraction</li>
              <li>• Include priority indicators: "urgent", "important", "low priority"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkImportModal;
