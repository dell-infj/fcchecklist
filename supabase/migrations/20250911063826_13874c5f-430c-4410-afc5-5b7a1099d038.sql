-- Adicionar itens de checklist para as categorias que estão vazias
-- CARRO
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Faróis dianteiros', 'Verificar funcionamento dos faróis baixo e alto', 'carro', true, 1, 'FACILITACONSTRUÇÕES'),
('Lanternas traseiras', 'Verificar lanternas, freio e seta', 'carro', true, 2, 'FACILITACONSTRUÇÕES'),
('Pneus dianteiros', 'Verificar estado e calibragem', 'carro', true, 3, 'FACILITACONSTRUÇÕES'),
('Pneus traseiros', 'Verificar estado e calibragem', 'carro', true, 4, 'FACILITACONSTRUÇÕES'),
('Estepe', 'Verificar estado e calibragem do pneu sobressalente', 'carro', true, 5, 'FACILITACONSTRUÇÕES'),
('Freios', 'Testar funcionamento do sistema de freios', 'carro', true, 6, 'FACILITACONSTRUÇÕES'),
('Cinto de segurança', 'Verificar todos os cintos de segurança', 'carro', true, 7, 'FACILITACONSTRUÇÕES'),
('Espelhos retrovisores', 'Verificar estado e posicionamento', 'carro', true, 8, 'FACILITACONSTRUÇÕES'),
('Limpador de para-brisa', 'Testar funcionamento e estado das palhetas', 'carro', true, 9, 'FACILITACONSTRUÇÕES'),
('Buzina', 'Testar funcionamento da buzina', 'carro', true, 10, 'FACILITACONSTRUÇÕES'),
('Óleo do motor', 'Verificar nível e estado do óleo', 'carro', true, 11, 'FACILITACONSTRUÇÕES'),
('Água do radiador', 'Verificar nível do líquido de arrefecimento', 'carro', true, 12, 'FACILITACONSTRUÇÕES'),
('Bateria', 'Verificar estado e fixação da bateria', 'carro', true, 13, 'FACILITACONSTRUÇÕES'),
('Documentação', 'Verificar CRLV e outros documentos obrigatórios', 'carro', true, 14, 'FACILITACONSTRUÇÕES'),
('Triângulo de segurança', 'Verificar presença do triângulo', 'carro', true, 15, 'FACILITACONSTRUÇÕES'),
('Macaco e chave de roda', 'Verificar presença e estado das ferramentas', 'carro', true, 16, 'FACILITACONSTRUÇÕES'),
('Sistema elétrico', 'Verificar funcionamento geral do sistema elétrico', 'carro', false, 17, 'FACILITACONSTRUÇÕES'),
('Ar condicionado', 'Testar funcionamento do ar condicionado', 'carro', false, 18, 'FACILITACONSTRUÇÕES');

-- MOTO
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Farol principal', 'Verificar funcionamento do farol dianteiro', 'moto', true, 1, 'FACILITACONSTRUÇÕES'),
('Lanterna traseira', 'Verificar lanterna e luz de freio', 'moto', true, 2, 'FACILITACONSTRUÇÕES'),
('Pneu dianteiro', 'Verificar estado, calibragem e desgaste', 'moto', true, 3, 'FACILITACONSTRUÇÕES'),
('Pneu traseiro', 'Verificar estado, calibragem e desgaste', 'moto', true, 4, 'FACILITACONSTRUÇÕES'),
('Freio dianteiro', 'Testar funcionamento do freio dianteiro', 'moto', true, 5, 'FACILITACONSTRUÇÕES'),
('Freio traseiro', 'Testar funcionamento do freio traseiro', 'moto', true, 6, 'FACILITACONSTRUÇÕES'),
('Embreagem', 'Verificar funcionamento da embreagem', 'moto', true, 7, 'FACILITACONSTRUÇÕES'),
('Aceleração', 'Testar resposta do acelerador', 'moto', true, 8, 'FACILITACONSTRUÇÕES'),
('Espelhos retrovisores', 'Verificar estado e posicionamento', 'moto', true, 9, 'FACILITACONSTRUÇÕES'),
('Buzina', 'Testar funcionamento da buzina', 'moto', true, 10, 'FACILITACONSTRUÇÕES'),
('Corrente/Correia', 'Verificar estado e tensão da transmissão', 'moto', true, 11, 'FACILITACONSTRUÇÕES'),
('Óleo do motor', 'Verificar nível e estado do óleo', 'moto', true, 12, 'FACILITACONSTRUÇÕES'),
('Bateria', 'Verificar estado e fixação da bateria', 'moto', true, 13, 'FACILITACONSTRUÇÕES'),
('Documentação', 'Verificar CRLV e outros documentos obrigatórios', 'moto', true, 14, 'FACILITACONSTRUÇÕES'),
('Capacete', 'Verificar presença e estado do capacete', 'moto', true, 15, 'FACILITACONSTRUÇÕES'),
('Sinalização (setas)', 'Testar funcionamento das setas', 'moto', true, 16, 'FACILITACONSTRUÇÕES'),
('Suspensão dianteira', 'Verificar estado da suspensão dianteira', 'moto', false, 17, 'FACILITACONSTRUÇÕES'),
('Suspensão traseira', 'Verificar estado da suspensão traseira', 'moto', false, 18, 'FACILITACONSTRUÇÕES');

-- CAMINHÃO BASCULANTE
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Sistema basculante', 'Testar funcionamento do sistema hidráulico de basculamento', 'caminhao_basculante', true, 1, 'FACILITACONSTRUÇÕES'),
('Caçamba', 'Verificar estado estrutural da caçamba', 'caminhao_basculante', true, 2, 'FACILITACONSTRUÇÕES'),
('Pneus dianteiros', 'Verificar estado, calibragem e desgaste', 'caminhao_basculante', true, 3, 'FACILITACONSTRUÇÕES'),
('Pneus traseiros', 'Verificar estado, calibragem e desgaste', 'caminhao_basculante', true, 4, 'FACILITACONSTRUÇÕES'),
('Freios', 'Testar sistema de freios incluindo freio de estacionamento', 'caminhao_basculante', true, 5, 'FACILITACONSTRUÇÕES'),
('Sistema hidráulico', 'Verificar nível e vazamentos do óleo hidráulico', 'caminhao_basculante', true, 6, 'FACILITACONSTRUÇÕES'),
('Faróis e lanternas', 'Verificar todo sistema de iluminação', 'caminhao_basculante', true, 7, 'FACILITACONSTRUÇÕES'),
('Buzina', 'Testar funcionamento da buzina', 'caminhao_basculante', true, 8, 'FACILITACONSTRUÇÕES'),
('Espelhos retrovisores', 'Verificar todos os espelhos retrovisores', 'caminhao_basculante', true, 9, 'FACILITACONSTRUÇÕES'),
('Motor', 'Verificar funcionamento geral do motor', 'caminhao_basculante', true, 10, 'FACILITACONSTRUÇÕES'),
('Óleo do motor', 'Verificar nível e estado do óleo', 'caminhao_basculante', true, 11, 'FACILITACONSTRUÇÕES'),
('Arrefecimento', 'Verificar sistema de arrefecimento', 'caminhao_basculante', true, 12, 'FACILITACONSTRUÇÕES'),
('Bateria', 'Verificar estado e fixação da bateria', 'caminhao_basculante', true, 13, 'FACILITACONSTRUÇÕES'),
('Documentação', 'Verificar CRLV e outros documentos obrigatórios', 'caminhao_basculante', true, 14, 'FACILITACONSTRUÇÕES'),
('Extintor de incêndio', 'Verificar presença e validade do extintor', 'caminhao_basculante', true, 15, 'FACILITACONSTRUÇÕES'),
('Kit de ferramentas', 'Verificar presença das ferramentas básicas', 'caminhao_basculante', true, 16, 'FACILITACONSTRUÇÕES'),
('Sinalização de segurança', 'Verificar equipamentos de sinalização', 'caminhao_basculante', false, 17, 'FACILITACONSTRUÇÕES'),
('Cabine', 'Verificar estado geral da cabine', 'caminhao_basculante', false, 18, 'FACILITACONSTRUÇÕES');