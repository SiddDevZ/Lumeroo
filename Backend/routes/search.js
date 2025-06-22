import { Hono } from 'hono'
import Video from '../models/Video.js'
import Image from '../models/Image.js'
import { rateLimiter } from 'hono-rate-limiter'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const buildSearchCriteria = (query, filters = {}) => {
  let searchCriteria = {};

  if (query && query.trim()) {
    const searchRegex = new RegExp(query.trim().split(' ').join('|'), 'i');
    searchCriteria.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } }
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    searchCriteria.createdAt = {};
    if (filters.dateFrom) {
      searchCriteria.createdAt.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      searchCriteria.createdAt.$lte = new Date(filters.dateTo);
    }
  }

  return searchCriteria;
};

const calculateRelevanceScore = (item, query) => {
  if (!query || !query.trim()) return item.hotness || 0;

  const searchTerms = query.toLowerCase().trim().split(' ');
  let score = item.hotness || 0;

  const title = (item.title || '').toLowerCase();
  const description = (item.description || '').toLowerCase();
  const tags = (item.tags || []).map(tag => tag.toLowerCase());

  searchTerms.forEach(term => {
    if (title.includes(term)) {
      score += title.startsWith(term) ? 10 : 5;
    }

    if (description.includes(term)) {
      score += 2;
    }

    tags.forEach(tag => {
      if (tag.includes(term)) {
        score += tag === term ? 8 : 3;
      }
    });
  });

  const engagementScore = (item.views * 0.01) + (item.likeCount * 0.5);
  score += engagementScore;

  return score;
};

router.get('/', limiter, async (c) => {
  try {
    const { 
      q: query = '', 
      limit = 20, 
      page = 1, 
      sort = 'relevance',
      type = 'all',
      dateFrom,
      dateTo
    } = c.req.query();

    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const filters = {
      dateFrom,
      dateTo
    };

    let results = [];
    let totalCount = 0;

    if (type === 'all' || type === 'videos') {
      const videoSearchCriteria = {
        ...buildSearchCriteria(query, filters),
        isProcessing: false
      };

      const videos = await Video.find(videoSearchCriteria)
        .populate('uploader', 'username avatar avatarColor subscriberCount')
        .select('title description slug thumbnail duration views likedBy dislikedBy tags createdAt hotness uploader')
        .lean();

      const formattedVideos = videos.map(video => ({
        _id: video._id,
        type: 'video',
        title: video.title,
        description: video.description,
        slug: video.slug,
        thumbnail: video.thumbnail,
        duration: video.duration,
        views: video.views,
        likeCount: video.likedBy?.length || 0,
        dislikeCount: video.dislikedBy?.length || 0,
        tags: video.tags || [],
        createdAt: video.createdAt,
        hotness: video.hotness || 0,
        uploader: {
          _id: video.uploader._id,
          username: video.uploader.username,
          avatar: video.uploader.avatar,
          avatarColor: video.uploader.avatarColor,
          subscriberCount: video.uploader.subscriberCount || 0
        },
        relevanceScore: calculateRelevanceScore({
          ...video,
          likeCount: video.likedBy?.length || 0
        }, query)
      }));

      results = results.concat(formattedVideos);
    }

    if (type === 'all' || type === 'images') {
      const imageSearchCriteria = buildSearchCriteria(query, filters);

      const images = await Image.find(imageSearchCriteria)
        .populate('uploader', 'username avatar avatarColor subscriberCount')
        .select('title description slug imageUrls thumbnailIndex views likedBy dislikedBy tags createdAt hotness uploader')
        .lean();

      const formattedImages = images.map(image => ({
        _id: image._id,
        type: 'image',
        title: image.title,
        description: image.description,
        slug: image.slug,
        imageUrls: image.imageUrls,
        thumbnailIndex: image.thumbnailIndex,
        thumbnail: image.imageUrls[image.thumbnailIndex] || image.imageUrls[0],
        views: image.views,
        likeCount: image.likedBy?.length || 0,
        dislikeCount: image.dislikedBy?.length || 0,
        tags: image.tags || [],
        createdAt: image.createdAt,
        hotness: image.hotness || 0,
        uploader: {
          _id: image.uploader._id,
          username: image.uploader.username,
          avatar: image.uploader.avatar,
          avatarColor: image.uploader.avatarColor,
          subscriberCount: image.uploader.subscriberCount || 0
        },
        relevanceScore: calculateRelevanceScore({
          ...image,
          likeCount: image.likedBy?.length || 0
        }, query)
      }));

      results = results.concat(formattedImages);
    }

    switch (sort) {
      case 'recent':
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'views':
        results.sort((a, b) => b.views - a.views);
        break;
      case 'hot':
        results.sort((a, b) => b.hotness - a.hotness);
        break;
      case 'relevance':
      default:
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
    }

    totalCount = results.length;
    const paginatedResults = results.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return c.json({
      success: true,
      results: paginatedResults,
      query: query.trim(),
      filters: {
        type,
        sort,
        dateFrom,
        dateTo
      },
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalResults: totalCount,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    }, 200);

  } catch (error) {
    console.error('Search error:', error);
    return c.json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    }, 500);
  }
});

export default router