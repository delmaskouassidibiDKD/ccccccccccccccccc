import { query, queryOne, run, insert, update, remove, count, exists } from '../utils/db.js';
import { success, created, paginated, getPagination, getSearchParams, badRequest, notFound, forbidden, error } from '../utils/response.js';
import { requireSeller, requireAdmin } from '../middleware/auth.js';
import { generateId, generateCode } from '../utils/crypto.js';
import { uploadFile, deleteFile, parseMultipart, getProductImageKey, getProductVideoKey } from '../utils/r2.js';

export function registerProductRoutes(router) {

  router.get('/api/products', async (req, env) => {
    const { page, limit, offset } = getPagination(req.url);
    const params = getSearchParams(req.url);
    let where = 'p.is_active = 1';
    const binds = [];
    if (params.category_id) { where += ' AND p.category_id = ?'; binds.push(params.category_id); }
    if (params.country_id) { where += ' AND p.country_id = ?'; binds.push(params.country_id); }
    if (params.seller_id) { where += ' AND p.seller_id = ?'; binds.push(params.seller_id); }
    if (params.min_price) { where += ' AND p.price >= ?'; binds.push(parseFloat(params.min_price)); }
    if (params.max_price) { where += ' AND p.price <= ?'; binds.push(parseFloat(params.max_price)); }
    if (params.label) { where += ' AND p.label = ?'; binds.push(params.label); }
    if (params.sale_mode) { where += ' AND p.sale_mode = ?'; binds.push(params.sale_mode); }
    let orderBy = 'p.created_at DESC';
    if (params.sort === 'price_asc') orderBy = 'p.price ASC';
    else if (params.sort === 'price_desc') orderBy = 'p.price DESC';
    else if (params.sort === 'popular') orderBy = 'p.is_featured DESC, p.created_at DESC';
    const total = await count(env.DB, 'products p', where, binds);
    const rows = await query(env.DB,
      `SELECT p.*, s.shop_name, c.name as category_name FROM products p JOIN sellers s ON p.seller_id = s.id JOIN categories c ON p.category_id = c.id WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...binds, limit, offset]);
    return paginated(rows, total, page, limit);
  });

  router.get('/api/products/search', async (req, env) => {
    const { page, limit, offset } = getPagination(req.url);
    const params = getSearchParams(req.url);
    const q = params.q || '';
    if (!q) return badRequest('Paramètre q requis');
    let where = '(p.name LIKE ? OR p.description LIKE ?) AND p.is_active = 1';
    const binds = [`%${q}%`, `%${q}%`];
    if (params.category_id) { where += ' AND p.category_id = ?'; binds.push(params.category_id); }
    if (params.country_id) { where += ' AND p.country_id = ?'; binds.push(params.country_id); }
    const total = await count(env.DB, 'products p', where, binds);
    const rows = await query(env.DB,
      `SELECT p.*, s.shop_name, c.name as category_name FROM products p JOIN sellers s ON p.seller_id = s.id JOIN categories c ON p.category_id = c.id WHERE ${where} ORDER BY p.is_featured DESC, p.created_at DESC LIMIT ? OFFSET ?`,
      [...binds, limit, offset]);
    return paginated(rows, total, page, limit);
  });

  router.get('/api/products/featured', async (req, env) => {
    const { limit } = getPagination(req.url);
    const params = getSearchParams(req.url);
    let where = 'p.is_active = 1 AND p.is_featured = 1';
    const binds = [];
    if (params.country_id) { where += ' AND p.country_id = ?'; binds.push(params.country_id); }
    const rows = await query(env.DB,
      `SELECT p.*, s.shop_name FROM products p JOIN sellers s ON p.seller_id = s.id WHERE ${where} ORDER BY p.created_at DESC LIMIT ?`,
      [...binds, limit]);
    return success(rows);
  });

  router.get('/api/products/promos', async (req, env) => {
    const { page, limit, offset } = getPagination(req.url);
    const where = 'p.is_active = 1 AND p.original_price IS NOT NULL AND p.price < p.original_price';
    const binds = [];
    const total = await count(env.DB, 'products p', where, binds);
    const rows = await query(env.DB,
      `SELECT p.*, s.shop_name, ROUND((1 - p.price / p.original_price) * 100) as discount_pct FROM products p JOIN sellers s ON p.seller_id = s.id WHERE ${where} ORDER BY discount_pct DESC LIMIT ? OFFSET ?`,
      [...binds, limit, offset]);
    return paginated(rows, total, page, limit);
  });

  router.get('/api/products/trending', async (req, env) => {
    const { limit } = getPagination(req.url);
    const rows = await query(env.DB,
      `SELECT p.*, s.shop_name, COUNT(oi.id) as order_count FROM products p JOIN sellers s ON p.seller_id = s.id LEFT JOIN order_items oi ON p.id = oi.product_id LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= datetime('now', '-7 days') WHERE p.is_active = 1 GROUP BY p.id ORDER BY order_count DESC LIMIT ?`,
      [limit]);
    return success(rows);
  });

  router.get('/api/products/recommended', async (req, env) => {
    const { limit } = getPagination(req.url);
    const params = getSearchParams(req.url);
    let where = 'p.is_active = 1';
    const binds = [];
    if (params.country_id) { where += ' AND p.country_id = ?'; binds.push(params.country_id); }
    const rows = await query(env.DB,
      `SELECT p.*, s.shop_name FROM products p JOIN sellers s ON p.seller_id = s.id WHERE ${where} ORDER BY RANDOM() LIMIT ?`,
      [...binds, limit]);
    return success(rows);
  });

  router.get('/api/products/category/:categoryId', async (req, env) => {
    const { page, limit, offset } = getPagination(req.url);
    const total = await count(env.DB, 'products', 'category_id = ? AND is_active = 1', [req.params.categoryId]);
    const rows = await query(env.DB,
      `SELECT p.*, s.shop_name FROM products p JOIN sellers s ON p.seller_id = s.id WHERE p.category_id = ? AND p.is_active = 1 ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [req.params.categoryId, limit, offset]);
    return paginated(rows, total, page, limit);
  });

  router.get('/api/products/country/:countryId', async (req, env) => {
    const { page, limit, offset } = getPagination(req.url);
    const total = await count(env.DB, 'products', 'country_id = ? AND is_active = 1', [req.params.countryId]);
    const rows = await query(env.DB,
      `SELECT p.*, s.shop_name, c.name as category_name FROM products p JOIN sellers s ON p.seller_id = s.id JOIN categories c ON p.category_id = c.id WHERE p.country_id = ? AND p.is_active = 1 ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [req.params.countryId, limit, offset]);
    return paginated(rows, total, page, limit);
  });

  router.get('/api/products/:id', async (req, env) => {
    const product = await queryOne(env.DB,
      `SELECT p.*, s.shop_name, s.rating as seller_rating, s.logo as seller_logo, c.name as category_name, co.name as country_name FROM products p JOIN sellers s ON p.seller_id = s.id JOIN categories c ON p.category_id = c.id JOIN countries co ON p.country_id = co.id WHERE p.id = ?`,
      [req.params.id]);
    if (!product) return notFound('Produit non trouvé');
    const reviews = await query(env.DB,
      `SELECT r.*, u.full_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC LIMIT 5`,
      [req.params.id]);
    const avgRating = await queryOne(env.DB,
      `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ?`,
      [req.params.id]);
    const related = await query(env.DB,
      `SELECT p.*, s.shop_name FROM products p JOIN sellers s ON p.seller_id = s.id WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1 ORDER BY RANDOM() LIMIT 6`,
      [product.category_id, req.params.id]);
    let wholesalePrices = null;
    if (product.wholesale_prices) { try { wholesalePrices = JSON.parse(product.wholesale_prices); } catch {} }
    let unitPricing = null;
    if (product.unit_pricing) { try { unitPricing = JSON.parse(product.unit_pricing); } catch {} }
    let wholesaleParams = null;
    if (product.wholesale_params) { try { wholesaleParams = JSON.parse(product.wholesale_params); } catch {} }
    let unitsList = null;
    if (product.units) { try { unitsList = JSON.parse(product.units); } catch {} }
    const traceability = await queryOne(env.DB,
      `SELECT * FROM product_traceability WHERE product_id = ? ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]);
    return success({
      ...product,
      reviews,
      avg_rating: avgRating?.avg_rating || 0,
      review_count: avgRating?.count || 0,
      related_products: related,
      wholesale_prices_parsed: wholesalePrices,
      unit_pricing_parsed: unitPricing,
      wholesale_params_parsed: wholesaleParams,
      units_list: unitsList,
      traceability,
    });
  });

  router.post('/api/products', requireSeller, async (req, env) => {
    const body = await req.json();
    if (!body.name || (body.price === undefined || body.price === null) || !body.category_id || !body.country_id) {
      return badRequest('Champs requis: name, price, category_id, country_id');
    }
    const seller = await queryOne(env.DB, 'SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (!seller) return forbidden('Profil vendeur requis');
    const id = await insert(env.DB, 'products', {
      seller_id:         req.user.id,
      category_id:       body.category_id,
      country_id:        body.country_id,
      country_code:      body.country_code || seller.country_code,
      name:              body.name,
      description:       body.description || null,
      price:             body.price,
      original_price:    body.original_price || null,
      wholesale_price:   body.wholesale_price || null,
      wholesale_prices:  body.wholesale_prices  ? JSON.stringify(body.wholesale_prices)  : null,
      stock_quantity:    body.stock_quantity || 0,
      unit:              body.unit || null,
      min_order:         body.min_order || null,
      is_wholesale_only: body.is_wholesale_only || 0,
      sale_mode:         body.sale_mode || null,
      images:            body.images            ? JSON.stringify(body.images)            : null,
      video_url:         body.video_url || null,
      label:             body.label || null,
      target_countries:  body.target_countries  ? JSON.stringify(body.target_countries)  : null,
      currency_code:     body.currency_code || 'XOF',
      units:             body.units             ? JSON.stringify(body.units)             : null,
      unit_pricing:      body.unit_pricing      ? JSON.stringify(body.unit_pricing)      : null,
      wholesale_params:  body.wholesale_params  ? JSON.stringify(body.wholesale_params)  : null,
    });
    const product = await queryOne(env.DB, 'SELECT * FROM products WHERE id = ?', [id]);
    return created(product, 'Produit créé');
  });

  router.put('/api/products/:id', requireSeller, async (req, env) => {
    const product = await queryOne(env.DB, 'SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return notFound('Produit non trouvé');
    if (product.seller_id !== req.user.userId && req.user.role !== 'admin') return forbidden();
    const body = await req.json();
    const allowed = [
      'name', 'description', 'price', 'original_price', 'wholesale_price', 'stock_quantity',
      'unit', 'is_active', 'is_featured', 'is_wholesale_only', 'video_url', 'label', 'category_id',
      'sale_mode', 'currency_code', 'min_order',
    ];
    const data = {};
    for (const k of allowed) { if (body[k] !== undefined) data[k] = body[k]; }
    if (body.wholesale_prices)  data.wholesale_prices  = JSON.stringify(body.wholesale_prices);
    if (body.images)            data.images            = JSON.stringify(body.images);
    if (body.target_countries)  data.target_countries  = JSON.stringify(body.target_countries);
    if (body.units)             data.units             = JSON.stringify(body.units);
    if (body.unit_pricing)      data.unit_pricing      = JSON.stringify(body.unit_pricing);
    if (body.wholesale_params)  data.wholesale_params  = JSON.stringify(body.wholesale_params);
    if (Object.keys(data).length === 0) return badRequest('Aucune donnée');
    await update(env.DB, 'products', data, 'id = ?', [req.params.id]);
    const updated = await queryOne(env.DB, 'SELECT * FROM products WHERE id = ?', [req.params.id]);
    return success(updated, 'Produit mis à jour');
  });

  router.delete('/api/products/:id', requireSeller, async (req, env) => {
    const product = await queryOne(env.DB, 'SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return notFound('Produit non trouvé');
    if (product.seller_id !== req.user.userId && req.user.role !== 'admin') return forbidden();
    await update(env.DB, 'products', { is_active: 0 }, 'id = ?', [req.params.id]);
    return success(null, 'Produit supprimé');
  });

  router.post('/api/products/:id/images', requireSeller, async (req, env) => {
    const product = await queryOne(env.DB, 'SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return notFound('Produit non trouvé');
    if (product.seller_id !== req.user.userId && req.user.role !== 'admin') return forbidden();
    const { files } = await parseMultipart(req);
    const uploadedKeys = [];
    for (const [name, file] of Object.entries(files)) {
      const ext = file.name ? file.name.split('.').pop() : 'jpg';
      const key = getProductImageKey(req.params.id, `${Date.now()}-${name}.${ext}`);
      await uploadFile(env.R2, key, file.data, { contentType: file.type || 'image/jpeg' });
      uploadedKeys.push(key);
    }
    let currentImages = [];
    if (product.images) { try { currentImages = JSON.parse(product.images); } catch {} }
    const allImages = [...currentImages, ...uploadedKeys];
    await update(env.DB, 'products', { images: JSON.stringify(allImages) }, 'id = ?', [req.params.id]);
    return success({ images: allImages }, 'Images ajoutées');
  });

  router.delete('/api/products/:id/images/:imageIndex', requireSeller, async (req, env) => {
    const product = await queryOne(env.DB, 'SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return notFound('Produit non trouvé');
    if (product.seller_id !== req.user.userId && req.user.role !== 'admin') return forbidden();
    let images = [];
    if (product.images) { try { images = JSON.parse(product.images); } catch {} }
    const idx = parseInt(req.params.imageIndex);
    if (idx < 0 || idx >= images.length) return badRequest('Index image invalide');
    const removed = images.splice(idx, 1)[0];
    try { await deleteFile(env.R2, removed); } catch {}
    await update(env.DB, 'products', { images: JSON.stringify(images) }, 'id = ?', [req.params.id]);
    return success({ images }, 'Image supprimée');
  });

  router.post('/api/products/:id/video', requireSeller, async (req, env) => {
    const product = await queryOne(env.DB, 'SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return notFound('Produit non trouvé');
    if (product.seller_id !== req.user.userId && req.user.role !== 'admin') return forbidden();
    const { files } = await parseMultipart(req);
    if (!files.video) return badRequest('Fichier vidéo requis');
    const key = getProductVideoKey(req.params.id, `${Date.now()}-${files.video.name || 'video.mp4'}`);
    await uploadFile(env.R2, key, files.video.data, { contentType: files.video.type || 'video/mp4' });
    await update(env.DB, 'products', { video_url: key }, 'id = ?', [req.params.id]);
    return success({ video_url: key }, 'Vidéo ajoutée');
  });

  router.get('/api/products/:id/reviews', async (req, env) => {
    const { page, limit, offset } = getPagination(req.url);
    const total = await count(env.DB, 'reviews', 'product_id = ?', [req.params.id]);
    const rows = await query(env.DB,
      `SELECT r.*, u.full_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [req.params.id, limit, offset]);
    return paginated(rows, total, page, limit);
  });

  router.post('/api/products/:id/reviews', requireSeller, async (req, env) => {
    const body = await req.json();
    if (!body.rating || body.rating < 1 || body.rating > 5) return badRequest('Note invalide (1-5)');
    const already = await exists(env.DB, 'reviews', 'product_id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    if (already) return badRequest('Vous avez déjà évalué ce produit');
    const id = await insert(env.DB, 'reviews', {
      product_id: req.params.id, user_id: req.user.userId,
      rating: body.rating, comment: body.comment || null,
    });
    const review = await queryOne(env.DB,
      `SELECT r.*, u.full_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.id = ?`, [id]);
    return created(review, 'Avis ajouté');
  });

  router.get('/api/seller/products', requireSeller, async (req, env) => {
    const { page, limit, offset } = getPagination(req.url);
    const total = await count(env.DB, 'products', 'seller_id = ?', [req.user.userId]);
    const rows = await query(env.DB,
      `SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.seller_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [req.user.userId, limit, offset]);
    return paginated(rows, total, page, limit);
  });
}
