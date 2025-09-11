-- Seed vehicle_categories for FACILITACONSTRUÇÕES so they are visible under RLS
WITH data(name,label,icon_name,unique_id) AS (
  VALUES
    ('carro','Carro','Car','FACILITACONSTRUÇÕES'),
    ('moto','Moto','Bike','FACILITACONSTRUÇÕES'),
    ('caminhao_basculante','Caminhão Basculante','Truck','FACILITACONSTRUÇÕES'),
    ('caminhao_pipa','Caminhão Pipa','Truck','FACILITACONSTRUÇÕES'),
    ('carreta_prancha','Carreta Prancha','Truck','FACILITACONSTRUÇÕES'),
    ('caminhao_carroceria','Caminhão Carroceria','Truck','FACILITACONSTRUÇÕES'),
    ('retroescavadeira','Retroescavadeira/Valetadeira','Construction','FACILITACONSTRUÇÕES'),
    ('hidrojato','Hidrojato/Sucção/Roots','Truck','FACILITACONSTRUÇÕES'),
    ('pa_carregadeira','Pá Carregadeira','Construction','FACILITACONSTRUÇÕES'),
    ('escavadeira','Escavadeira/Trator Esteira','Construction','FACILITACONSTRUÇÕES'),
    ('motoniveladora','Motoniveladora','Construction','FACILITACONSTRUÇÕES'),
    ('rolo_compactador','Rolo Compactador','Construction','FACILITACONSTRUÇÕES'),
    ('caminhao_munck','Caminhão Munck','Crane','FACILITACONSTRUÇÕES')
)
INSERT INTO public.vehicle_categories (name,label,icon_name,unique_id)
SELECT d.name,d.label,d.icon_name,d.unique_id
FROM data d
WHERE NOT EXISTS (
  SELECT 1 FROM public.vehicle_categories vc 
  WHERE vc.name = d.name AND vc.unique_id = d.unique_id
);

-- Optionally ensure they are active
UPDATE public.vehicle_categories
SET active = true, updated_at = now()
WHERE unique_id = 'FACILITACONSTRUÇÕES' AND name IN (
  'carro','moto','caminhao_basculante','caminhao_pipa','carreta_prancha','caminhao_carroceria','retroescavadeira','hidrojato','pa_carregadeira','escavadeira','motoniveladora','rolo_compactador','caminhao_munck'
);