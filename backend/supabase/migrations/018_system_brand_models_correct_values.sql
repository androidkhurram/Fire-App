-- Replace generic L3000/L460/etc with brand-specific model values
-- Based on manufacturer documentation for kitchen fire suppression systems

-- Remove incorrectly seeded generic models
DELETE FROM public.system_brand_models;

-- Protex (ProTex II): L1600, L3000C, L4600C, L6000C (agent cylinder sizes)
INSERT INTO public.system_brand_models (brand_id, name, sort_order)
SELECT id, m.name, m.ord FROM public.system_brands b
CROSS JOIN (VALUES ('L1600', 1), ('L3000C', 2), ('L4600C', 3), ('L6000C', 4)) AS m(name, ord)
WHERE b.name = 'Protex';

-- PyroChem (Kitchen Knight II): PCL-160, PCL-300, PCL-460, PCL-600
INSERT INTO public.system_brand_models (brand_id, name, sort_order)
SELECT id, m.name, m.ord FROM public.system_brands b
CROSS JOIN (VALUES ('PCL-160', 1), ('PCL-300', 2), ('PCL-460', 3), ('PCL-600', 4)) AS m(name, ord)
WHERE b.name = 'PyroChem';

-- Kidde (WHDR): capacity-based - 1.6 gal, 3 gal, 4.6 gal, 6 gal
INSERT INTO public.system_brand_models (brand_id, name, sort_order)
SELECT id, m.name, m.ord FROM public.system_brands b
CROSS JOIN (VALUES ('1.6 Gal', 1), ('3 Gal', 2), ('4.6 Gal', 3), ('6 Gal', 4)) AS m(name, ord)
WHERE b.name = 'Kidde-range Guard';

-- Buckeye (Kitchen Mister): BFR-5, BFR-10, BFR-15, BFR-20 (flow points)
INSERT INTO public.system_brand_models (brand_id, name, sort_order)
SELECT id, m.name, m.ord FROM public.system_brands b
CROSS JOIN (VALUES ('BFR-5', 1), ('BFR-10', 2), ('BFR-15', 3), ('BFR-20', 4)) AS m(name, ord)
WHERE b.name = 'Buckeye';

-- Ansul (R-102): 1.5 gallon, 3 gallon tank sizes
INSERT INTO public.system_brand_models (brand_id, name, sort_order)
SELECT id, m.name, m.ord FROM public.system_brands b
CROSS JOIN (VALUES ('1.5 Gal', 1), ('3 Gal', 2)) AS m(name, ord)
WHERE b.name = 'Ansul';

-- Amerex (KP Kitchen Protection): 275, 375, 475, 600 (2.75, 3.75, 4.75, 6.0 gal)
INSERT INTO public.system_brand_models (brand_id, name, sort_order)
SELECT id, m.name, m.ord FROM public.system_brands b
CROSS JOIN (VALUES ('275', 1), ('375', 2), ('475', 3), ('600', 4)) AS m(name, ord)
WHERE b.name = 'Amerex';
