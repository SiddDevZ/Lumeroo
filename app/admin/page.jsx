"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import Image from "next/image";
import { Toaster, toast } from "sonner";
import config from "@/config.json";
import useUserAvatar from '@/hooks/useUserAvatar';
import "remixicon/fonts/remixicon.css";
import {
  FaEye,
  FaTrash,
  FaUser,
  FaClock,
  FaImage,
  FaVideo,
  FaChevronDown,
  FaChevronUp,
  FaFilter,
  FaSearch
} from "react-icons/fa";

const ReporterAvatar = ({ reporter }) => {
  const { avatarUrl: reporterAvatarUrl } = useUserAvatar(reporter);

  return (
    <div className="w-10 h-10 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#2f2f2f] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
      {reporter?.avatar ? (
        <Image
          src={reporter.avatar.startsWith('/') ? config.stream + reporter.avatar : reporter.avatar}
          alt={reporter.username}
          width={32}
          height={32}
          className="rounded-full object-cover"
        />
      ) : reporterAvatarUrl ? (
        <Image
          src={reporterAvatarUrl}
          alt={reporter?.username || 'Reporter'}
          width={48}
          height={48}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className="text-white text-sm font-bold">
          {reporter?.username?.[0]?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
};

const AdminPage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterContentType, setFilterContentType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const reportCategories = [
    { id: 'illegal', label: 'Illegal or prohibited content', icon: 'ri-error-warning-line', color: 'text-red-400 bg-red-400/10 border border-red-400/30 shadow-lg shadow-red-400/5' },
    { id: 'nonconsensual', label: 'Non-consensual content', icon: 'ri-shield-user-line', color: 'text-orange-400 bg-orange-400/10 border border-orange-400/30 shadow-lg shadow-orange-400/5' },
    { id: 'underage', label: 'Suspected underage content', icon: 'ri-user-unfollow-line', color: 'text-purple-400 bg-purple-400/10 border border-purple-400/30 shadow-lg shadow-purple-400/5' },
    { id: 'copyright', label: 'Copyright infringement', icon: 'ri-copyright-line', color: 'text-blue-400 bg-blue-400/10 border border-blue-400/30 shadow-lg shadow-blue-400/5' },
    { id: 'other', label: 'Other issue', icon: 'ri-more-line', color: 'text-gray-400 bg-gray-400/10 border border-gray-400/30 shadow-lg shadow-gray-400/5' }
  ];

  const getCategoryData = (categoryId) => {
    return reportCategories.find(cat => cat.id === categoryId) || reportCategories[4]; // Default to 'other'
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const response = await fetch(`${config.url}/api/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        
        if (data.success && data.user?.isAdmin) {
          setUser(data.user);
          fetchReports(token);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    let filtered = reports;

    if (filterCategory !== 'all') {
      filtered = filtered.filter(report => report.category === filterCategory);
    }

    if (filterContentType !== 'all') {
      filtered = filtered.filter(report => report.contentType === filterContentType);
    }

    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.contentSnapshot?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.contentSnapshot?.uploaderUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporter?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  }, [reports, filterCategory, filterContentType, searchTerm]);

  const fetchReports = async (token) => {
    try {
      setLoading(true);
      const response = await fetch(`${config.url}/api/reports/admin?token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports);
      } else {
        toast.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(prev => ({ ...prev, [reportId]: true }));

    try {
      const response = await fetch(`${config.url}/api/reports/admin/${reportId}?token=${token}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setReports(prev => prev.filter(report => report._id !== reportId));
        toast.success('Report deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    } finally {
      setActionLoading(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const handleViewContent = (report) => {
    const identifier = report.contentSnapshot?.slug || report.contentId;
    window.open(`/watch?v=${identifier}`, '_blank');
  };

  const clearFilters = () => {
    setFilterCategory('all');
    setFilterContentType('all');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#080808] via-[#0a0a0a] to-[#0c0c0c] min-h-screen">
        <NavBar user={user} setUser={setUser} showCategories={false} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
          <div className="animate-pulse space-y-8">
            <div className="space-y-4">
              <div className="h-10 bg-gradient-to-r from-[#1a1a1a] to-[#1f1f1f] rounded-xl w-80"></div>
              <div className="h-5 bg-gradient-to-r from-[#1a1a1a] to-[#1f1f1f] rounded-lg w-64"></div>
            </div>

            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-[#121212] to-[#171717] rounded-2xl p-6 border border-[#2a2a2a]/50 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-[#2a2a2a] to-[#2f2f2f] rounded-xl"></div>
                    <div className="space-y-3">
                      <div className="h-5 bg-gradient-to-r from-[#2a2a2a] to-[#2f2f2f] rounded-lg w-48"></div>
                      <div className="h-4 bg-gradient-to-r from-[#2a2a2a] to-[#2f2f2f] rounded-lg w-32"></div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <div className="h-10 bg-gradient-to-r from-[#2a2a2a] to-[#2f2f2f] rounded-xl w-24"></div>
                    <div className="h-10 bg-gradient-to-r from-[#2a2a2a] to-[#2f2f2f] rounded-xl w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#080808] via-[#0a0a0a] to-[#0c0c0c] min-h-screen">
      <NavBar user={user} setUser={setUser} showCategories={false} />
      <Toaster theme="dark" position="bottom-right" richColors />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Report Management
              </h1>
              <p className="text-[#a0a0a0] text-sm sm:text-base font-medium">
                Review and manage user reports with advanced controls
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#1f1f1f] px-6 py-4 rounded-2xl border border-[#2a2a2a]/50 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
                <div className="text-[#a0a0a0] text-xs sm:text-sm font-medium">Total Reports</div>
                <div className="text-white font-bold text-2xl mt-1">{reports.length}</div>
              </div>
              <div className="bg-gradient-to-br from-[#b8b002]/10 to-[#a3a002]/10 px-6 py-4 rounded-2xl border border-[#b8b002]/30 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
                <div className="text-[#b8b002] text-xs sm:text-sm font-medium">Filtered Results</div>
                <div className="text-[#b8b002] font-bold text-2xl mt-1">{filteredReports.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#b8b002]/20 to-[#a3a002]/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500"></div>
            <div className="relative">
              <FaSearch className="absolute z-10 left-5 top-1/2 transform -translate-y-1/2 text-[#727272] group-focus-within:text-[#b8b002] transition-colors duration-300" />
              <input
                type="text"
                placeholder="Search reports by content title, uploader, reporter, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gradient-to-br from-[#1a1a1a] to-[#1f1f1f] border border-[#2a2a2a]/50 text-white rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:border-[#b8b002]/50 focus:ring-2 focus:ring-[#b8b002]/20 transition-all duration-300 placeholder-[#666] text-sm sm:text-base shadow-xl backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-br from-[#1a1a1a] to-[#1f1f1f] border border-[#2a2a2a]/50 text-[#d0d0d0] rounded-2xl hover:border-[#3a3a3a] hover:shadow-xl transition-all duration-300 text-sm font-medium sm:w-auto shadow-lg backdrop-blur-sm cursor-pointer"
            >
              <FaFilter className="text-sm" />
              <span>Advanced Filters</span>
              {showFilters ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
            </button>

            {(filterCategory !== 'all' || filterContentType !== 'all' || searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-br from-[#b8b002]/15 to-[#a3a002]/15 border border-[#b8b002]/40 text-[#b8b002] rounded-2xl hover:bg-gradient-to-br hover:from-[#b8b002]/25 hover:to-[#a3a002]/25 hover:shadow-xl transition-all duration-300 text-sm font-medium shadow-lg backdrop-blur-sm cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="bg-gradient-to-br from-[#121212] to-[#171717] border border-[#2a2a2a]/50 rounded-2xl p-6 space-y-6 animate-in slide-in-from-top-2 duration-300 shadow-2xl backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-white font-semibold mb-3 text-sm">Filter by Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a]/50 text-white rounded-xl px-4 pr-10 py-3 focus:outline-none focus:border-[#b8b002]/50 focus:ring-2 focus:ring-[#b8b002]/20 transition-all duration-300 text-sm shadow-lg cursor-pointer [&>option]:bg-[#1a1a1a] [&>option]:text-white appearance-none"
                  >
                    <option value="all" className="bg-[#1a1a1a] text-white">All Categories</option>
                    {reportCategories.map(category => (
                      <option key={category.id} value={category.id} className="bg-[#1a1a1a] text-white">{category.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-white font-semibold mb-3 text-sm">Filter by Content Type</label>
                  <select
                    value={filterContentType}
                    onChange={(e) => setFilterContentType(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a]/50 text-white rounded-xl px-4 pr-10 py-3 focus:outline-none focus:border-[#b8b002]/50 focus:ring-2 focus:ring-[#b8b002]/20 transition-all duration-300 text-sm shadow-lg cursor-pointer [&>option]:bg-[#1a1a1a] [&>option]:text-white appearance-none"
                  >
                    <option value="all" className="bg-[#1a1a1a] text-white">All Types</option>
                    <option value="video" className="bg-[#1a1a1a] text-white">Videos</option>
                    <option value="image" className="bg-[#1a1a1a] text-white">Images</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-[#111]/60 to-[#171717]/60 rounded-3xl p-8 sm:p-12 border border-[#2a2a2a]/40 max-w-lg mx-auto shadow-2xl backdrop-blur-sm">
              <div className="relative mb-6">
                <i className="ri-flag-line text-5xl sm:text-6xl text-[#b8b002] relative"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                {reports.length === 0 ? 'No Reports Found' : 'No Matching Reports'}
              </h3>
              <p className="text-[#a0a0a0] text-sm sm:text-base">
                {reports.length === 0 
                  ? "Everything looks good! No reports to review at the moment."
                  : "Try adjusting your search terms or filters to find what you're looking for."
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReports.map((report) => {
              const categoryData = getCategoryData(report.category);
              
              return (
                <div
                  key={report._id}
                  className="bg-gradient-to-br from-[#121212] to-[#171717] border border-[#2a2a2a]/50 rounded-2xl overflow-hidden hover:border-[#3a3a3a]/70 transition-all duration-300 shadow-xl hover:shadow-2xl backdrop-blur-sm"
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 flex-1 min-w-0">
                        <div className="flex flex-wrap gap-3">
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold ${categoryData.color} backdrop-blur-sm`}>
                            <i className={`${categoryData.icon} text-sm`}></i>
                            <span className="hidden sm:inline">{categoryData.label}</span>
                            <span className="sm:hidden">{categoryData.label.split(' ')[0]}</span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="text-white font-bold text-sm sm:text-lg mb-2 truncate">
                            {report.contentSnapshot?.title || 'Content Title Not Available'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-[#a0a0a0] text-xs">
                            <div className="flex items-center gap-1.5">
                              <FaUser className="text-xs" />
                              <span className="font-medium">by {report.contentSnapshot?.uploaderUsername || 'Unknown'}</span>
                            </div>
                            <span className="hidden sm:inline text-[#666]">•</span>
                            <div className="flex items-center gap-1.5">
                              <FaClock className="text-xs" />
                              <span className="font-medium">Reported {getRelativeTime(report.createdAt)}</span>
                            </div>
                            <span className="hidden sm:inline text-[#666]">•</span>
                            <div className="flex items-center gap-1.5">
                              {report.contentType === 'video' ? (
                                <FaVideo className="text-blue-400 text-xs" />
                              ) : (
                                <FaImage className="text-green-400 text-xs" />
                              )}
                              <span className="text-[#d0d0d0] capitalize font-medium text-xs">{report.contentType}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={() => handleViewContent(report)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#b8b002] to-[#a3a002] hover:from-[#a3a002] hover:to-[#959500] text-[#202020] rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
                        >
                          <FaEye className="text-sm" />
                          <span className="hidden sm:inline">View Content</span>
                          <span className="sm:hidden">View</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteReport(report._id)}
                          disabled={actionLoading[report._id]}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#a37508] disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold disabled:cursor-not-allowed whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none cursor-pointer"
                        >
                          {actionLoading[report._id] ? (
                            <i className="ri-loader-4-line animate-spin text-sm"></i>
                          ) : (
                            <FaTrash className="text-sm" />
                          )}
                          <span className="">Delete Report</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#2a2a2a]/50 bg-gradient-to-br from-[#0f0f0f] to-[#141414] p-4 sm:p-5 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

                      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#1f1f1f] rounded-xl p-4 border border-[#2a2a2a]/50 shadow-xl backdrop-blur-sm">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                          <i className="ri-flag-line text-[#b8b002] text-base"></i>
                          <span>Reported By</span>
                        </h4>
                        <div className="flex items-center gap-3">
                          <ReporterAvatar reporter={report.reporter} />
                          <div className="min-w-0 flex-1">
                            <div className="text-white font-bold text-sm truncate">
                              {report.reporter?.username || 'Unknown User'}
                            </div>
                            <div className="text-[#a0a0a0] text-xs truncate font-medium">
                              {report.reporter?.email || 'Email not available'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#1f1f1f] rounded-xl p-4 border border-[#2a2a2a]/50 shadow-xl backdrop-blur-sm">
                        <h4 className="text-white font-bold mb-3 text-sm">Additional Details</h4>
                        {report.details ? (
                          <div className="bg-gradient-to-br from-[#111] to-[#151515] rounded-lg p-3 border border-[#2a2a2a]/50 shadow-inner">
                            <p className="text-[#d0d0d0] text-xs leading-relaxed break-words">
                              {report.details}
                            </p>
                          </div>
                        ) : (
                          <div className="text-[#666] text-xs italic bg-gradient-to-br from-[#111] to-[#151515] rounded-lg p-3 border border-[#2a2a2a]/50">
                            No additional details provided
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
