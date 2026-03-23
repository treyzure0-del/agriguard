const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const {
  createPost, getAllPosts, getPostById,
  toggleLike, hasLiked, addComment, getComments, deletePost
} = require('../database');
 
const router = express.Router();
 
// Ensure post images directory exists
const postImagesDir = path.join(__dirname, '../../frontend/post-images');
if (!fs.existsSync(postImagesDir)) fs.mkdirSync(postImagesDir, { recursive: true });
 
// Multer config for post images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, postImagesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `post-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
 
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});
 
const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many posts. Please slow down.' }
});
 
const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many comments. Please slow down.' }
});
 
// GET /api/community/posts — get all posts
router.get('/posts', optionalAuth, (req, res) => {
  try {
    const posts = getAllPosts(50);
    // Add liked status for logged-in users
    const enriched = posts.map(p => ({
      ...p,
      liked_by_me: req.user ? hasLiked(p.id, req.user.id) : false
    }));
    res.json(enriched);
  } catch (err) {
    console.error('[community] GET posts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});
 
// POST /api/community/posts — create a post with optional image
router.post('/posts', postLimiter, requireAuth, upload.single('image'), (req, res) => {
  const { title, content, category } = req.body;
 
  if (!title || !title.trim()) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Post title is required' });
  }
  if (!content || !content.trim()) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Post content is required' });
  }
  if (title.trim().length > 150) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Title must be under 150 characters' });
  }
  if (content.trim().length > 2000) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Content must be under 2000 characters' });
  }
 
  const validCategories = ['general', 'disease', 'pest', 'soil', 'harvest', 'weather', 'market'];
  const cat = validCategories.includes(category) ? category : 'general';
  const image_url = req.file ? `/post-images/${req.file.filename}` : null;
 
  try {
    const post = createPost({
      user_id: req.user.id,
      author_name: req.user.name,
      title: title.trim(),
      content: content.trim(),
      category: cat,
      image_url
    });
    res.status(201).json({ ...post, liked_by_me: false });
  } catch (err) {
    console.error('[community] POST post error:', err.message);
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'Failed to create post' });
  }
});
 
// POST /api/community/posts/:id/like — toggle like
router.post('/posts/:id/like', requireAuth, (req, res) => {
  const postId = parseInt(req.params.id);
  if (!postId) return res.status(400).json({ error: 'Invalid post ID' });
 
  const post = getPostById(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
 
  try {
    const result = toggleLike(postId, req.user.id);
    const updated = getPostById(postId);
    res.json({ liked: result.liked, likes: updated.likes });
  } catch (err) {
    console.error('[community] Like error:', err.message);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});
 
// GET /api/community/posts/:id/comments — get comments for a post
router.get('/posts/:id/comments', (req, res) => {
  const postId = parseInt(req.params.id);
  if (!postId) return res.status(400).json({ error: 'Invalid post ID' });
  try {
    res.json(getComments(postId));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});
 
// POST /api/community/posts/:id/comments — add a comment
router.post('/posts/:id/comments', commentLimiter, requireAuth, (req, res) => {
  const postId = parseInt(req.params.id);
  const { content } = req.body;
 
  if (!postId) return res.status(400).json({ error: 'Invalid post ID' });
  if (!content || !content.trim())
    return res.status(400).json({ error: 'Comment content is required' });
  if (content.trim().length > 500)
    return res.status(400).json({ error: 'Comment must be under 500 characters' });
 
  const post = getPostById(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
 
  try {
    const comment = addComment({
      post_id: postId,
      user_id: req.user.id,
      author_name: req.user.name,
      content: content.trim()
    });
    res.status(201).json(comment);
  } catch (err) {
    console.error('[community] Comment error:', err.message);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});
 
// DELETE /api/community/posts/:id — delete own post
router.delete('/posts/:id', requireAuth, (req, res) => {
  const postId = parseInt(req.params.id);
  try {
    const deleted = deletePost(postId, req.user.id);
    if (!deleted) return res.status(403).json({ error: 'Cannot delete this post' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});
 
module.exports = router;
 
