-- Adicionar itens restantes para as categorias finais
-- ESCAVADEIRA
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Sistema hidraulico', 'Verificar funcionamento do sistema hidraulico', 'escavadeira', true, 1, 'default'),
('Braco escavador', 'Testar movimentacao do braco principal', 'escavadeira', true, 2, 'default'),
('Lanca', 'Verificar funcionamento da lanca', 'escavadeira', true, 3, 'default'),
('Cacamba', 'Testar movimentacao da cacamba', 'escavadeira', true, 4, 'default'),
('Rotacao da torre', 'Testar rotacao 360 graus', 'escavadeira', true, 5, 'default'),
('Esteiras', 'Verificar estado das esteiras', 'escavadeira', true, 6, 'default'),
('Motor', 'Verificar funcionamento do motor', 'escavadeira', true, 7, 'default'),
('Sistema eletrico', 'Verificar funcionamento do sistema eletrico', 'escavadeira', true, 8, 'default'),
('Farois de trabalho', 'Testar iluminacao para trabalho', 'escavadeira', true, 9, 'default'),
('Buzina de re', 'Testar alarme sonoro de re', 'escavadeira', true, 10, 'default'),
('Oleo hidraulico', 'Verificar nivel e estado do oleo', 'escavadeira', true, 11, 'default'),
('Filtros', 'Verificar estado dos filtros', 'escavadeira', true, 12, 'default'),
('Sistema de deslocamento', 'Testar movimentacao das esteiras', 'escavadeira', true, 13, 'default'),
('Documentacao', 'Verificar documentos da maquina', 'escavadeira', true, 14, 'default'),
('Extintor de incendio', 'Verificar presenca e validade', 'escavadeira', true, 15, 'default'),
('Cabine/ROPS', 'Verificar estrutura de protecao', 'escavadeira', true, 16, 'default'),
('Ar condicionado', 'Verificar funcionamento do ar condicionado', 'escavadeira', false, 17, 'default'),
('Martelo hidraulico', 'Verificar acessorio martelo (se equipado)', 'escavadeira', false, 18, 'default');

-- MOTONIVELADORA
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Lamina niveladora', 'Verificar funcionamento da lamina principal', 'motoniveladora', true, 1, 'default'),
('Sistema hidraulico', 'Testar funcionamento do sistema hidraulico', 'motoniveladora', true, 2, 'default'),
('Articulacao', 'Verificar funcionamento da articulacao central', 'motoniveladora', true, 3, 'default'),
('Pneus dianteiros', 'Verificar estado dos pneus dianteiros', 'motoniveladora', true, 4, 'default'),
('Pneus traseiros', 'Verificar estado dos pneus traseiros', 'motoniveladora', true, 5, 'default'),
('Motor', 'Verificar funcionamento do motor', 'motoniveladora', true, 6, 'default'),
('Transmissao', 'Testar funcionamento da transmissao', 'motoniveladora', true, 7, 'default'),
('Sistema eletrico', 'Verificar funcionamento do sistema eletrico', 'motoniveladora', true, 8, 'default'),
('Farois de trabalho', 'Testar iluminacao para trabalho', 'motoniveladora', true, 9, 'default'),
('Buzina', 'Testar funcionamento da buzina', 'motoniveladora', true, 10, 'default'),
('Freios', 'Testar sistema de freios', 'motoniveladora', true, 11, 'default'),
('Escarificador', 'Verificar funcionamento do escarificador traseiro', 'motoniveladora', true, 12, 'default'),
('Oleo hidraulico', 'Verificar nivel e estado do oleo', 'motoniveladora', true, 13, 'default'),
('Documentacao', 'Verificar documentos da maquina', 'motoniveladora', true, 14, 'default'),
('Extintor de incendio', 'Verificar presenca e validade', 'motoniveladora', true, 15, 'default'),
('Cabine', 'Verificar estado da cabine', 'motoniveladora', true, 16, 'default'),
('Sistema de inclinacao lateral', 'Testar inclinacao lateral da lamina', 'motoniveladora', false, 17, 'default'),
('Ar condicionado', 'Verificar funcionamento do ar condicionado', 'motoniveladora', false, 18, 'default');

-- ROLO COMPACTADOR
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Cilindro compactador', 'Verificar estado do cilindro de compactacao', 'rolo_compactador', true, 1, 'default'),
('Sistema de vibracao', 'Testar funcionamento do sistema vibratorio', 'rolo_compactador', true, 2, 'default'),
('Sistema de aspersao', 'Verificar sistema de aspersao de agua', 'rolo_compactador', true, 3, 'default'),
('Tanque de agua', 'Verificar integridade do tanque de agua', 'rolo_compactador', true, 4, 'default'),
('Pneus traseiros', 'Verificar estado dos pneus traseiros', 'rolo_compactador', true, 5, 'default'),
('Motor', 'Verificar funcionamento do motor', 'rolo_compactador', true, 6, 'default'),
('Sistema hidraulico', 'Testar funcionamento do sistema hidraulico', 'rolo_compactador', true, 7, 'default'),
('Sistema eletrico', 'Verificar funcionamento do sistema eletrico', 'rolo_compactador', true, 8, 'default'),
('Farois de trabalho', 'Testar iluminacao para trabalho', 'rolo_compactador', true, 9, 'default'),
('Buzina de re', 'Testar alarme sonoro de re', 'rolo_compactador', true, 10, 'default'),
('Freios', 'Testar sistema de freios', 'rolo_compactador', true, 11, 'default'),
('Transmissao', 'Verificar funcionamento da transmissao', 'rolo_compactador', true, 12, 'default'),
('Oleo hidraulico', 'Verificar nivel e estado do oleo', 'rolo_compactador', true, 13, 'default'),
('Documentacao', 'Verificar documentos da maquina', 'rolo_compactador', true, 14, 'default'),
('Extintor de incendio', 'Verificar presenca e validade', 'rolo_compactador', true, 15, 'default'),
('Cabine', 'Verificar estado da cabine', 'rolo_compactador', true, 16, 'default'),
('Raspador do cilindro', 'Verificar funcionamento do raspador', 'rolo_compactador', false, 17, 'default'),
('Ar condicionado', 'Verificar funcionamento do ar condicionado', 'rolo_compactador', false, 18, 'default');

-- CAMINHAO MUNCK
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Sistema de guincho', 'Verificar funcionamento do guincho principal', 'caminhao_munck', true, 1, 'default'),
('Lanca telescopica', 'Testar extensao e retracao da lanca', 'caminhao_munck', true, 2, 'default'),
('Sistema hidraulico', 'Verificar funcionamento do sistema hidraulico', 'caminhao_munck', true, 3, 'default'),
('Estabilizadores', 'Testar funcionamento dos estabilizadores', 'caminhao_munck', true, 4, 'default'),
('Gancho/Moitao', 'Verificar estado do gancho e moitao', 'caminhao_munck', true, 5, 'default'),
('Cabo de aco', 'Verificar estado do cabo de aco', 'caminhao_munck', true, 6, 'default'),
('Pneus', 'Verificar estado de todos os pneus', 'caminhao_munck', true, 7, 'default'),
('Motor', 'Verificar funcionamento do motor', 'caminhao_munck', true, 8, 'default'),
('Sistema eletrico', 'Verificar funcionamento do sistema eletrico', 'caminhao_munck', true, 9, 'default'),
('Freios', 'Testar sistema de freios', 'caminhao_munck', true, 10, 'default'),
('Limitador de carga', 'Verificar funcionamento do limitador', 'caminhao_munck', true, 11, 'default'),
('Rotacao da torre', 'Testar rotacao da torre do munck', 'caminhao_munck', true, 12, 'default'),
('Oleo hidraulico', 'Verificar nivel e estado do oleo', 'caminhao_munck', true, 13, 'default'),
('Documentacao', 'Verificar CRLV e ART do equipamento', 'caminhao_munck', true, 14, 'default'),
('Extintor de incendio', 'Verificar presenca e validade', 'caminhao_munck', true, 15, 'default'),
('Sinalizacao de seguranca', 'Verificar equipamentos de sinalizacao', 'caminhao_munck', true, 16, 'default'),
('Cabine auxiliar', 'Verificar cabine de comando do munck', 'caminhao_munck', false, 17, 'default'),
('Sistema de comunicacao', 'Verificar interfone ou radio', 'caminhao_munck', false, 18, 'default');