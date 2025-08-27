-- Limpar itens existentes para reorganizar por categoria de veículo
DELETE FROM public.checklist_items;

-- Inserir itens de checklist para CAMINHÃO/CAMINHÃO-MUNCK
INSERT INTO public.checklist_items (name, category, description, required, item_order, unique_id) VALUES
-- Documentação e Condição Geral
('Documentos do veículo estão corretos', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Geral: Grupo de segurança do tipo três pontas para todos os ocupantes do veículo (não é permitida a utilização de presilhas)?', true, 1, 'CAMINHAO'),
('Documentos em boas condições', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Os pneus estão em boas condições de uso?', true, 2, 'CAMINHAO'),
('Setas dianteiras e traseiras funcionando', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Setas dianteiras e traseiras, luz de freio, pisca alerta e transformação dos faróis alto-baixo, estão em perfeito estado de funcionamento?', true, 3, 'CAMINHAO'),
('Para-choque bem afixado', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: O para-choque (dianteiro e traseiro) está bem afixado?', true, 4, 'CAMINHAO'),
('Adesivos refletivos nas laterais', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Está afixado adesivos refletivos (2 cores) de sinalização nas laterais do veículo?', true, 5, 'CAMINHAO'),
('Placas do veículo em bom estado', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: As placas do veículo, afixadas na dianteira e traseira, encontram-se em bom estado?', true, 6, 'CAMINHAO'),
('Estado geral de conservação', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Estado geral de conservação das estruturas, carroceria, vidros, etc.?', true, 7, 'CAMINHAO'),
('Equipamentos obrigatórios', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Foram checados os equipamentos obrigatórios, triângulo, chave de roda, pneu estepe e macaco?', true, 8, 'CAMINHAO'),
('Dispositivos de sinalização', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Existem os dispositivos, sinalização, verificadores de freios, dispositivos, chave para desenergização do sistema elétrico, estão em perfeito estado de funcionamento?', true, 9, 'CAMINHAO'),
('Equipamentos de dotação do ambiente', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Os equipamentos diversos de dotação do ambiente para manobras em marcha a ré, com nível sonoro acima dos níveis do ambiente?', true, 10, 'CAMINHAO'),
('Condição de visibilidade', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Os espelhos retrovisores, proporcionam condição de visibilidade satisfatória para freio de serviço?', true, 11, 'CAMINHAO'),
('Limpador de águas para-brisa', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Limpador e esquicho de água para para-brisa estão funcionando?', true, 12, 'CAMINHAO'),
('Possuí macacos com travas nas portas', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Possuí macacos com travas nas portas?', true, 13, 'CAMINHAO'),
('Equipamento livre de vazamento', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: O equipamento está livre de vazamento de óleo/combustível?', true, 14, 'CAMINHAO'),
('Indicadores do painel funcionando', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Os indicadores do painel estão funcionando, e encontram em perfeito estado de conservação?', true, 15, 'CAMINHAO'),
('Motores do equipamento funcionando', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Os motores do equipamento e de partida encontram-se em bom estado de funcionamento?', true, 16, 'CAMINHAO'),
('Sistemas de freio dinâmico', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: Os sistemas de freio dinâmico e estático estão funcionando?', true, 17, 'CAMINHAO'),
('Cintas de sinalização utilizadas', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: O caminhão-munck possuí cones de sinalização que possam ser utilizados para isolar a área?', true, 18, 'CAMINHAO'),
('Estrutura da cinta sem sinais', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: A estrutura da cinta não apresenta sinais de ressecamento devido à exposição ao sol e chuva?', true, 19, 'CAMINHAO'),
('Corpo da cinta sem cortes', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: O corpo da cinta não possuí cortes em sua estrutura?', true, 20, 'CAMINHAO'),
('Cinta possuí capacidade de carga', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: A cinta possuí capacidade de carga com identificação única legível?', true, 21, 'CAMINHAO'),
('Costuras da cinta intactas', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: As costuras da cinta estão intactas?', true, 22, 'CAMINHAO'),
('Cinta não possuí emendas por nós', 'Caminhao/Caminhao-Munck', 'Documentação e Condição Geral: A cinta não possuí emendas por nós?', true, 23, 'CAMINHAO'),
('Motivo possui trava de segurança', 'Caminhao/Caminhao-Munck', 'Itens Adicionais para Caminhão-Munck: O motivo possui trava de segurança e está em boas condições?', true, 24, 'CAMINHAO'),
-- Itens Adicionais para Caminhão-Munck
('Certificado aferição do tacógrafo', 'Caminhao/Caminhao-Munck', 'Itens Adicionais para Caminhão-Munck: Certificado aferição do tacógrafo foi apresentado?', true, 25, 'CAMINHAO'),
('Está com o som ligado', 'Caminhao/Caminhao-Munck', 'Itens Adicionais para Caminhão-Munck: Não está com o som ligado?', true, 26, 'CAMINHAO'),
('Veículo possui câmera de ré', 'Caminhao/Caminhao-Munck', 'Itens Adicionais para Caminhão-Munck: Veículo possui câmera de ré?', true, 27, 'CAMINHAO'),
-- Informações do Operador
('Motorista possui utiliza crachá com foto', 'Caminhao/Caminhao-Munck', 'Informações do Operador: O motorista possui e utiliza crachá com foto visível, identificando o nome, função e nome da empresa para a qual trabalha?', true, 28, 'CAMINHAO'),
('Operador/motorista habilitado', 'Caminhao/Caminhao-Munck', 'Informações do Operador: O OPERADOR/MOTORISTA está HABILITADO?', true, 29, 'CAMINHAO');

-- Inserir itens de checklist para VEÍCULOS LEVES (CARRO/MOTO)
INSERT INTO public.checklist_items (name, category, description, required, item_order, unique_id) VALUES
-- Documentação e Condição Geral
('Estado geral do veículo está bom', 'Veiculos Leves (Carro/Moto)', 'Documentação e Condição Geral: O estado geral do veículo está bom?', true, 1, 'CARRO'),
('Documentação do veículo CRLV correta', 'Veiculos Leves (Carro/Moto)', 'Documentação e Condição Geral: A documentação do veículo (CRLV) está correta e atualizada?', true, 2, 'CARRO'),
('Veículo apresenta VAZAMENTOS', 'Veiculos Leves (Carro/Moto)', 'Documentação e Condição Geral: O veículo apresenta VAZAMENTOS?', true, 3, 'CARRO'),
('Conservação e limpeza interna impecável', 'Veiculos Leves (Carro/Moto)', 'Documentação e Condição Geral: A conservação e limpeza interna está impecável?', true, 4, 'CARRO'),
('Pneus estão dentro da faixa', 'Veiculos Leves (Carro/Moto)', 'Pneus e Acessórios de Segurança: Os PNEUS estão dentro da faixa de validade de uso até rodagem mínima (1,6 mm)?', true, 5, 'CARRO'),
('ESTEPE está dentro da faixa', 'Veiculos Leves (Carro/Moto)', 'Pneus e Acessórios de Segurança: O ESTEPE está dentro da faixa de validade de uso (até 5 anos)?', true, 6, 'CARRO'),
('Equipamento está com MACACO', 'Veiculos Leves (Carro/Moto)', 'Pneus e Acessórios de Segurança: O equipamento está com MACACO, TRIÂNGULO e CHAVE DE RODA?', true, 7, 'CARRO'),
-- Sistemas de Iluminação e Sinalização
('Luz de FREIO responde adequadamente', 'Veiculos Leves (Carro/Moto)', 'Sistemas de Iluminação e Sinalização: A luz de FREIO responde adequadamente?', true, 8, 'CARRO'),
('Luz de RÉ responde adequadamente', 'Veiculos Leves (Carro/Moto)', 'Sistemas de Iluminação e Sinalização: A luz de RÉ responde adequadamente?', true, 9, 'CARRO'),
('Luzes de ALERTA estão piscando', 'Veiculos Leves (Carro/Moto)', 'Sistemas de Iluminação e Sinalização: As luzes de ALERTA estão piscando?', true, 10, 'CARRO'),
('FARÓIS todos acendendo', 'Veiculos Leves (Carro/Moto)', 'Sistemas de Iluminação e Sinalização: Os FARÓIS todos acendendo luz de posição, luz alta, luz baixa, luz de neblina?', true, 11, 'CARRO'),
-- Sistemas Operacionais e Fluidos
('BUZINA está funcionando', 'Veiculos Leves (Carro/Moto)', 'Sistemas Operacionais e Fluidos: A BUZINA está funcionando?', true, 12, 'CARRO'),
('MOTOR de incêndio encontra no veículo', 'Veiculos Leves (Carro/Moto)', 'Sistemas Operacionais e Fluidos: O MOTOR de incêndio se encontra no veículo e está na validade?', true, 13, 'CARRO'),
('ÓLEO DO MOTOR', 'Veiculos Leves (Carro/Moto)', 'Sistemas Operacionais e Fluidos: O ÓLEO DO MOTOR e outros fluidos estão nos níveis corretos?', true, 14, 'CARRO'),
('SISTEMA DE FREIO está respondendo', 'Veiculos Leves (Carro/Moto)', 'Sistemas Operacionais e Fluidos: O SISTEMA DE FREIO está respondendo adequadamente?', true, 15, 'CARRO'),
-- Itens Adicionais
('RETROVISORES internos e externos', 'Veiculos Leves (Carro/Moto)', 'Itens Adicionais: Os RETROVISORES (interno e externo) estão em boas condições?', true, 16, 'CARRO'),
('OPERADOR/MOTORISTA habilitado', 'Veiculos Leves (Carro/Moto)', 'Itens Adicionais: O OPERADOR/MOTORISTA está HABILITADO?', true, 17, 'CARRO');

-- Inserir itens de checklist para RETROESCAVADEIRA
INSERT INTO public.checklist_items (name, category, description, required, item_order, unique_id) VALUES
-- Identificação da Retroescavadeira
('Data de inspeção', 'Retroescavadeira', 'Identificação da Retroescavadeira: Data de inspeção?', true, 1, 'RETROESCAVADEIRA'),
('Operador responsável', 'Retroescavadeira', 'Identificação da Retroescavadeira: Operador responsável?', true, 2, 'RETROESCAVADEIRA'),
('Número de série da máquina', 'Retroescavadeira', 'Identificação da Retroescavadeira: Número de série da máquina?', true, 3, 'RETROESCAVADEIRA'),
('Horímetro atual', 'Retroescavadeira', 'Identificação da Retroescavadeira: Horímetro atual?', true, 4, 'RETROESCAVADEIRA'),
-- Verificação Diária Antes da Operação
('Verificar nível do óleo do motor', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Verificar nível do óleo do motor?', true, 5, 'RETROESCAVADEIRA'),
('Conferir nível do óleo hidráulico', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Conferir nível do óleo hidráulico?', true, 6, 'RETROESCAVADEIRA'),
('Inspecionar vazamentos de óleo', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Inspecionar vazamentos de óleo em mangueiras e conexões?', true, 7, 'RETROESCAVADEIRA'),
('Verificar antes da operação', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Verificar antes da operação se lubrificar pinos e articulações?', true, 8, 'RETROESCAVADEIRA'),
('Conferir nível do líquido de arrefecimento', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Conferir nível do líquido de arrefecimento?', true, 9, 'RETROESCAVADEIRA'),
('Verificar mangueiras e radiador', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Verificar mangueiras e radiador em busca de vazamentos?', true, 10, 'RETROESCAVADEIRA'),
('Checar funcionamento do ventilador', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Checar funcionamento do ventilador?', true, 11, 'RETROESCAVADEIRA'),
('Verificar pressão dos pneus', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Verificar pressão dos pneus?', true, 12, 'RETROESCAVADEIRA'),
('Avaliar nível de combustível', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Avaliar nível de combustível?', true, 13, 'RETROESCAVADEIRA'),
('Checar condições das portas', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Checar condições das portas e vidros?', true, 14, 'RETROESCAVADEIRA'),
('Observar ruídos incomuns', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Observar ruídos incomuns no motor ou na transmissão?', true, 15, 'RETROESCAVADEIRA'),
('Conferir alinhamento da caçamba', 'Retroescavadeira', 'Verificação Diária Antes da Operação: Conferir alinhamento e operação da caçamba e do braço?', true, 16, 'RETROESCAVADEIRA'),
-- Verificação Durante a Operação
('Observar pressão do óleo', 'Retroescavadeira', 'Verificação Durante a Operação: Observar a pressão do óleo?', true, 17, 'RETROESCAVADEIRA'),
('Checar há vazamento durante operação', 'Retroescavadeira', 'Verificação Durante a Operação: Checar há vazamento durante a operação?', true, 18, 'RETROESCAVADEIRA'),
('Verificar funcionamento adequado', 'Retroescavadeira', 'Verificação Durante a Operação: Verificar funcionamento adequado do sistema hidráulico?', true, 19, 'RETROESCAVADEIRA'),
('Limpar a retroescavadeira', 'Retroescavadeira', 'Verificação Após a Operação: Limpar a retroescavadeira, removendo sujeira e detritos?', true, 20, 'RETROESCAVADEIRA'),
-- Verificação Após a Operação
('Verificar novamente possíveis vazamentos', 'Retroescavadeira', 'Verificação Após a Operação: Verificar novamente possíveis vazamentos?', true, 21, 'RETROESCAVADEIRA'),
('Abastecer o tanque de combustível', 'Retroescavadeira', 'Verificação Após a Operação: Abastecer o tanque de combustível, se necessário?', true, 22, 'RETROESCAVADEIRA'),
('Lubrificar componentes expostos', 'Retroescavadeira', 'Verificação Após a Operação: Lubrificar componentes expostos a maior desgaste?', true, 23, 'RETROESCAVADEIRA'),
('Testar luzes dianteiras', 'Retroescavadeira', 'Verificação Após a Operação: Testar luzes dianteiras, traseiras e de sinalização?', true, 24, 'RETROESCAVADEIRA'),
('Checar funcionamento da buzina', 'Retroescavadeira', 'Verificação Após a Operação: Checar funcionamento da buzina?', true, 25, 'RETROESCAVADEIRA'),
('Inspecionar estrutura da cabine', 'Retroescavadeira', 'Verificação Após a Operação: Inspecionar estrutura da cabine, assento e cinto de segurança?', true, 26, 'RETROESCAVADEIRA'),
('Checar condições das portas e vidros', 'Retroescavadeira', 'Verificação Após a Operação: Checar condições das portas e vidros?', true, 27, 'RETROESCAVADEIRA'),
('Verificar antena do motor', 'Retroescavadeira', 'Verificação Após a Operação: Verificar antena do motor ou na transmissão?', true, 28, 'RETROESCAVADEIRA'),
('Verificar painel e indicadores', 'Retroescavadeira', 'Verificação Após a Operação: Verificar painel e indicadores de funcionamento?', true, 29, 'RETROESCAVADEIRA'),
('Inspecionar vazamentos nos cilindros', 'Retroescavadeira', 'Verificação Após a Operação: Inspecionar vazamentos nos cilindros e mangueiras?', true, 30, 'RETROESCAVADEIRA'),
('Testar funcionamento dos comandos', 'Retroescavadeira', 'Verificação Após a Operação: Testar funcionamento dos comandos hidráulicos?', true, 31, 'RETROESCAVADEIRA'),
('Conferir alinhamento da caçamba e braço', 'Retroescavadeira', 'Verificação Após a Operação: Conferir alinhamento e operação da caçamba e do braço?', true, 32, 'RETROESCAVADEIRA');