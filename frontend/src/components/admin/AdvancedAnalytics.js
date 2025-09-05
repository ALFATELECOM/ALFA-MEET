import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  FaceSmileIcon,
  HandRaisedIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  GlobeAltIcon,
  BoltIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const AdvancedAnalytics = ({ meetings }) => {
  const [analyticsData, setAnalyticsData] = useState({});
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('engagement');

  useEffect(() => {
    generateAdvancedAnalytics();
  }, [meetings, timeRange]);

  const generateAdvancedAnalytics = () => {
    // Simulate advanced analytics data
    const data = {
      overview: {
        totalMeetings: meetings.length,
        totalParticipants: meetings.reduce((sum, m) => sum + (m.maxParticipants || 0), 0),
        totalDuration: meetings.reduce((sum, m) => sum + (m.duration || 0), 0),
        averageEngagement: 78.5,
        satisfactionScore: 4.3,
        completionRate: 92.8,
        returnRate: 85.2
      },
      engagement: {
        highEngagement: 65,
        mediumEngagement: 25,
        lowEngagement: 10,
        peakEngagementTime: '10:30 AM',
        averageAttentionSpan: 45, // minutes
        interactionRate: 73.2,
        questionFrequency: 12.5 // questions per hour
      },
      devices: {
        desktop: 45,
        mobile: 35,
        tablet: 20
      },
      geography: {
        'North America': 40,
        'Europe': 30,
        'Asia': 20,
        'Other': 10
      },
      timeAnalysis: {
        peakHours: ['10:00-11:00', '14:00-15:00', '16:00-17:00'],
        averageMeetingLength: 52, // minutes
        optimalDuration: 45, // minutes
        dropoffPoints: [30, 45, 60], // minutes when people typically leave
        bestDays: ['Tuesday', 'Wednesday', 'Thursday']
      },
      features: {
        chatUsage: 89.3,
        reactionUsage: 76.8,
        screenShareUsage: 45.2,
        recordingUsage: 34.7,
        pollUsage: 28.9,
        raiseHandUsage: 67.4,
        breakoutRoomUsage: 12.3
      },
      aiInsights: {
        transcriptionAccuracy: 94.7,
        summaryQuality: 4.2,
        actionItemsIdentified: 156,
        sentimentAnalysis: {
          positive: 72,
          neutral: 23,
          negative: 5
        },
        keyTopics: [
          { topic: 'Project Updates', frequency: 45 },
          { topic: 'Budget Planning', frequency: 32 },
          { topic: 'Team Coordination', frequency: 28 },
          { topic: 'Client Feedback', frequency: 19 }
        ],
        speakingTimeDistribution: {
          balanced: 67,
          hostDominated: 23,
          participantDriven: 10
        }
      },
      performance: {
        averageLoadTime: 2.3, // seconds
        connectionStability: 97.8, // percentage
        audioQuality: 4.4, // out of 5
        videoQuality: 4.2, // out of 5
        networkIssues: 3.2, // percentage of sessions
        serverUptime: 99.9 // percentage
      }
    };

    setAnalyticsData(data);
  };

  const metrics = [
    { id: 'engagement', name: 'Engagement', icon: TrophyIcon },
    { id: 'devices', name: 'Devices', icon: DevicePhoneMobileIcon },
    { id: 'geography', name: 'Geography', icon: GlobeAltIcon },
    { id: 'features', name: 'Features', icon: BoltIcon },
    { id: 'ai', name: 'AI Insights', icon: BoltIcon },
    { id: 'performance', name: 'Performance', icon: ChartBarIcon }
  ];

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">AI-powered meeting insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          <div className="flex items-center space-x-1 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Meetings</p>
              <p className="text-3xl font-bold">{analyticsData.overview?.totalMeetings || 0}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-200" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            <span>+12% from last period</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Avg Engagement</p>
              <p className="text-3xl font-bold">{analyticsData.overview?.averageEngagement || 0}%</p>
            </div>
            <TrophyIcon className="h-8 w-8 text-green-200" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            <span>+5.2% from last period</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Satisfaction</p>
              <p className="text-3xl font-bold">{analyticsData.overview?.satisfactionScore || 0}/5</p>
            </div>
            <EyeIcon className="h-8 w-8 text-purple-200" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            <span>Excellent rating</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold">{analyticsData.overview?.completionRate || 0}%</p>
            </div>
            <ClockIcon className="h-8 w-8 text-orange-200" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            <span>Above industry avg</span>
          </div>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {metrics.map(metric => {
            const Icon = metric.icon;
            return (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition duration-200 ${
                  selectedMetric === metric.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{metric.name}</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Analytics */}
        {selectedMetric === 'engagement' && analyticsData.engagement && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Engagement Distribution</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High Engagement (80%+)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${analyticsData.engagement.highEngagement}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{analyticsData.engagement.highEngagement}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medium Engagement (50-79%)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${analyticsData.engagement.mediumEngagement}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{analyticsData.engagement.mediumEngagement}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low Engagement (&lt;50%)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${analyticsData.engagement.lowEngagement}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{analyticsData.engagement.lowEngagement}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{analyticsData.engagement.averageAttentionSpan}m</div>
                  <div className="text-xs text-blue-600">Avg Attention Span</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{analyticsData.engagement.interactionRate}%</div>
                  <div className="text-xs text-green-600">Interaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'devices' && analyticsData.devices && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Device Usage Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <ComputerDesktopIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-blue-900">{analyticsData.devices.desktop}%</div>
                <div className="text-sm text-blue-600">Desktop</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <DevicePhoneMobileIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-900">{analyticsData.devices.mobile}%</div>
                <div className="text-sm text-green-600">Mobile</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <DeviceTabletIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-900">{analyticsData.devices.tablet}%</div>
                <div className="text-sm text-purple-600">Tablet</div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'ai' && analyticsData.aiInsights && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Performance Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-900">{analyticsData.aiInsights.transcriptionAccuracy}%</div>
                    <div className="text-sm text-blue-600">Transcription Accuracy</div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-900">{analyticsData.aiInsights.summaryQuality}/5</div>
                    <div className="text-sm text-green-600">Summary Quality</div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-900">{analyticsData.aiInsights.actionItemsIdentified}</div>
                    <div className="text-sm text-purple-600">Action Items Found</div>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-900">{analyticsData.aiInsights.sentimentAnalysis.positive}%</div>
                    <div className="text-sm text-orange-600">Positive Sentiment</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Discussion Topics</h4>
              <div className="space-y-2">
                {analyticsData.aiInsights.keyTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{topic.topic}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${topic.frequency}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{topic.frequency}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'features' && analyticsData.features && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Feature Adoption Rates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(analyticsData.features).map(([feature, usage]) => {
                const featureIcons = {
                  chatUsage: ChatBubbleLeftIcon,
                  reactionUsage: FaceSmileIcon,
                  screenShareUsage: ComputerDesktopIcon,
                  raiseHandUsage: HandRaisedIcon,
                  recordingUsage: EyeIcon,
                  pollUsage: ChartBarIcon,
                  breakoutRoomUsage: UserGroupIcon
                };
                
                const Icon = featureIcons[feature] || ChartBarIcon;
                
                return (
                  <div key={feature} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {feature.replace('Usage', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${usage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{usage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedMetric === 'performance' && analyticsData.performance && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-900">{analyticsData.performance.serverUptime}%</div>
                  <div className="text-sm text-green-600">Server Uptime</div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-900">{analyticsData.performance.averageLoadTime}s</div>
                  <div className="text-sm text-blue-600">Avg Load Time</div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-900">{analyticsData.performance.connectionStability}%</div>
                  <div className="text-sm text-purple-600">Connection Stability</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-indigo-900 mb-4">🤖 AI Recommendations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h5 className="font-medium text-indigo-900 mb-2">Optimize Meeting Duration</h5>
            <p className="text-sm text-indigo-700">
              Consider reducing meeting length to 45 minutes. Data shows 15% higher engagement for shorter sessions.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h5 className="font-medium text-indigo-900 mb-2">Increase Mobile Support</h5>
            <p className="text-sm text-indigo-700">
              35% of users join from mobile. Consider mobile-specific features to improve experience.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h5 className="font-medium text-indigo-900 mb-2">Boost Interaction</h5>
            <p className="text-sm text-indigo-700">
              Use more polls and reactions. Meetings with interactive elements show 23% higher satisfaction.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h5 className="font-medium text-indigo-900 mb-2">Schedule Optimization</h5>
            <p className="text-sm text-indigo-700">
              Tuesday-Thursday 10-11 AM shows highest attendance. Consider scheduling important meetings then.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
