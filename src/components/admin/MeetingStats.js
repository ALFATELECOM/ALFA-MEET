import React from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  UsersIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const MeetingStats = ({ meetings }) => {
  const stats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayMeetings = meetings.filter(m => {
      const meetingDate = new Date(m.scheduledFor);
      return meetingDate >= today && meetingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }).length;

    const weeklyMeetings = meetings.filter(m => {
      const meetingDate = new Date(m.scheduledFor);
      return meetingDate >= thisWeek;
    }).length;

    const monthlyMeetings = meetings.filter(m => {
      const meetingDate = new Date(m.scheduledFor);
      return meetingDate >= thisMonth;
    }).length;

    const totalDuration = meetings.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = meetings.length > 0 ? Math.round(totalDuration / meetings.length) : 0;

    const statusCounts = meetings.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {});

    return {
      todayMeetings,
      weeklyMeetings,
      monthlyMeetings,
      averageDuration,
      totalDuration,
      statusCounts
    };
  }, [meetings]);

  const statCards = [
    {
      title: 'Today\'s Meetings',
      value: stats.todayMeetings,
      icon: ClockIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'This Week',
      value: stats.weeklyMeetings,
      icon: CalendarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'This Month',
      value: stats.monthlyMeetings,
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Avg Duration',
      value: `${stats.averageDuration}m`,
      icon: UsersIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Meeting Status Distribution</h4>
        <div className="space-y-3">
          {Object.entries(stats.statusCounts).map(([status, count]) => {
            const percentage = meetings.length > 0 ? Math.round((count / meetings.length) * 100) : 0;
            const colors = {
              scheduled: 'bg-blue-500',
              active: 'bg-green-500',
              ended: 'bg-gray-500'
            };
            
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${colors[status]}`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[status]}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Stats */}
      {meetings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Meeting Insights</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Meetings:</span>
                <span className="font-medium">{meetings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Duration:</span>
                <span className="font-medium">{Math.round(stats.totalDuration / 60)}h {stats.totalDuration % 60}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Duration:</span>
                <span className="font-medium">{stats.averageDuration} minutes</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Recent Activity</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Now:</span>
                <span className="font-medium text-green-600">{stats.statusCounts.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scheduled:</span>
                <span className="font-medium text-blue-600">{stats.statusCounts.scheduled || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-gray-600">{stats.statusCounts.ended || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingStats;
