-- Remover constraint de categoria se existir e adicionar itens restantes com caracteres corrigidos
-- Primeiro, remover a constraint que está impedindo novos valores
ALTER TABLE public.checklist_items DROP CONSTRAINT IF EXISTS checklist_items_category_check;

-- Agora inserir itens para CAMINHÃO PIPA (corrigindo caracteres especiais)
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Tanque de agua', 'Verificar integridade e limpeza do tanque', 'caminhao_pipa', true, 1, 'default'),
('Sistema de bombeamento', 'Testar funcionamento da bomba de agua', 'caminhao_pipa', true, 2, 'default'),
('Mangueiras', 'Verificar estado das mangueiras e conexoes', 'caminhao_pipa', true, 3, 'default'),
('Bicos aspersores', 'Testar funcionamento dos bicos', 'caminhao_pipa', true, 4, 'default'),
('Valvulas de controle', 'Verificar funcionamento das valvulas', 'caminhao_pipa', true, 5, 'default'),
('Pneus dianteiros', 'Verificar estado, calibragem e desgaste', 'caminhao_pipa', true, 6, 'default'),
('Pneus traseiros', 'Verificar estado, calibragem e desgaste', 'caminhao_pipa', true, 7, 'default'),
('Freios', 'Testar sistema de freios', 'caminhao_pipa', true, 8, 'default'),
('Motor', 'Verificar funcionamento geral do motor', 'caminhao_pipa', true, 9, 'default'),
('Sistema eletrico', 'Verificar funcionamento do sistema eletrico', 'caminhao_pipa', true, 10, 'default'),
('Farois e lanternas', 'Verificar todo sistema de iluminacao', 'caminhao_pipa', true, 11, 'default'),
('Medidor de nivel', 'Verificar funcionamento do medidor de agua', 'caminhao_pipa', true, 12, 'default'),
('Documentacao', 'Verificar CRLV e outros documentos obrigatorios', 'caminhao_pipa', true, 13, 'default'),
('Extintor de incendio', 'Verificar presenca e validade do extintor', 'caminhao_pipa', true, 14, 'default'),
('EPIs', 'Verificar presenca dos equipamentos de protecao', 'caminhao_pipa', true, 15, 'default'),
('Sistema hidraulico', 'Verificar oleo e funcionamento hidraulico', 'caminhao_pipa', false, 16, 'default'),
('Filtros', 'Verificar estado dos filtros do sistema', 'caminhao_pipa', false, 17, 'default'),
('Cabine', 'Verificar estado geral da cabine', 'caminhao_pipa', false, 18, 'default');

-- Itens para HIDROJATO
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Sistema de succao', 'Verificar funcionamento do sistema de succao', 'hidrojato', true, 1, 'default'),
('Sistema hidrojato', 'Testar funcionamento do sistema de hidrojato', 'hidrojato', true, 2, 'default'),
('Mangueiras', 'Verificar estado das mangueiras de alta pressao', 'hidrojato', true, 3, 'default'),
('Bomba de alta pressao', 'Testar funcionamento da bomba', 'hidrojato', true, 4, 'default'),
('Tanque de agua', 'Verificar integridade do tanque de agua', 'hidrojato', true, 5, 'default'),
('Sistema roots', 'Verificar funcionamento do sistema roots', 'hidrojato', true, 6, 'default'),
('Pneus', 'Verificar estado de todos os pneus', 'hidrojato', true, 7, 'default'),
('Motor', 'Verificar funcionamento do motor principal', 'hidrojato', true, 8, 'default'),
('Sistema eletrico', 'Verificar funcionamento do sistema eletrico', 'hidrojato', true, 9, 'default'),
('Valvulas de seguranca', 'Testar valvulas de alivio de pressao', 'hidrojato', true, 10, 'default'),
('Filtros', 'Verificar estado dos filtros do sistema', 'hidrojato', true, 11, 'default'),
('Manometros', 'Verificar funcionamento dos medidores de pressao', 'hidrojato', true, 12, 'default'),
('Documentacao', 'Verificar documentos do equipamento', 'hidrojato', true, 13, 'default'),
('EPIs', 'Verificar equipamentos de protecao individual', 'hidrojato', true, 14, 'default'),
('Extintor de incendio', 'Verificar presenca e validade', 'hidrojato', true, 15, 'default'),
('Bicos aspersores', 'Verificar estado dos bicos', 'hidrojato', false, 16, 'default'),
('Sistema de aquecimento', 'Verificar sistema de aquecimento da agua', 'hidrojato', false, 17, 'default'),
('Cabine', 'Verificar estado da cabine', 'hidrojato', false, 18, 'default');

-- Itens para PA CARREGADEIRA
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Cacamba dianteira', 'Verificar funcionamento da cacamba frontal', 'pa_carregadeira', true, 1, 'default'),
('Sistema hidraulico', 'Testar funcionamento do sistema hidraulico', 'pa_carregadeira', true, 2, 'default'),
('Bracos de elevacao', 'Verificar movimentacao dos bracos', 'pa_carregadeira', true, 3, 'default'),
('Pneus', 'Verificar estado de todos os pneus', 'pa_carregadeira', true, 4, 'default'),
('Motor', 'Verificar funcionamento do motor', 'pa_carregadeira', true, 5, 'default'),
('Transmissao', 'Testar funcionamento da transmissao', 'pa_carregadeira', true, 6, 'default'),
('Freios', 'Testar sistema de freios', 'pa_carregadeira', true, 7, 'default'),
('Sistema eletrico', 'Verificar funcionamento do sistema eletrico', 'pa_carregadeira', true, 8, 'default'),
('Farois de trabalho', 'Testar iluminacao para trabalho', 'pa_carregadeira', true, 9, 'default'),
('Buzina de re', 'Testar alarme sonoro de re', 'pa_carregadeira', true, 10, 'default'),
('Oleo hidraulico', 'Verificar nivel e estado do oleo', 'pa_carregadeira', true, 11, 'default'),
('Filtros', 'Verificar estado dos filtros', 'pa_carregadeira', true, 12, 'default'),
('Articulacao central', 'Verificar funcionamento da articulacao', 'pa_carregadeira', true, 13, 'default'),
('Documentacao', 'Verificar documentos da maquina', 'pa_carregadeira', true, 14, 'default'),
('Extintor de incendio', 'Verificar presenca e validade', 'pa_carregadeira', true, 15, 'default'),
('Cabine/ROPS', 'Verificar estrutura de protecao', 'pa_carregadeira', true, 16, 'default'),
('Ar condicionado', 'Verificar funcionamento do ar condicionado', 'pa_carregadeira', false, 17, 'default'),
('Sistema de inclinacao', 'Testar inclinacao da cacamba', 'pa_carregadeira', false, 18, 'default');