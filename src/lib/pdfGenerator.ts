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
  }>;
}

export const generateChecklistPDF = async (data: ChecklistPDFData): Promise<jsPDF> => {
  const doc = new jsPDF();
  let yPosition = 15;
  const pageHeight = doc.internal.pageSize.height;
  const marginBottom = 20;

  // Função para filtrar itens por categoria do veículo
  const getRelevantCategories = (vehicleCategory: string): string[] => {
    const categoryMap: Record<string, string[]> = {
      'carro': ['interior', 'exterior', 'safety', 'mechanical'],
      'moto': ['exterior', 'safety', 'mechanical'],
      'caminhao': ['interior', 'exterior', 'safety', 'mechanical', 'cargo'],
      'onibus': ['interior', 'exterior', 'safety', 'mechanical', 'passenger'],
      'van': ['interior', 'exterior', 'safety', 'mechanical']
    };
    return categoryMap[vehicleCategory.toLowerCase()] || ['interior', 'exterior', 'safety', 'mechanical'];
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

  // Cabeçalho compacto com dados da empresa
  const companyData = data.companyInfo || {
    name: 'FC GESTÃO EMPRESARIAL LTDA',
    cnpj: '05.873.924/0001-80',
    email: 'contato@fcgestao.com.br',
    address: 'Rua princesa imperial, 220 - Realengo - RJ'
  };
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(companyData.name, 20, yPosition);
  yPosition += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`CNPJ: ${companyData.cnpj} | Email: ${companyData.email}`, 20, yPosition);
  yPosition += 3;
  doc.text(companyData.address, 20, yPosition);
  yPosition += 10;

  // Título principal
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CHECKLIST DE INSPEÇÃO VEICULAR', 105, yPosition, { align: 'center' });
  yPosition += 12;

  // Seção de informações gerais
  checkPageBreak(60);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES GERAIS', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${format(data.inspection_date, 'dd/MM/yyyy', { locale: ptBR })}`, 20, yPosition);
  doc.text('Hora: ___:___', 120, yPosition);
  yPosition += 8;
  
  doc.text(`Inspetor: ${data.inspectorInfo.first_name} ${data.inspectorInfo.last_name}`, 20, yPosition);
  yPosition += 8;
  
  doc.text('Técnico de Segurança: ________________', 20, yPosition);
  yPosition += 15;

  // Dados do veículo
  checkPageBreak(60);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO VEÍCULO', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Placa: ${data.vehicleInfo.license_plate || '_____________'}`, 20, yPosition);
  doc.text(`Modelo: ${data.vehicleInfo.model || '_____________'}`, 120, yPosition);
  yPosition += 8;
  
  doc.text(`Ano: ${data.vehicleInfo.year || '____'}`, 20, yPosition);
  doc.text(`Categoria: ${data.vehicleInfo.vehicle_category || '_____________'}`, 120, yPosition);
  yPosition += 8;
  
  doc.text(`Quilometragem: ${data.vehicle_mileage || '_______'} km`, 20, yPosition);
  doc.text('Combustível: ________________', 120, yPosition);
  yPosition += 8;
  
  doc.text('Chassi: ________________________', 20, yPosition);
  yPosition += 8;
  
  doc.text('RENAVAM: ________________________', 20, yPosition);
  yPosition += 15;

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

  // Filtrar categorias relevantes para o tipo de veículo
  const relevantCategories = getRelevantCategories(data.vehicleInfo.vehicle_category);
  
  // Agrupar apenas categorias relevantes
  const categories = {
    interior: 'ITENS INTERNOS',
    exterior: 'ITENS EXTERNOS', 
    safety: 'ITENS DE SEGURANÇA',
    mechanical: 'ITENS MECÂNICOS',
    cargo: 'ITENS DE CARGA',
    passenger: 'ITENS DE PASSAGEIROS'
  };

  Object.entries(categories).forEach(([categoryKey, categoryTitle]) => {
    // Verificar se a categoria é relevante para o tipo de veículo
    if (!relevantCategories.includes(categoryKey)) return;
    
    const categoryItems = data.checklist_items.filter(item => item.category === categoryKey);
    
    if (categoryItems.length > 0) {
      checkPageBreak(30);
      
      // Título da categoria
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(categoryTitle, 20, yPosition);
      yPosition += 8;

      // Itens da categoria
      categoryItems.forEach(item => {
        checkPageBreak(15);
        const itemKey = item.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const itemData = data.checklistItems[itemKey] || { status: 'não verificado' };
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        // Nome do item
        const itemText = item.name.length > 50 ? item.name.substring(0, 47) + '...' : item.name;
        doc.text(itemText, 20, yPosition);
        
        // Checkboxes - marcar baseado no status
        // Desenhar quadrados para os checkboxes
        doc.rect(130, yPosition - 3, 4, 4);
        doc.rect(150, yPosition - 3, 4, 4);
        doc.rect(170, yPosition - 3, 4, 4);
        
        // Marcar checkbox apropriado
        if (itemData.status === 'funcionando') {
          // Marcar SIM (X)
          doc.text('X', 131, yPosition);
        } else if (itemData.status === 'ausente' || itemData.status === 'revisao') {
          // Marcar NÃO (X)
          doc.text('X', 151, yPosition);
        } else {
          // Marcar N/A (X) para não verificado
          doc.text('X', 171, yPosition);
        }
        
        yPosition += 7;

        // Observação se houver
        if (itemData.observation && itemData.observation.trim()) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          const obsText = `Obs: ${itemData.observation}`;
          const obsTextTruncated = obsText.length > 80 ? obsText.substring(0, 77) + '...' : obsText;
          doc.text(obsTextTruncated, 25, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 5;
        }
      });
      yPosition += 8;
    }
  });

  // Seção de documentação
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DOCUMENTAÇÃO', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Documentos básicos
  const documentos = [
    'CRLV em dia',
    'Certificado de Vistoria',
    'Seguro Obrigatório',
    'Licenciamento',
    'Carteira do Motorista válida'
  ];
  
  documentos.forEach(doc_item => {
    doc.text(doc_item, 20, yPosition);
    doc.rect(130, yPosition - 3, 4, 4);
    doc.rect(150, yPosition - 3, 4, 4);
    doc.rect(170, yPosition - 3, 4, 4);
    yPosition += 7;
  });
  
  yPosition += 10;

  // Observações e Condições
  checkPageBreak(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OBSERVAÇÕES GERAIS', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Condição geral do veículo
  const condicaoGeral = data.overall_condition || '';
  doc.text('Condição Geral do Veículo:', 20, yPosition);
  yPosition += 8;
  doc.text(condicaoGeral || '____________________________________', 20, yPosition);
  yPosition += 12;
  
  // Observações adicionais
  doc.text('Observações Adicionais:', 20, yPosition);
  yPosition += 8;
  if (data.additional_notes && data.additional_notes.trim()) {
    const lines = doc.splitTextToSize(data.additional_notes, 170);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
  } else {
    // Linhas em branco para preenchimento manual
    for (let i = 0; i < 4; i++) {
      doc.text('____________________________________________________________________', 20, yPosition);
      yPosition += 8;
    }
  }
  yPosition += 15;

  // Combustível no tanque
  checkPageBreak(30);
  doc.text('Combustível no tanque:', 20, yPosition);
  doc.text('( ) 1/4', 120, yPosition);
  doc.text('( ) 1/2', 140, yPosition);
  doc.text('( ) 3/4', 160, yPosition);
  doc.text('( ) Cheio', 180, yPosition);
  yPosition += 15;

  // Fotos anexadas
  if (data.interior_photo_url || data.exterior_photo_url) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FOTOS DA INSPEÇÃO', 20, yPosition);
    yPosition += 10;

    if (data.interior_photo_url) {
      await addImageToPDF(data.interior_photo_url, 'Foto Interior:', 80);
    }

    if (data.exterior_photo_url) {
      await addImageToPDF(data.exterior_photo_url, 'Foto Exterior:', 80);
    }
  } else {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FOTOS DA INSPEÇÃO', 20, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Foto Interior: ________________________________', 20, yPosition);
    yPosition += 8;
    doc.text('Foto Exterior: ________________________________', 20, yPosition);
    yPosition += 15;
  }

  // Seção de assinaturas
  checkPageBreak(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RESPONSÁVEIS PELA INSPEÇÃO', 20, yPosition);
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Inspetor
  doc.text('Inspetor:', 20, yPosition);
  yPosition += 8;
  doc.text(`Nome: ${data.inspectorInfo.first_name} ${data.inspectorInfo.last_name}`, 20, yPosition);
  yPosition += 8;
  
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
  
  // Técnico de Segurança
  doc.text('Técnico de Segurança:', 20, yPosition);
  yPosition += 8;
  doc.text('Nome: ________________________________', 20, yPosition);
  yPosition += 8;
  doc.text('Assinatura: ______________________________', 20, yPosition);
  yPosition += 20;

  // Rodapé com data e informações da empresa
  checkPageBreak(30);
  yPosition = Math.max(yPosition, pageHeight - 40);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`${companyData.name} - CNPJ: ${companyData.cnpj}`, 105, yPosition, { align: 'center' });
  doc.text(`Relatório gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, yPosition + 6, { align: 'center' });
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