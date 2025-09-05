import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  HandRaisedIcon,
  FaceSmileIcon,
  TrophyIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const MeetingReports = ({ meetingId, meetingData }) => {
  const [reportData, setReportData] = useState({
    participants: [],
    analytics: {},
    timeline: [],
    engagement: {},
    summary: {}
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReportData();
  }, [meetingId]);

  const generateReportData = () => {
    // Simulate detailed participant data
    const participants = [
      {
        id: 'user-1',
        name: 'John Smith',
        email: 'john@company.com',
        joinTime: '2024-01-15T10:00:00Z',
        leaveTime: '2024-01-15T11:30:00Z',
        duration: 90, // minutes
        role: 'host',
        location: 'New York, USA',
        device: 'Desktop - Chrome',
        connectionQuality: 'Excellent',
        participationScore: 95,
        messagesCount: 12,
        reactionsCount: 8,
        handsRaised: 2,
        speakingTime: 25, // minutes
        cameraOnTime: 85, // minutes
        micMutedTime: 5, // minutes
        screenShareTime: 10, // minutes
        engagementLevel: 'High',
        attendanceStatus: 'Full',
        networkIssues: 0,
        pointsEarned: 340
      },
      {
        id: 'user-2',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        joinTime: '2024-01-15T10:02:00Z',
        leaveTime: '2024-01-15T11:25:00Z',
        duration: 83,
        role: 'participant',
        location: 'London, UK',
        device: 'Mobile - Safari',
        connectionQuality: 'Good',
        participationScore: 78,
        messagesCount: 8,
        reactionsCount: 15,
        handsRaised: 3,
        speakingTime: 12,
        cameraOnTime: 75,
        micMutedTime: 8,
        screenShareTime: 0,
        engagementLevel: 'Medium',
        attendanceStatus: 'Full',
        networkIssues: 2,
        pointsEarned: 260
      },
      {
        id: 'user-3',
        name: 'Mike Davis',
        email: 'mike@company.com',
        joinTime: '2024-01-15T10:15:00Z',
        leaveTime: '2024-01-15T11:30:00Z',
        duration: 75,
        role: 'participant',
        location: 'Tokyo, Japan',
        device: 'Tablet - Chrome',
        connectionQuality: 'Fair',
        participationScore: 65,
        messagesCount: 3,
        reactionsCount: 5,
        handsRaised: 1,
        speakingTime: 8,
        cameraOnTime: 60,
        micMutedTime: 15,
        screenShareTime: 0,
        engagementLevel: 'Low',
        attendanceStatus: 'Partial',
        networkIssues: 5,
        pointsEarned: 140
      }
    ];

    const analytics = {
      totalParticipants: participants.length,
      averageDuration: participants.reduce((sum, p) => sum + p.duration, 0) / participants.length,
      totalMessages: participants.reduce((sum, p) => sum + p.messagesCount, 0),
      totalReactions: participants.reduce((sum, p) => sum + p.reactionsCount, 0),
      totalHandsRaised: participants.reduce((sum, p) => sum + p.handsRaised, 0),
      averageEngagement: participants.reduce((sum, p) => sum + p.participationScore, 0) / participants.length,
      peakAttendance: participants.length,
      dropoffRate: 10, // percentage
      networkIssues: participants.reduce((sum, p) => sum + p.networkIssues, 0),
      deviceBreakdown: {
        desktop: participants.filter(p => p.device.includes('Desktop')).length,
        mobile: participants.filter(p => p.device.includes('Mobile')).length,
        tablet: participants.filter(p => p.device.includes('Tablet')).length
      },
      locationBreakdown: participants.reduce((acc, p) => {
        const location = p.location.split(',')[1]?.trim() || 'Unknown';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {})
    };

    const timeline = [
      { time: '10:00', event: 'Meeting started', type: 'system', participants: 1 },
      { time: '10:02', event: 'Sarah Johnson joined', type: 'join', participants: 2 },
      { time: '10:05', event: 'Screen sharing started', type: 'feature', participants: 2 },
      { time: '10:15', event: 'Mike Davis joined', type: 'join', participants: 3 },
      { time: '10:20', event: 'Poll created: "Project Timeline"', type: 'feature', participants: 3 },
      { time: '10:25', event: 'Peak engagement reached', type: 'milestone', participants: 3 },
      { time: '10:45', event: 'Breakout rooms created', type: 'feature', participants: 3 },
      { time: '11:00', event: 'Recording started', type: 'feature', participants: 3 },
      { time: '11:25', event: 'Sarah Johnson left', type: 'leave', participants: 2 },
      { time: '11:30', event: 'Meeting ended', type: 'system', participants: 2 }
    ];

    const engagement = {
      highEngagement: participants.filter(p => p.participationScore >= 80).length,
      mediumEngagement: participants.filter(p => p.participationScore >= 60 && p.participationScore < 80).length,
      lowEngagement: participants.filter(p => p.participationScore < 60).length,
      totalPoints: participants.reduce((sum, p) => sum + p.pointsEarned, 0),
      topContributor: participants.reduce((prev, current) => 
        (prev.pointsEarned > current.pointsEarned) ? prev : current
      )
    };

    const summary = {
      meetingDuration: 90,
      actualStartTime: '10:00 AM',
      actualEndTime: '11:30 AM',
      scheduledDuration: 60,
      overtime: 30,
      attendanceRate: 100,
      completionRate: 90,
      satisfactionScore: 4.2,
      actionItems: 5,
      followUpRequired: true
    };

    setReportData({
      participants,
      analytics,
      timeline,
      engagement,
      summary
    });
    setLoading(false);
  };

  const exportReport = (format) => {
    const data = {
      meetingId,
      generatedAt: new Date().toISOString(),
      ...reportData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-report-${meetingId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'participants', name: 'Participants', icon: UserGroupIcon },
    { id: 'timeline', name: 'Timeline', icon: ClockIcon },
    { id: 'engagement', name: 'Engagement', icon: TrophyIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meeting Report</h2>
          <p className="text-sm text-gray-500 mt-1">
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => exportReport('json')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm transition duration-200"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Total Participants</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.analytics.totalParticipants}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Avg Duration</p>
                  <p className="text-2xl font-bold text-green-900">{Math.round(reportData.analytics.averageDuration)}m</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Messages</p>
                  <p className="text-2xl font-bold text-purple-900">{reportData.analytics.totalMessages}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrophyIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-600">Engagement</p>
                  <p className="text-2xl font-bold text-orange-900">{Math.round(reportData.analytics.averageEngagement)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Device & Location Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Device Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(reportData.analytics.deviceBreakdown).map(([device, count]) => (
                  <div key={device} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{device}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Geographic Distribution</h4>
              <div className="space-y-2">
                {Object.entries(reportData.analytics.locationBreakdown).map(([location, count]) => (
                  <div key={location} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{location}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                          <div className="text-sm text-gray-500">{participant.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(participant.joinTime).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.duration}m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${participant.participationScore}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-900">{participant.participationScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.device}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.pointsEarned}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="flow-root">
            <ul className="-mb-8">
              {reportData.timeline.map((event, eventIdx) => (
                <li key={eventIdx}>
                  <div className="relative pb-8">
                    {eventIdx !== reportData.timeline.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          event.type === 'system' ? 'bg-blue-500' :
                          event.type === 'join' ? 'bg-green-500' :
                          event.type === 'leave' ? 'bg-red-500' :
                          event.type === 'feature' ? 'bg-purple-500' :
                          'bg-yellow-500'
                        }`}>
                          <ClockIcon className="h-5 w-5 text-white" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {event.event}{' '}
                            <span className="font-medium text-gray-900">
                              ({event.participants} participants)
                            </span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {event.time}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{reportData.engagement.highEngagement}</div>
                <div className="text-sm text-green-600">High Engagement (80%+)</div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-900">{reportData.engagement.mediumEngagement}</div>
                <div className="text-sm text-yellow-600">Medium Engagement (60-79%)</div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-900">{reportData.engagement.lowEngagement}</div>
                <div className="text-sm text-red-600">Low Engagement (&lt;60%)</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-3">🏆 Top Contributor</h4>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center">
                <TrophyIcon className="h-6 w-6 text-yellow-800" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{reportData.engagement.topContributor.name}</div>
                <div className="text-sm text-gray-600">{reportData.engagement.topContributor.pointsEarned} points earned</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Engagement Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{reportData.analytics.totalMessages}</div>
                <div className="text-xs text-gray-600">Chat Messages</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{reportData.analytics.totalReactions}</div>
                <div className="text-xs text-gray-600">Reactions</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{reportData.analytics.totalHandsRaised}</div>
                <div className="text-xs text-gray-600">Hands Raised</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{reportData.engagement.totalPoints}</div>
                <div className="text-xs text-gray-600">Total Points</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingReports;
