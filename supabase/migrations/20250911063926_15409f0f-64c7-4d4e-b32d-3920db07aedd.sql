-- Continuar adicionando itens para as categorias restantes
-- CAMINHÃO CARROCERIA
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Carroceria', 'Verificar estado estrutural da carroceria', 'caminhao_carroceria', true, 1, 'FACILITACONSTRUÇÕES'),
('Lona/Tampa', 'Verificar cobertura da carga', 'caminhao_carroceria', true, 2, 'FACILITACONSTRUÇÕES'),
('Pneus dianteiros', 'Verificar estado, calibragem e desgaste', 'caminhao_carroceria', true, 3, 'FACILITACONSTRUÇÕES'),
('Pneus traseiros', 'Verificar estado, calibragem e desgaste', 'caminhao_carroceria', true, 4, 'FACILITACONSTRUÇÕES'),
('Freios', 'Testar sistema de freios', 'caminhao_carroceria', true, 5, 'FACILITACONSTRUÇÕES'),
('Motor', 'Verificar funcionamento do motor', 'caminhao_carroceria', true, 6, 'FACILITACONSTRUÇÕES'),
('Sistema elétrico', 'Verificar funcionamento do sistema elétrico', 'caminhao_carroceria', true, 7, 'FACILITACONSTRUÇÕES'),
('Faróis e lanternas', 'Verificar iluminação completa', 'caminhao_carroceria', true, 8, 'FACILITACONSTRUÇÕES'),
('Espelhos retrovisores', 'Verificar todos os espelhos', 'caminhao_carroceria', true, 9, 'FACILITACONSTRUÇÕES'),
('Buzina', 'Testar funcionamento da buzina', 'caminhao_carroceria', true, 10, 'FACILITACONSTRUÇÕES'),
('Portas da carroceria', 'Verificar fechamento e travas', 'caminhao_carroceria', true, 11, 'FACILITACONSTRUÇÕES'),
('Óleo do motor', 'Verificar nível e estado do óleo', 'caminhao_carroceria', true, 12, 'FACILITACONSTRUÇÕES'),
('Documentação', 'Verificar CRLV e documentos obrigatórios', 'caminhao_carroceria', true, 13, 'FACILITACONSTRUÇÕES'),
('Extintor de incêndio', 'Verificar presença e validade', 'caminhao_carroceria', true, 14, 'FACILITACONSTRUÇÕES'),
('Kit de ferramentas', 'Verificar ferramentas básicas', 'caminhao_carroceria', true, 15, 'FACILITACONSTRUÇÕES'),
('Bateria', 'Verificar estado da bateria', 'caminhao_carroceria', true, 16, 'FACILITACONSTRUÇÕES'),
('Suspensão', 'Verificar sistema de suspensão', 'caminhao_carroceria', false, 17, 'FACILITACONSTRUÇÕES'),
('Cabine', 'Verificar estado da cabine', 'caminhao_carroceria', false, 18, 'FACILITACONSTRUÇÕES');

-- CARRETA PRANCHA
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Prancha basculante', 'Testar funcionamento do sistema de basculamento da prancha', 'carreta_prancha', true, 1, 'FACILITACONSTRUÇÕES'),
('Sistema hidráulico', 'Verificar óleo e funcionamento do sistema hidráulico', 'carreta_prancha', true, 2, 'FACILITACONSTRUÇÕES'),
('Pneus do cavalo', 'Verificar pneus do cavalo mecânico', 'carreta_prancha', true, 3, 'FACILITACONSTRUÇÕES'),
('Pneus da carreta', 'Verificar todos os pneus da carreta', 'carreta_prancha', true, 4, 'FACILITACONSTRUÇÕES'),
('Freios', 'Testar sistema de freios do conjunto', 'carreta_prancha', true, 5, 'FACILITACONSTRUÇÕES'),
('Quinta roda', 'Verificar acoplamento da quinta roda', 'carreta_prancha', true, 6, 'FACILITACONSTRUÇÕES'),
('Correntes e catracas', 'Verificar equipamentos de amarração', 'carreta_prancha', true, 7, 'FACILITACONSTRUÇÕES'),
('Sinalização', 'Verificar luzes e refletores da carreta', 'carreta_prancha', true, 8, 'FACILITACONSTRUÇÕES'),
('Suspensão', 'Verificar sistema de suspensão', 'carreta_prancha', true, 9, 'FACILITACONSTRUÇÕES'),
('Motor', 'Verificar funcionamento do motor', 'carreta_prancha', true, 10, 'FACILITACONSTRUÇÕES'),
('Sistema elétrico', 'Verificar conexões elétricas entre cavalo e carreta', 'carreta_prancha', true, 11, 'FACILITACONSTRUÇÕES'),
('Documentação', 'Verificar CRLV de cavalo e carreta', 'carreta_prancha', true, 12, 'FACILITACONSTRUÇÕES'),
('Extintor de incêndio', 'Verificar presença e validade do extintor', 'carreta_prancha', true, 13, 'FACILITACONSTRUÇÕES'),
('Triângulos de segurança', 'Verificar presença dos triângulos', 'carreta_prancha', true, 14, 'FACILITACONSTRUÇÕES'),
('Pneu sobressalente', 'Verificar estado do estepe', 'carreta_prancha', true, 15, 'FACILITACONSTRUÇÕES'),
('Ferramentas', 'Verificar kit de ferramentas', 'carreta_prancha', false, 16, 'FACILITACONSTRUÇÕES'),
('Cabine', 'Verificar estado da cabine', 'carreta_prancha', false, 17, 'FACILITACONSTRUÇÕES'),
('Estrutura da prancha', 'Verificar integridade estrutural', 'carreta_prancha', false, 18, 'FACILITACONSTRUÇÕES');

-- RETROESCAVADEIRA
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Sistema hidráulico', 'Verificar funcionamento geral do sistema hidráulico', 'retroescavadeira', true, 1, 'FACILITACONSTRUÇÕES'),
('Braço escavador', 'Testar movimentação do braço escavador', 'retroescavadeira', true, 2, 'FACILITACONSTRUÇÕES'),
('Caçamba dianteira', 'Verificar funcionamento da caçamba/lâmina dianteira', 'retroescavadeira', true, 3, 'FACILITACONSTRUÇÕES'),
('Caçamba traseira', 'Verificar funcionamento da caçamba traseira', 'retroescavadeira', true, 4, 'FACILITACONSTRUÇÕES'),
('Rotação da torre', 'Testar rotação da estrutura superior', 'retroescavadeira', true, 5, 'FACILITACONSTRUÇÕES'),
('Pneus', 'Verificar estado de todos os pneus', 'retroescavadeira', true, 6, 'FACILITACONSTRUÇÕES'),
('Motor', 'Verificar funcionamento do motor', 'retroescavadeira', true, 7, 'FACILITACONSTRUÇÕES'),
('Sistema elétrico', 'Verificar funcionamento do sistema elétrico', 'retroescavadeira', true, 8, 'FACILITACONSTRUÇÕES'),
('Faróis de trabalho', 'Testar todos os faróis de iluminação', 'retroescavadeira', true, 9, 'FACILITACONSTRUÇÕES'),
('Buzina de ré', 'Testar alarme sonoro de ré', 'retroescavadeira', true, 10, 'FACILITACONSTRUÇÕES'),
('Freios', 'Testar sistema de freios', 'retroescavadeira', true, 11, 'FACILITACONSTRUÇÕES'),
('Óleo hidráulico', 'Verificar nível e estado do óleo hidráulico', 'retroescavadeira', true, 12, 'FACILITACONSTRUÇÕES'),
('Filtros', 'Verificar estado dos filtros', 'retroescavadeira', true, 13, 'FACILITACONSTRUÇÕES'),
('Documentação', 'Verificar documentos da máquina', 'retroescavadeira', true, 14, 'FACILITACONSTRUÇÕES'),
('Extintor de incêndio', 'Verificar presença e validade', 'retroescavadeira', true, 15, 'FACILITACONSTRUÇÕES'),
('Cabine/ROPS', 'Verificar estrutura de proteção', 'retroescavadeira', true, 16, 'FACILITACONSTRUÇÕES'),
('Estabilizadores', 'Testar funcionamento dos estabilizadores', 'retroescavadeira', false, 17, 'FACILITACONSTRUÇÕES'),
('Ar condicionado', 'Verificar funcionamento do ar condicionado', 'retroescavadeira', false, 18, 'FACILITACONSTRUÇÕES');