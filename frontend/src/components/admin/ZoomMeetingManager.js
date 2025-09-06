import React, { useMemo, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import CreateMeetingModal from './CreateMeetingModal';
import MeetingList from './MeetingList';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ZoomMeetingManager = () => {
  const { meetings } = useAdmin();
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | scheduled | active | ended

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meetings
      .filter(m => (statusFilter === 'all' ? true : m.status === statusFilter))
      .filter(m =>
        q.length === 0 ||
        (m.title || '').toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q) ||
        (m.roomId || '').toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [meetings, query, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, description, or room ID"
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Schedule a Meeting</span>
        </button>
      </div>

      {/* Meetings List */}
      <MeetingList meetings={filtered} />

      {/* Create Modal */}
      {showCreate && (
        <CreateMeetingModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}
    </div>
  );
};

export default ZoomMeetingManager;


