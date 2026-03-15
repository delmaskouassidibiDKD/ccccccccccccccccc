-- ============================================================
-- MIGRATION D1 : Colonnes manquantes dans la table products
-- À exécuter dans Cloudflare Dashboard > D1 > Votre base > Console
-- ============================================================

ALTER TABLE products ADD COLUMN sale_mode TEXT DEFAULT 'normal_only';
ALTER TABLE products ADD COLUMN currency_code TEXT DEFAULT 'XOF';
ALTER TABLE products ADD COLUMN min_order INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN units TEXT;
ALTER TABLE products ADD COLUMN unit_pricing TEXT;
ALTER TABLE products ADD COLUMN wholesale_params TEXT;
