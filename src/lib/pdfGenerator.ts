import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChecklistPDFData {
  vehicleInfo: {
    model: string;
    license_plate: string;
    year: number;
    vehicle_category: string;
  };
  inspectorInfo: {
    first_name: string;
    last_name: string;
  };
  companyInfo?: {
    name: string;
    cnpj: string;
    email: string;
    address: string;
  };
  inspection_date: Date;
  vehicle_mileage: string;
  overall_condition: string;
  additional_notes: string;
  interior_photo_url?: string | null;
  exterior_photo_url?: string | null;
  inspector_signature?: string | null;
  checklistItems: Record<string, { status: string; observation?: string }>;
  checklist_items: Array<{
    name: string;
    description?: string;
    category: string;
    required: boolean;
    unique_id?: string;
  }>;
}

export const generateChecklistPDF = async (data: ChecklistPDFData): Promise<jsPDF> => {
  const doc = new jsPDF();
  let yPosition = 15;
  const pageHeight = doc.internal.pageSize.height;
  const marginBottom = 20;

  // Função para mapear categorias de veículo para unique_id (mesma lógica do Preview)
  const getUniqueIdByCategory = (category: string) => {
    switch(category?.toLowerCase()) {
      case 'caminhao':
      case 'caminhão':
        return 'CAMINHAO';
      case 'carro':
      case 'moto':
        return 'CARRO';
      case 'retroescavadeira':
        return 'RETROESCAVADEIRA';
      default:
        return 'CARRO'; // Default para carro se não especificado
    }
  };

  // Função para obter título da categoria (mesma do Preview)
  const getCategoryTitle = (category: string): string => {
    const titles: Record<string, string> = {
      'interior': 'Interior do Veículo',
      'exterior': 'Exterior do Veículo',
      'safety': 'Itens de Segurança',
      'mechanical': 'Componentes Mecânicos',
      'cargo': 'Área de Carga',
      'passenger': 'Área de Passageiros'
    };
    return titles[category] || category;
  };

  // Função para gerar chave consistente (mesma do Preview)
  const getFieldKey = (itemName: string) => {
    return itemName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .replace(/^_+|_+$/g, ''); // Remove underscores do início e fim
  };

  // Função para adicionar quebra de página se necessário
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - marginBottom) {
      doc.addPage();
      yPosition = 15;
    }
  };

  // Função para adicionar imagem ao PDF
  const addImageToPDF = async (imageUrl: string, title: string, maxWidth: number = 160) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const result = e.target?.result as string;
            
            // Criar uma imagem para obter dimensões
            const img = new Image();
            img.onload = function(this: HTMLImageElement) {
              const imgWidth = this.width;
              const imgHeight = this.height;
              
              // Calcular dimensões proporcionais
              const aspectRatio = imgWidth / imgHeight;
              let width = maxWidth;
              let height = width / aspectRatio;
              
              // Se a altura for muito grande, ajustar baseado na altura
              if (height > 100) {
                height = 100;
                width = height * aspectRatio;
              }
              
              checkPageBreak(height + 20);
              doc.setFont('helvetica', 'bold');
              doc.text(title, 20, yPosition);
              yPosition += 10;
              
              doc.addImage(result, 'JPEG', 20, yPosition, width, height);
              yPosition += height + 10;
              
              resolve();
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = result;
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      // Se falhar, apenas adicionar texto indicando que a imagem não pôde ser carregada
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      doc.text('(Imagem não disponível)', 20, yPosition);
      yPosition += 10;
    }
  };

  // Cabeçalho da empresa - seguindo padrão do Preview
  const companyData = data.companyInfo || {
    name: 'FC GESTÃO EMPRESARIAL LTDA',
    cnpj: '05.873.924/0001-80',
    email: 'contato@fcgestao.com.br',
    address: 'Rua princesa imperial, 220 - Realengo - RJ'
  };
  
  // Cabeçalho centralizado (mesmo padrão do Preview)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyData.name, 105, yPosition, { align: 'center' });
  yPosition += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`CNPJ: ${companyData.cnpj} | Email: ${companyData.email}`, 105, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text(companyData.address, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Título principal centralizado
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CHECKLIST DE INSPEÇÃO VEICULAR', 105, yPosition, { align: 'center' });
  yPosition += 20;

  // Layout em duas colunas (igual ao Preview)
  checkPageBreak(80);
  
  // Coluna 1: Informações Gerais
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações Gerais', 20, yPosition);
  
  // Coluna 2: Dados do Veículo  
  doc.text('Dados do Veículo', 120, yPosition);
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Informações Gerais (coluna esquerda)
  doc.text(`Data da Inspeção: ${format(data.inspection_date, 'dd/MM/yyyy', { locale: ptBR })}`, 20, yPosition);
  
  // Dados do Veículo (coluna direita)
  doc.text(`Modelo: ${data.vehicleInfo.model || 'Não informado'}`, 120, yPosition);
  yPosition += 6;
  
  doc.text(`Inspetor: ${data.inspectorInfo.first_name} ${data.inspectorInfo.last_name}`, 20, yPosition);
  doc.text(`Placa: ${data.vehicleInfo.license_plate || 'Não informado'}`, 120, yPosition);
  yPosition += 6;
  
  doc.text(`Quilometragem: ${data.vehicle_mileage || 'Não informado'} km`, 20, yPosition);
  doc.text(`Ano: ${data.vehicleInfo.year || 'Não informado'}`, 120, yPosition);
  yPosition += 6;
  
  // Linha em branco na coluna esquerda e categoria na direita
  doc.text(`Categoria: ${data.vehicleInfo.vehicle_category}`, 120, yPosition);
  yPosition += 20;

  // Itens do Checklist - Formato planilha com tabela
  checkPageBreak(60);
  doc.setFont('helvetica', 'bold');
  doc.text('CHECKLIST DE ITENS', 20, yPosition);
  yPosition += 15;

  // Cabeçalho da tabela
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM', 20, yPosition);
  doc.text('SIM', 130, yPosition);
  doc.text('NÃO', 150, yPosition);
  doc.text('N/A', 170, yPosition);
  yPosition += 8;

  // Linha horizontal
  doc.line(20, yPosition - 2, 190, yPosition - 2);
  yPosition += 5;

  // Filtrar itens baseado no unique_id da categoria do veículo (mesma lógica do Preview)
  const vehicleUniqueId = getUniqueIdByCategory(data.vehicleInfo.vehicle_category);
  const filteredChecklistItems = data.checklist_items.filter(item => 
    item.unique_id === vehicleUniqueId
  );

  // Agrupar itens por categoria (mesmo padrão do Preview)
  const itemsByCategory = filteredChecklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Renderizar cada categoria
  Object.entries(itemsByCategory).forEach(([categoryKey, categoryItems]) => {
    if (categoryItems.length > 0) {
      checkPageBreak(30);
      
      // Título da categoria
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(getCategoryTitle(categoryKey), 20, yPosition);
      yPosition += 12;

      // Cabeçalho da tabela para cada categoria
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ITEM', 20, yPosition);
      doc.text('SIM', 170, yPosition);
      yPosition += 6;

      // Linha horizontal
      doc.line(20, yPosition - 2, 190, yPosition - 2);
      yPosition += 4;

      // Itens da categoria
      categoryItems.forEach(item => {
        checkPageBreak(15);
        const fieldKey = getFieldKey(item.name);
        const itemData = data.checklistItems[fieldKey] || { status: 'não verificado' };
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        // Nome do item
        const itemText = item.name.length > 60 ? item.name.substring(0, 57) + '...' : item.name;
        doc.text(itemText, 20, yPosition);
        
        // Identificação da Retroescavadeira: Data de inspeção?
        if (item.description) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          const descText = item.description.length > 50 ? item.description.substring(0, 47) + '...' : item.description;
          doc.text(descText, 25, yPosition + 4);
          doc.setTextColor(0, 0, 0);
          yPosition += 4;
        }
        
        // Checkbox SIM
        doc.rect(170, yPosition - 3, 4, 4);
        
        // Marcar SIM se status é funcionando/ok
        if (itemData.status === 'funcionando' || itemData.status === 'ok') {
          doc.text('X', 171, yPosition);
        }
        
        yPosition += 8;

        // Observação se houver
        if (itemData.observation && itemData.observation.trim()) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          const obsText = `Identificação da Retroescavadeira: ${itemData.observation}`;
          const obsTextTruncated = obsText.length > 80 ? obsText.substring(0, 77) + '...' : obsText;
          doc.text(obsTextTruncated, 25, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 6;
        }
      });
      yPosition += 8;
    }
  });

  // Seção de documentação (simplificada)
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DOCUMENTAÇÃO', 20, yPosition);
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Documentos básicos
  const documentos = [
    'CRLV em dia',
    'Certificado de Vistoria', 
    'Seguro Obrigatório'
  ];
  
  documentos.forEach(doc_item => {
    doc.text(doc_item, 20, yPosition);
    doc.rect(170, yPosition - 3, 4, 4);
    yPosition += 8;
  });
  
  yPosition += 15;

  // Observações e Condições (seguindo padrão Preview)
  if (data.overall_condition || data.additional_notes) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('OBSERVAÇÕES GERAIS', 20, yPosition);
    yPosition += 15;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Condição geral do veículo
    if (data.overall_condition) {
      doc.text('Condição Geral do Veículo:', 20, yPosition);
      yPosition += 8;
      const lines = doc.splitTextToSize(data.overall_condition, 170);
      lines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 8;
    }
    
    // Observações adicionais
    if (data.additional_notes) {
      doc.text('Observações Adicionais:', 20, yPosition);
      yPosition += 8;
      const lines = doc.splitTextToSize(data.additional_notes, 170);
      lines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
    }
    yPosition += 15;
  }

  // Fotos (seguindo padrão Preview)
  if (data.interior_photo_url || data.exterior_photo_url) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DOCUMENTAÇÃO FOTOGRÁFICA', 20, yPosition);
    yPosition += 15;

    if (data.interior_photo_url) {
      await addImageToPDF(data.interior_photo_url, 'Foto Interna:', 80);
    }

    if (data.exterior_photo_url) {
      await addImageToPDF(data.exterior_photo_url, 'Foto Externa:', 80);
    }
  }

  // Seção de assinaturas (seguindo padrão Preview)
  checkPageBreak(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ASSINATURA DO INSPETOR', 20, yPosition);
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Inspetor
  doc.text(`Inspetor: ${data.inspectorInfo.first_name} ${data.inspectorInfo.last_name}`, 20, yPosition);
  yPosition += 10;
  
  if (data.inspector_signature) {
    try {
      await addImageToPDF(data.inspector_signature, '', 80);
    } catch (error) {
      doc.text('Assinatura: ______________________________', 20, yPosition);
      yPosition += 15;
    }
  } else {
    doc.text('Assinatura: ______________________________', 20, yPosition);
    yPosition += 15;
  }

  // Rodapé (seguindo padrão Preview)
  checkPageBreak(30);
  yPosition = Math.max(yPosition, pageHeight - 40);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Documento gerado em ${format(new Date(), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}`, 105, yPosition, { align: 'center' });
  doc.text('Sistema de Gestão de Checklists - FC Gestão Empresarial', 105, yPosition + 6, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  return doc;
};

export const downloadPDF = async (doc: jsPDF, filename: string) => {
  // Para web - abre a caixa de diálogo "Salvar como"
  doc.save(filename);
};

export const getPDFBlob = (doc: jsPDF): Blob => {
  return doc.output('blob');
};