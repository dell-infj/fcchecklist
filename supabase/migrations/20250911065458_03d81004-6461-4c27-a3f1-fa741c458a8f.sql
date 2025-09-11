-- Fix existing vehicle categories to match new specific categories
-- This migration updates vehicles that are using old generic categories

-- Update 'caminhao' vehicles to more specific categories based on typical usage
UPDATE vehicles 
SET vehicle_category = 'caminhao_carroceria'
WHERE vehicle_category = 'caminhao';

-- Update 'carro' vehicles to the standardized category  
UPDATE vehicles 
SET vehicle_category = 'carro'
WHERE vehicle_category IN ('carro', 'CARRO');

-- Update 'moto' vehicles to the standardized category
UPDATE vehicles 
SET vehicle_category = 'moto' 
WHERE vehicle_category IN ('moto', 'MOTO');

-- Update 'retroescavadeira' vehicles to the standardized category
UPDATE vehicles 
SET vehicle_category = 'retroescavadeira'
WHERE vehicle_category IN ('retroescavadeira', 'RETROESCAVADEIRA');