// ============================================================
// PATCH : worker/src/routes/products.js
// Remplacer le handler POST '/api/products' et PUT '/api/products/:id'
// par les versions ci-dessous.
// ============================================================

// ──────────────────────────────────────────────
// NOUVEAU handler POST (remplace l'existant)
// ──────────────────────────────────────────────
/*
  router.post('/api/products', requireSeller, async (req, env) => {
    const body = await req.json();
    // price peut être 0 pour les produits wholesale_only
    if (!body.name || body.price === undefined || body.price === null || !body.category_id || !body.country_id) {
      return badRequest('Champs requis: name, price, category_id, country_id');
    }
    const seller = await queryOne(env.DB, 'SELECT * FROM sellers WHERE id = ? AND is_active = 1', [req.user.userId]);
    if (!seller) return forbidden('Profil vendeur requis');
    const id = await insert(env.DB, 'products', {
      seller_id:          req.user.userId,
      category_id:        body.category_id,
      country_id:         body.country_id,
      country_code:       body.country_code || seller.country_code,
      name:               body.name,
      description:        body.description || null,
      price:              body.price,
      original_price:     body.original_price || null,
      wholesale_price:    body.wholesale_price || null,
      wholesale_prices:   body.wholesale_prices   ? JSON.stringify(body.wholesale_prices)   : null,
      stock_quantity:     body.stock_quantity || 0,
      unit:               body.unit || null,
      is_wholesale_only:  body.is_wholesale_only || 0,
      images:             body.images             ? JSON.stringify(body.images)             : null,
      video_url:          body.video_url || null,
      label:              body.label || null,
      target_countries:   body.target_countries   ? JSON.stringify(body.target_countries)   : null,
      // ── Nouveaux champs ──
      sale_mode:          body.sale_mode || 'normal_only',
      currency_code:      body.currency_code || 'XOF',
      min_order:          body.min_order != null ? Number(body.min_order) : 1,
      units:              body.units              ? JSON.stringify(body.units)              : null,
      unit_pricing:       body.unit_pricing       ? JSON.stringify(body.unit_pricing)       : null,
      wholesale_params:   body.wholesale_params   ? JSON.stringify(body.wholesale_params)   : null,
    });
    const product = await queryOne(env.DB, 'SELECT * FROM products WHERE id = ?', [id]);
    return created(product, 'Produit créé');
  });
*/

// ──────────────────────────────────────────────
// NOUVEAU handler PUT (remplace l'existant)
// ──────────────────────────────────────────────
/*
  router.put('/api/products/:id', requireSeller, async (req, env) => {
    const product = await queryOne(env.DB, 'SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return notFound('Produit non trouvé');
    if (product.seller_id !== req.user.userId && req.user.role !== 'admin') return forbidden();
    const body = await req.json();
    const allowed = [
      'name', 'description', 'price', 'original_price', 'wholesale_price', 'stock_quantity',
      'unit', 'is_active', 'is_featured', 'is_wholesale_only', 'video_url', 'label', 'category_id',
      // Nouveaux champs scalaires
      'sale_mode', 'currency_code', 'min_order',
    ];
    const data = {};
    for (const k of allowed) { if (body[k] !== undefined) data[k] = body[k]; }
    if (body.wholesale_prices)  data.wholesale_prices  = JSON.stringify(body.wholesale_prices);
    if (body.images)            data.images            = JSON.stringify(body.images);
    if (body.target_countries)  data.target_countries  = JSON.stringify(body.target_countries);
    // Nouveaux champs JSON
    if (body.units)             data.units             = JSON.stringify(body.units);
    if (body.unit_pricing)      data.unit_pricing      = JSON.stringify(body.unit_pricing);
    if (body.wholesale_params)  data.wholesale_params  = JSON.stringify(body.wholesale_params);
    if (Object.keys(data).length === 0) return badRequest('Aucune donnée');
    await update(env.DB, 'products', data, 'id = ?', [req.params.id]);
    const updated = await queryOne(env.DB, 'SELECT * FROM products WHERE id = ?', [req.params.id]);
    return success(updated, 'Produit mis à jour');
  });
*/
