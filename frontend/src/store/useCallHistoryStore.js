// src/store/useCallHistoryStore.js
import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export const useCallHistoryStore = create((set, get) => ({
  calls: [],
  recentCalls: [],
  isLoading: false,
  pagination: {
    current: 1,
    total: 1,
    hasNext: false
  },

  // Fetch call history with pagination
  fetchCallHistory: async (page = 1, type = 'all') => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/calls/history?page=${page}&type=${type}`);
      
      if (page === 1) {
        set({ calls: res.data.calls, pagination: res.data.pagination });
      } else {
        // Append for pagination
        set(state => ({
          calls: [...state.calls, ...res.data.calls],
          pagination: res.data.pagination
        }));
      }
    } catch (error) {
      console.error('Failed to fetch call history:', error);
      toast.error('Failed to load call history');
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch recent calls
  fetchRecentCalls: async () => {
    try {
      const res = await axiosInstance.get('/calls/recent');
      set({ recentCalls: res.data });
    } catch (error) {
      console.error('Failed to fetch recent calls:', error);
    }
  },

  // Add new call to history (real-time)
  addCall: (callData) => {
    set(state => ({
      calls: [callData, ...state.calls],
      recentCalls: [callData, ...state.recentCalls].slice(0, 10)
    }));
  },

  // Update call status
  updateCall: (callId, updates) => {
    set(state => ({
      calls: state.calls.map(call => 
        call.callId === callId ? { ...call, ...updates } : call
      ),
      recentCalls: state.recentCalls.map(call =>
        call.callId === callId ? { ...call, ...updates } : call
      )
    }));
  },

  // Delete call
  deleteCall: async (callId) => {
    try {
      await axiosInstance.delete(`/calls/${callId}`);
      set(state => ({
        calls: state.calls.filter(call => call.callId !== callId),
        recentCalls: state.recentCalls.filter(call => call.callId !== callId)
      }));
      toast.success('Call deleted');
    } catch (error) {
      console.error('Failed to delete call:', error);
      toast.error('Failed to delete call');
    }
  }
}));
