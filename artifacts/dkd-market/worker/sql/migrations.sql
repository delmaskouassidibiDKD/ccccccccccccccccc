-- ============================================================
-- MIGRATION D1 — DKD-MARKET
-- À exécuter dans : Cloudflare Dashboard → D1 → ta base → Console
-- Exécuter chaque ligne séparément (D1 ne supporte pas les batches ALTER TABLE)
-- ============================================================

ALTER TABLE products ADD COLUMN sale_mode TEXT DEFAULT 'normal_only';
ALTER TABLE products ADD COLUMN currency_code TEXT DEFAULT 'XOF';
ALTER TABLE products ADD COLUMN min_order INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN units TEXT;
ALTER TABLE products ADD COLUMN unit_pricing TEXT;
ALTER TABLE products ADD COLUMN wholesale_params TEXT;
