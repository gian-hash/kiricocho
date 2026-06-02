const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Post = require('../models/Post');

// GET /api/posts — lista post (bacheca)
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const posts = await Post.find()
    .sort({ pinned: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('author', 'nome cognome avatar role')
    .populate('comments.user', 'nome cognome');
  const total = await Post.countDocuments();
  res.json({ posts, total, page: Number(page) });
});

// POST /api/posts — crea post (admin o user)
router.post('/', auth, upload.single('image'), async (req, res) => {
  const { type, title, content } = req.body;
  if (!content) return res.status(400).json({ message: 'Contenuto obbligatorio.' });

  // Solo admin può pubblicare annunci pinnati
  const pinned = req.user.role === 'admin' && req.body.pinned === 'true';
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const post = await Post.create({ author: req.user._id, type, title, content, image, pinned });
  await post.populate('author', 'nome cognome avatar role');
  res.status(201).json({ post });
});

// POST /api/posts/:id/like — metti/togli like
router.post('/:id/like', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post non trovato.' });

  const idx = post.likes.indexOf(req.user._id);
  if (idx === -1) post.likes.push(req.user._id);
  else post.likes.splice(idx, 1);
  await post.save();

  res.json({ likes: post.likes.length, liked: idx === -1 });
});

// POST /api/posts/:id/comment — aggiungi commento
router.post('/:id/comment', auth, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Testo obbligatorio.' });

  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post non trovato.' });

  post.comments.push({ user: req.user._id, text });
  await post.save();
  await post.populate('comments.user', 'nome cognome');

  res.status(201).json({ comment: post.comments[post.comments.length - 1] });
});

// DELETE /api/posts/:id — elimina post (solo admin o autore)
router.delete('/:id', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post non trovato.' });

  if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Non autorizzato.' });
  }

  await post.deleteOne();
  res.json({ message: 'Post eliminato.' });
});

// PATCH /api/posts/:id/pin — pinna/spinna (solo admin)
router.patch('/:id/pin', auth, adminOnly, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post non trovato.' });
  post.pinned = !post.pinned;
  await post.save();
  res.json({ pinned: post.pinned });
});

module.exports = router;
