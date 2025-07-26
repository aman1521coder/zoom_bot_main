import { X, Download, Copy, FileText } from 'lucide-react';
import { useState } from 'react';

export default function TranscriptionModal({ meeting, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !meeting) return null;

  const handleCopy = () => {
    if (meeting.transcription) {
      navigator.clipboard.writeText(meeting.transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([meeting.transcription || ''], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `transcription-${meeting.meetingId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Meeting Transcription
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {meeting.topic || 'Untitled Meeting'} - {new Date(meeting.startTime || meeting.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {meeting.transcription ? (
            <div>
              {/* Summary if available */}
              {meeting.summary && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
                  <p className="text-blue-800 whitespace-pre-wrap">{meeting.summary}</p>
                </div>
              )}

              {/* Action Items if available */}
              {meeting.actionItems && meeting.actionItems.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Action Items</h3>
                  <ul className="list-disc list-inside text-green-800 space-y-1">
                    {meeting.actionItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Transcription */}
              <div className="prose max-w-none">
                <h3 className="font-semibold text-gray-900 mb-3">Full Transcription</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {meeting.transcription}
                  </pre>
                </div>
              </div>

              {/* Word Count */}
              {meeting.wordCount && (
                <p className="text-sm text-gray-500 mt-4">
                  Word count: {meeting.wordCount.toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transcription available for this meeting.</p>
              {meeting.recordingUrl && (
                <p className="text-sm text-gray-500 mt-2">
                  Recording is available but hasn't been transcribed yet.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {meeting.duration && `Duration: ${Math.floor(meeting.duration / 60)} minutes`}
          </div>
          <div className="flex items-center gap-3">
            {meeting.transcription && (
              <>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 