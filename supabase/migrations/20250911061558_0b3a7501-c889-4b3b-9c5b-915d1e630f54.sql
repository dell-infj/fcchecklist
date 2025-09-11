-- Inserir/atualizar categorias de veículos
INSERT INTO public.vehicle_categories (name, label, icon_name, unique_id) VALUES
('carro', 'Carro', 'Car', 'default'),
('moto', 'Moto', 'Bike', 'default'),
('caminhao_basculante', 'Caminhão Basculante', 'Truck', 'default'),
('caminhao_pipa', 'Caminhão Pipa', 'Truck', 'default'),
('carreta_prancha', 'Carreta Prancha', 'Truck', 'default'),
('caminhao_carroceria', 'Caminhão Carroceria', 'Truck', 'default'),
('retroescavadeira', 'Retroescavadeira/Valetadeira', 'Construction', 'default'),
('hidrojato', 'Hidrojato/Sucção/Roots', 'Truck', 'default'),
('pa_carregadeira', 'Pá Carregadeira', 'Construction', 'default'),
('escavadeira', 'Escavadeira/Trator Esteira', 'Construction', 'default'),
('motoniveladora', 'Motoniveladora', 'Construction', 'default'),
('rolo_compactador', 'Rolo Compactador', 'Construction', 'default'),
('caminhao_munck', 'Caminhão Munck', 'Crane', 'default')
ON CONFLICT (name, unique_id) DO UPDATE SET
label = EXCLUDED.label,
icon_name = EXCLUDED.icon_name,
updated_at = now();

-- Itens para CARRO
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Faróis dianteiros', 'Verificar funcionamento dos faróis baixo e alto', 'carro', true, 1, 'default'),
('Lanternas traseiras', 'Verificar lanternas, freio e seta', 'carro', true, 2, 'default'),
('Pneus dianteiros', 'Verificar estado e calibragem', 'carro', true, 3, 'default'),
('Pneus traseiros', 'Verificar estado e calibragem', 'carro', true, 4, 'default'),
('Estepe', 'Verificar estado e calibragem do pneu sobressalente', 'carro', true, 5, 'default'),
('Freios', 'Testar funcionamento do sistema de freios', 'carro', true, 6, 'default'),
('Cinto de segurança', 'Verificar todos os cintos de segurança', 'carro', true, 7, 'default'),
('Espelhos retrovisores', 'Verificar estado e posicionamento', 'carro', true, 8, 'default'),
('Limpador de para-brisa', 'Testar funcionamento e estado das palhetas', 'carro', true, 9, 'default'),
('Buzina', 'Testar funcionamento da buzina', 'carro', true, 10, 'default'),
('Óleo do motor', 'Verificar nível e estado do óleo', 'carro', true, 11, 'default'),
('Água do radiador', 'Verificar nível do líquido de arrefecimento', 'carro', true, 12, 'default'),
('Bateria', 'Verificar estado e fixação da bateria', 'carro', true, 13, 'default'),
('Documentação', 'Verificar CRLV e outros documentos obrigatórios', 'carro', true, 14, 'default'),
('Triângulo de segurança', 'Verificar presença do triângulo', 'carro', true, 15, 'default'),
('Macaco e chave de roda', 'Verificar presença e estado das ferramentas', 'carro', true, 16, 'default'),
('Sistema elétrico', 'Verificar funcionamento geral do sistema elétrico', 'carro', false, 17, 'default'),
('Ar condicionado', 'Testar funcionamento do ar condicionado', 'carro', false, 18, 'default');

-- Itens para MOTO
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Farol principal', 'Verificar funcionamento do farol dianteiro', 'moto', true, 1, 'default'),
('Lanterna traseira', 'Verificar lanterna e luz de freio', 'moto', true, 2, 'default'),
('Pneu dianteiro', 'Verificar estado, calibragem e desgaste', 'moto', true, 3, 'default'),
('Pneu traseiro', 'Verificar estado, calibragem e desgaste', 'moto', true, 4, 'default'),
('Freio dianteiro', 'Testar funcionamento do freio dianteiro', 'moto', true, 5, 'default'),
('Freio traseiro', 'Testar funcionamento do freio traseiro', 'moto', true, 6, 'default'),
('Embreagem', 'Verificar funcionamento da embreagem', 'moto', true, 7, 'default'),
('Aceleração', 'Testar resposta do acelerador', 'moto', true, 8, 'default'),
('Espelhos retrovisores', 'Verificar estado e posicionamento', 'moto', true, 9, 'default'),
('Buzina', 'Testar funcionamento da buzina', 'moto', true, 10, 'default'),
('Corrente/Correia', 'Verificar estado e tensão da transmissão', 'moto', true, 11, 'default'),
('Óleo do motor', 'Verificar nível e estado do óleo', 'moto', true, 12, 'default'),
('Bateria', 'Verificar estado e fixação da bateria', 'moto', true, 13, 'default'),
('Documentação', 'Verificar CRLV e outros documentos obrigatórios', 'moto', true, 14, 'default'),
('Capacete', 'Verificar presença e estado do capacete', 'moto', true, 15, 'default'),
('Sinalização (setas)', 'Testar funcionamento das setas', 'moto', true, 16, 'default'),
('Suspensão dianteira', 'Verificar estado da suspensão dianteira', 'moto', false, 17, 'default'),
('Suspensão traseira', 'Verificar estado da suspensão traseira', 'moto', false, 18, 'default');

-- Itens para CAMINHÃO BASCULANTE
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Sistema basculante', 'Testar funcionamento do sistema hidráulico de basculamento', 'caminhao_basculante', true, 1, 'default'),
('Caçamba', 'Verificar estado estrutural da caçamba', 'caminhao_basculante', true, 2, 'default'),
('Pneus dianteiros', 'Verificar estado, calibragem e desgaste', 'caminhao_basculante', true, 3, 'default'),
('Pneus traseiros', 'Verificar estado, calibragem e desgaste', 'caminhao_basculante', true, 4, 'default'),
('Freios', 'Testar sistema de freios incluindo freio de estacionamento', 'caminhao_basculante', true, 5, 'default'),
('Sistema hidráulico', 'Verificar nível e vazamentos do óleo hidráulico', 'caminhao_basculante', true, 6, 'default'),
('Faróis e lanternas', 'Verificar todo sistema de iluminação', 'caminhao_basculante', true, 7, 'default'),
('Buzina', 'Testar funcionamento da buzina', 'caminhao_basculante', true, 8, 'default'),
('Espelhos retrovisores', 'Verificar todos os espelhos retrovisores', 'caminhao_basculante', true, 9, 'default'),
('Motor', 'Verificar funcionamento geral do motor', 'caminhao_basculante', true, 10, 'default'),
('Óleo do motor', 'Verificar nível e estado do óleo', 'caminhao_basculante', true, 11, 'default'),
('Arrefecimento', 'Verificar sistema de arrefecimento', 'caminhao_basculante', true, 12, 'default'),
('Bateria', 'Verificar estado e fixação da bateria', 'caminhao_basculante', true, 13, 'default'),
('Documentação', 'Verificar CRLV e outros documentos obrigatórios', 'caminhao_basculante', true, 14, 'default'),
('Extintor de incêndio', 'Verificar presença e validade do extintor', 'caminhao_basculante', true, 15, 'default'),
('Kit de ferramentas', 'Verificar presença das ferramentas básicas', 'caminhao_basculante', true, 16, 'default'),
('Sinalização de segurança', 'Verificar equipamentos de sinalização', 'caminhao_basculante', false, 17, 'default'),
('Cabine', 'Verificar estado geral da cabine', 'caminhao_basculante', false, 18, 'default');

-- Itens para CAMINHÃO PIPA
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Tanque de água', 'Verificar integridade e limpeza do tanque', 'caminhao_pipa', true, 1, 'default'),
('Sistema de bombeamento', 'Testar funcionamento da bomba d\'água', 'caminhao_pipa', true, 2, 'default'),
('Mangueiras', 'Verificar estado das mangueiras e conexões', 'caminhao_pipa', true, 3, 'default'),
('Bicos aspersores', 'Testar funcionamento dos bicos', 'caminhao_pipa', true, 4, 'default'),
('Válvulas de controle', 'Verificar funcionamento das válvulas', 'caminhao_pipa', true, 5, 'default'),
('Pneus dianteiros', 'Verificar estado, calibragem e desgaste', 'caminhao_pipa', true, 6, 'default'),
('Pneus traseiros', 'Verificar estado, calibragem e desgaste', 'caminhao_pipa', true, 7, 'default'),
('Freios', 'Testar sistema de freios', 'caminhao_pipa', true, 8, 'default'),
('Motor', 'Verificar funcionamento geral do motor', 'caminhao_pipa', true, 9, 'default'),
('Sistema elétrico', 'Verificar funcionamento do sistema elétrico', 'caminhao_pipa', true, 10, 'default'),
('Faróis e lanternas', 'Verificar todo sistema de iluminação', 'caminhao_pipa', true, 11, 'default'),
('Medidor de nível', 'Verificar funcionamento do medidor de água', 'caminhao_pipa', true, 12, 'default'),
('Documentação', 'Verificar CRLV e outros documentos obrigatórios', 'caminhao_pipa', true, 13, 'default'),
('Extintor de incêndio', 'Verificar presença e validade do extintor', 'caminhao_pipa', true, 14, 'default'),
('EPIs', 'Verificar presença dos equipamentos de proteção', 'caminhao_pipa', true, 15, 'default'),
('Sistema hidráulico', 'Verificar óleo e funcionamento hidráulico', 'caminhao_pipa', false, 16, 'default'),
('Filtros', 'Verificar estado dos filtros do sistema', 'caminhao_pipa', false, 17, 'default'),
('Cabine', 'Verificar estado geral da cabine', 'caminhao_pipa', false, 18, 'default');

-- Itens para CARRETA PRANCHA
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Prancha basculante', 'Testar funcionamento do sistema de basculamento da prancha', 'carreta_prancha', true, 1, 'default'),
('Sistema hidráulico', 'Verificar óleo e funcionamento do sistema hidráulico', 'carreta_prancha', true, 2, 'default'),
('Pneus do cavalo', 'Verificar pneus do cavalo mecânico', 'carreta_prancha', true, 3, 'default'),
('Pneus da carreta', 'Verificar todos os pneus da carreta', 'carreta_prancha', true, 4, 'default'),
('Freios', 'Testar sistema de freios do conjunto', 'carreta_prancha', true, 5, 'default'),
('Quinta roda', 'Verificar acoplamento da quinta roda', 'carreta_prancha', true, 6, 'default'),
('Correntes e catracas', 'Verificar equipamentos de amarração', 'carreta_prancha', true, 7, 'default'),
('Sinalização', 'Verificar luzes e refletores da carreta', 'carreta_prancha', true, 8, 'default'),
('Suspensão', 'Verificar sistema de suspensão', 'carreta_prancha', true, 9, 'default'),
('Motor', 'Verificar funcionamento do motor', 'carreta_prancha', true, 10, 'default'),
('Sistema elétrico', 'Verificar conexões elétricas entre cavalo e carreta', 'carreta_prancha', true, 11, 'default'),
('Documentação', 'Verificar CRLV de cavalo e carreta', 'carreta_prancha', true, 12, 'default'),
('Extintor de incêndio', 'Verificar presença e validade do extintor', 'carreta_prancha', true, 13, 'default'),
('Triângulos de segurança', 'Verificar presença dos triângulos', 'carreta_prancha', true, 14, 'default'),
('Pneu sobressalente', 'Verificar estado do estepe', 'carreta_prancha', true, 15, 'default'),
('Ferramentas', 'Verificar kit de ferramentas', 'carreta_prancha', false, 16, 'default'),
('Cabine', 'Verificar estado da cabine', 'carreta_prancha', false, 17, 'default'),
('Estrutura da prancha', 'Verificar integridade estrutural', 'carreta_prancha', false, 18, 'default');

-- Itens para CAMINHÃO CARROCERIA
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Carroceria', 'Verificar estado estrutural da carroceria', 'caminhao_carroceria', true, 1, 'default'),
('Lona/Tampa', 'Verificar cobertura da carga', 'caminhao_carroceria', true, 2, 'default'),
('Pneus dianteiros', 'Verificar estado, calibragem e desgaste', 'caminhao_carroceria', true, 3, 'default'),
('Pneus traseiros', 'Verificar estado, calibragem e desgaste', 'caminhao_carroceria', true, 4, 'default'),
('Freios', 'Testar sistema de freios', 'caminhao_carroceria', true, 5, 'default'),
('Motor', 'Verificar funcionamento do motor', 'caminhao_carroceria', true, 6, 'default'),
('Sistema elétrico', 'Verificar funcionamento do sistema elétrico', 'caminhao_carroceria', true, 7, 'default'),
('Faróis e lanternas', 'Verificar iluminação completa', 'caminhao_carroceria', true, 8, 'default'),
('Espelhos retrovisores', 'Verificar todos os espelhos', 'caminhao_carroceria', true, 9, 'default'),
('Buzina', 'Testar funcionamento da buzina', 'caminhao_carroceria', true, 10, 'default'),
('Portas da carroceria', 'Verificar fechamento e travas', 'caminhao_carroceria', true, 11, 'default'),
('Óleo do motor', 'Verificar nível e estado do óleo', 'caminhao_carroceria', true, 12, 'default'),
('Documentação', 'Verificar CRLV e documentos obrigatórios', 'caminhao_carroceria', true, 13, 'default'),
('Extintor de incêndio', 'Verificar presença e validade', 'caminhao_carroceria', true, 14, 'default'),
('Kit de ferramentas', 'Verificar ferramentas básicas', 'caminhao_carroceria', true, 15, 'default'),
('Bateria', 'Verificar estado da bateria', 'caminhao_carroceria', true, 16, 'default'),
('Suspensão', 'Verificar sistema de suspensão', 'caminhao_carroceria', false, 17, 'default'),
('Cabine', 'Verificar estado da cabine', 'caminhao_carroceria', false, 18, 'default');

-- Continua com as outras categorias...
-- Itens para RETROESCAVADEIRA
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Sistema hidráulico', 'Verificar funcionamento geral do sistema hidráulico', 'retroescavadeira', true, 1, 'default'),
('Braço escavador', 'Testar movimentação do braço escavador', 'retroescavadeira', true, 2, 'default'),
('Caçamba dianteira', 'Verificar funcionamento da caçamba/lâmina dianteira', 'retroescavadeira', true, 3, 'default'),
('Caçamba traseira', 'Verificar funcionamento da caçamba traseira', 'retroescavadeira', true, 4, 'default'),
('Rotação da torre', 'Testar rotação da estrutura superior', 'retroescavadeira', true, 5, 'default'),
('Pneus', 'Verificar estado de todos os pneus', 'retroescavadeira', true, 6, 'default'),
('Motor', 'Verificar funcionamento do motor', 'retroescavadeira', true, 7, 'default'),
('Sistema elétrico', 'Verificar funcionamento do sistema elétrico', 'retroescavadeira', true, 8, 'default'),
('Faróis de trabalho', 'Testar todos os faróis de iluminação', 'retroescavadeira', true, 9, 'default'),
('Buzina de ré', 'Testar alarme sonoro de ré', 'retroescavadeira', true, 10, 'default'),
('Freios', 'Testar sistema de freios', 'retroescavadeira', true, 11, 'default'),
('Óleo hidráulico', 'Verificar nível e estado do óleo hidráulico', 'retroescavadeira', true, 12, 'default'),
('Filtros', 'Verificar estado dos filtros', 'retroescavadeira', true, 13, 'default'),
('Documentação', 'Verificar documentos da máquina', 'retroescavadeira', true, 14, 'default'),
('Extintor de incêndio', 'Verificar presença e validade', 'retroescavadeira', true, 15, 'default'),
('Cabine/ROPS', 'Verificar estrutura de proteção', 'retroescavadeira', true, 16, 'default'),
('Estabilizadores', 'Testar funcionamento dos estabilizadores', 'retroescavadeira', false, 17, 'default'),
('Ar condicionado', 'Verificar funcionamento do ar condicionado', 'retroescavadeira', false, 18, 'default');