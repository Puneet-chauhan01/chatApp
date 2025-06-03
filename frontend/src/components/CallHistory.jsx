// src/components/CallHistory.jsx
import React, { useEffect, useState } from 'react';
import { Phone, Video, PhoneIncoming, PhoneMissed, Clock, Trash2 } from 'lucide-react';
import { useCallHistoryStore } from '../store/useCallHistoryStore';
import { formatDistanceToNow } from 'date-fns';

const CallHistory = () => {
  const {
    calls,
    isLoading,
    pagination,
    fetchCallHistory,
    deleteCall
  } = useCallHistoryStore();
  
  const [filter, setFilter] = useState('all'); // 'all', 'audio', 'video'
  
  useEffect(() => {
    fetchCallHistory(1, filter);
  }, [filter]);

  const getCallIcon = (call) => {
    if (call.callType === 'video') {
      return <Video size={20} className="text-blue-500" />;
    }
    return <Phone size={20} className="text-green-500" />;
  };

  const getStatusIcon = (call) => {
    switch (call.status) {
      case 'missed':
        return <PhoneMissed size={16} className="text-red-500" />;
      case 'rejected':
        return <PhoneMissed size={16} className="text-red-500" />;
      default:
        return <PhoneIncoming size={16} className="text-green-500" />;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoadMore = () => {
    if (pagination.hasNext && !isLoading) {
      fetchCallHistory(pagination.current + 1, filter);
    }
  };

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <h2 className="text-xl font-semibold mb-4">Call History</h2>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-base-200 rounded-lg p-1">
          {['all', 'audio', 'video'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-primary text-primary-content'
                  : 'text-base-content hover:bg-base-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Call List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && calls.length === 0 ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {calls.map((call) => (
              <div
                key={call._id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-base-200 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Call Type Icon */}
                  <div className="flex-shrink-0">
                    {getCallIcon(call)}
                  </div>

                  {/* Call Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium truncate">
                        {call.isGroup 
                          ? call.groupId?.name || 'Unknown Group'
                          : call.participants.find(p => p._id !== call.initiatedBy)?._name || 'Unknown'
                        }
                      </p>
                      {getStatusIcon(call)}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-base-content/60">
                      <Clock size={12} />
                      <span>{formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}</span>
                      {call.duration && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(call.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => deleteCall(call.callId)}
                    className="btn btn-ghost btn-sm btn-circle text-error"
                    title="Delete call"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {pagination.hasNext && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="btn btn-outline btn-sm"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {calls.length === 0 && !isLoading && (
              <div className="text-center py-8 text-base-content/60">
                <Phone size={48} className="mx-auto mb-3 opacity-50" />
                <p>No call history found</p>
                <p className="text-sm">Start making calls to see your history here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistory;
