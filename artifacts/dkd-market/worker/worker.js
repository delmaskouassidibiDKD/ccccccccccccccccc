eturn forbidden();
    const video = await queryOne(env.DB, `SELECT * FROM videos WHERE id = ?`, [req.params.id]);
    if (!video) return notFound('Vidéo non trouvée');
    if (video.user_id !== req.user.id && req.user.role !== 'admin') return forbidden('Non autorisé');
    const body = await req.json();
    const updates = {};
    if (body.title) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url;
    if (body.category_id !== undefined) updates.category_id = body.category_id;
    if (body.product_id !== undefined) updates.product_id = body.product_id;
    if (body.status) updates.status = body.status;
    if (Object.keys(updates).length > 0) {
      await update(env.DB, 'videos', updates, 'id = ?', [req.params.id]);
    }
    if (body.tags && Array.isArray(body.tags)) {
      await run(env.DB, `DELETE FROM video_tags WHERE video_id = ?`, [req.params.id]);
      for (const tag of body.tags) {
        await insert(env.DB, 'video_tags', { video_id: req.params.id, tag });
      }
    }
    return success({ id: req.params.id });
  });

  router.delete('/api/videos/:id', async (req, env) => {
    if (!req.user) return forbidden();
    const video = await queryOne(env.DB, `SELECT * FROM videos WHERE id = ?`, [req.params.id]);
    if (!video) return notFound('Vidéo non trouvée');
    if (video.user_id !== req.user.id && req.user.role !== 'admin') return forbidden('Non autorisé');
    await remove(env.DB, 'videos', 'id = ?', [req.params.id]);
    return success({ deleted: true });
  });

  router.post('/api/videos/:id/like', async (req, env) => {
    if (!req.user) return forbidden();
    const existing = await queryOne(env.DB, 'SELECT id FROM video_interactions WHERE video_id = ? AND user_id = ? AND interaction_type = ?', [req.params.id, req.user.id, 'like']);
    if (existing) return badRequest('Déjà aimé');
    await insert(env.DB, 'video_interactions', { video_id: req.params.id, user_id: req.user.id, interaction_type: 'like' });
    await run(env.DB, 'UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?', [req.params.id]);
    return success({ liked: true });
  });

  router.delete('/api/videos/:id/like', async (req, env) => {
    if (!req.user) return forbidden();
    const deleted = await remove(env.DB, 'video_interactions', 'video_id = ? AND user_id = ? AND interaction_type = ?', [req.params.id, req.user.id, 'like']);
    if (deleted) await run(env.DB, 'UPDATE videos SET likes_count = MAX(0, likes_count - 1) WHERE id = ?', [req.params.id]);
    return success({ unliked: true });
  });

  router.post('/api/videos/:id/share', async (req, env) => {
    if (!req.user) return forbidden();
    await insert(env.DB, 'video_interactions', { video_id: req.params.id, user_id: req.user.id, interaction_type: 'share' });
    await run(env.DB, 'UPDATE videos SET shares_count = shares_count + 1 WHERE id = ?', [req.params.id]);
    return success({ shared: true });
  });

  router.post('/api/videos/:id/view', async (req, env) => {
    await insert(env.DB, 'video_interactions', { video_id: req.params.id, user_id: req.user?.id || 0, interaction_type: 'view' });
    await run(env.DB, 'UPDATE videos SET views_count = views_count + 1 WHERE id = ?', [req.params.id]);
    return success({ viewed: true });
  });

  router.post('/api/videos/:id/comment', async (req, env) => {
    if (!req.user) return forbidden();
    const body = await req.json();
    if (!body.message) return badRequest('Message requis');
    await insert(env.DB, 'video_interactions', { video_id: req.params.id, user_id: req.user.id, interaction_type: 'comment' });
    return success(null, 'Commentaire enregistré');
  });

  router.get('/api/videos/:id/comments', async (req, env) => {
    const { page, limit, offset } = getPagination(req.url);
    const total = await queryOne(env.DB, `SELECT COUNT(*) as total FROM video_interactions WHERE video_id = ? AND interaction_type = 'comment'`, [req.params.id]);
    const rows = await query(env.DB,
      `SELECT vi.*, u.full_name as user_name FROM video_interactions vi LEFT JOIN users u ON vi.user_id = u.id WHERE vi.video_id = ? AND vi.interaction_type = 'comment' ORDER BY vi.created_at DESC LIMIT ? OFFSET ?`,
      [req.params.id, limit, offset]);
    return paginated(rows, total?.total || 0, page, limit);
  });

  router.get('/api/videos/:id/stats', async (req, env) => {
    if (!req.user) return forbidden();
    const video = await queryOne(env.DB, `SELECT * FROM videos WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    if (!video && req.user.role !== 'admin') return forbidden('Non autorisé');
    const stats = await queryOne(env.DB,
      `SELECT
        (SELECT COUNT(*) FROM video_interactions WHERE video_id = ? AND interaction_type = 'view') as total_views,
        (SELECT COUNT(*) FROM video_interactions WHERE video_id = ? AND interaction_type = 'like') as total_likes,
        (SELECT COUNT(*) FROM video_interactions WHERE video_id = ? AND interaction_type = 'share') as total_shares,
        (SELECT COUNT(*) FROM video_interactions WHERE video_id = ? AND interaction_type = 'comment') as total_comments`,
      [req.params.id, req.params.id, req.params.id, req.params.id]);
    return success(stats);
  });

  router.get('/api/videos/:id/tags', async (req, env) => {
    const tags = await query(env.DB, `SELECT tag FROM video_tags WHERE video_id = ?`, [req.params.id]);
    return success(tags.map(t => t.tag));
  });

  router.post('/api/videos/:id/report', async (req, env) => {
    if (!req.user) return forbidden();
    const body = await req.json();
    await insert(env.DB, 'reports', {
      report_code: `RPT-${generateCode(8)}`,
      reporter_id: req.user.id,
      target_type: 'video',
      target_id: req.params.id,
      reason: body.reason || 'other',
      description: body.description || null,
      status: 'pending',
    });
    return created({ reported: true });
  });

  router.get('/api/videos/user/:userId', async (req, env) => {
    const { page, limit, offset } = getPagination(req.url);
    const { userId } = req.params;
    const total = await queryOne(env.DB, `SELECT COUNT(*) as total FROM videos WHERE user_id = ? AND status = 'published'`, [userId]);
    const rows = await query(env.DB,
      `SELECT * FROM videos WHERE user_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]);
    return paginated(rows, total?.total || 0, page, limit);
  });

  router.get('/api/videos/my/list', async (req, env) => {
    if (!req.user) return forbidden();
    const { page, limit, offset } = getPagination(req.url);
    const total = await queryOne(env.DB, `SELECT COUNT(*) as total FROM videos WHERE user_id = ?`, [req.user.id]);
    const rows = await query(env.DB,
      `SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]);
    return paginated(rows, total?.total || 0, page, limit);
  });

  router.get('/api/videos/my/liked', async (req, env) => {
    if (!req.user) return forbidden();
    const { page, limit, offset } = getPagination(req.url);
    const total = await queryOne(env.DB, `SELECT COUNT(*) as total FROM video_interactions WHERE user_id = ? AND interaction_type = 'like'`, [req.user.id]);
    const rows = await query(env.DB,
      `SELECT v.* FROM videos v INNER JOIN video_interactions vi ON v.id = vi.video_id WHERE vi.user_id = ? AND vi.interaction_type = 'like' ORDER BY vi.created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]);
    return paginated(rows, total?.total || 0, page, limit);
  });

  router.put('/api/videos/:id/status', async (req, env) => {
    if (!req.user) return forbidden();
    const video = await queryOne(env.DB, `SELECT * FROM videos WHERE id = ?`, [req.params.id]);
    if (!video) return notFound('Vidéo non trouvée');
    if (video.user_id !== req.user.id && req.user.role !== 'admin') return forbidden('Non autorisé');
    const body = await req.json();
    if (!body.status) return badRequest('Statut requis');
    await run(env.DB, `UPDATE videos SET status = ? WHERE id = ?`, [body.status, req.params.id]);
    return success({ id: req.params.id, status: body.status });
  });
}

const router = new Router();

router.use(corsMiddleware);
router.use(authMiddleware);
router.use(rateLimitMiddleware);

registerAdminRoutes(router);
registerAuthRoutes(router);
registerCartRoutes(router);
registerCategoryRoutes(router);
registerCompanyRoutes(router);
registerDeliveryCodeRoutes(router);
registerDriverRoutes(router);
registerGroupRoutes(router);
registerImportRoutes(router);
registerInteractionRoutes(router);
registerLegalRoutes(router);
registerLiveRoutes(router);
registerLocationRoutes(router);
registerMessageRoutes(router);
registerMiscRoutes(router);
registerModerationRoutes(router);
registerNotificationRoutes(router);
registerOrderRoutes(router);
registerPaymentRoutes(router);
registerProductRoutes(router);
registerReferralRoutes(router);
registerReturnRoutes(router);
registerSellerRoutes(router);
registerStatsRoutes(router);
registerTimerRoutes(router);
registerUploadRoutes(router);
registerUserRoutes(router);
registerVideoRoutes(router);

const DEFAULT_JWT_SECRET = 'dkd-market-jwt-secret-2026-prod-x9k4m7p2q6r8s1t5v3w0y';

export default {
  async fetch(request, env, ctx) {
    if (!env.JWT_SECRET) env.JWT_SECRET = DEFAULT_JWT_SECRET;
    try { await env.DB.prepare("ALTER TABLE products ADD COLUMN min_order INTEGER DEFAULT NULL").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE products ADD COLUMN sale_mode TEXT DEFAULT NULL").run(); } catch {}
    const response = await router.handle(request, env, ctx);
    return withCors(response, request);
  },
  async scheduled(event, env, ctx) {
    if (!env.JWT_SECRET) env.JWT_SECRET = DEFAULT_JWT_SECRET;
    await handleScheduled(event, env);
  }
};