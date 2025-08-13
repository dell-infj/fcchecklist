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
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const marginBottom = 20;

  // Função para adicionar quebra de página se necessário
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - marginBottom) {
      doc.addPage();
      yPosition = 20;
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

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE INSPEÇÃO VEICULAR', 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Data da inspeção
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data da Inspeção: ${format(data.inspection_date, 'dd/MM/yyyy', { locale: ptBR })}`, 20, yPosition);
  yPosition += 10;

  // Informações do Veículo
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO VEÍCULO', 20, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Modelo: ${data.vehicleInfo.model}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Placa: ${data.vehicleInfo.license_plate}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Ano: ${data.vehicleInfo.year}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Categoria: ${data.vehicleInfo.vehicle_category}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Quilometragem: ${data.vehicle_mileage} km`, 20, yPosition);
  yPosition += 10;

  // Informações do Inspetor
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.text('INSPETOR RESPONSÁVEL', 20, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${data.inspectorInfo.first_name} ${data.inspectorInfo.last_name}`, 20, yPosition);
  yPosition += 15;

  // Itens do Checklist por categoria
  const categories = {
    interior: 'ITENS INTERNOS',
    exterior: 'ITENS EXTERNOS',
    safety: 'ITENS DE SEGURANÇA',
    mechanical: 'ITENS MECÂNICOS'
  };

  Object.entries(categories).forEach(([categoryKey, categoryTitle]) => {
    const categoryItems = data.checklist_items.filter(item => item.category === categoryKey);
    
    if (categoryItems.length > 0) {
      checkPageBreak(30);
      doc.setFont('helvetica', 'bold');
      doc.text(categoryTitle, 20, yPosition);
      yPosition += 8;

      categoryItems.forEach(item => {
        const itemKey = item.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const itemData = data.checklistItems[itemKey] || { status: 'não verificado' };
        
        checkPageBreak(20);
        doc.setFont('helvetica', 'normal');
        
        // Status com cor
        let statusColor: [number, number, number] = [0, 0, 0];
        if (itemData.status === 'funcionando') statusColor = [0, 150, 0];
        else if (itemData.status === 'revisao') statusColor = [255, 140, 0];
        else if (itemData.status === 'ausente') statusColor = [255, 0, 0];

        doc.text(`${item.name}:`, 20, yPosition);
        doc.setTextColor(...statusColor);
        doc.text(itemData.status.toUpperCase(), 120, yPosition);
        doc.setTextColor(0, 0, 0);
        
        yPosition += 6;

        if (itemData.observation && itemData.observation.trim()) {
          doc.setFontSize(10);
          doc.text(`Obs: ${itemData.observation}`, 25, yPosition);
          doc.setFontSize(12);
          yPosition += 6;
        }

        if (item.description) {
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(`${item.description}`, 25, yPosition);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(12);
          yPosition += 6;
        }

        yPosition += 2;
      });
      yPosition += 5;
    }
  });

  // Condição Geral
  if (data.overall_condition) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDIÇÃO GERAL DO VEÍCULO', 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(data.overall_condition, 20, yPosition);
    yPosition += 10;
  }

  // Fotos da Inspeção
  if (data.interior_photo_url || data.exterior_photo_url) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FOTOS DA INSPEÇÃO', 20, yPosition);
    yPosition += 10;

    if (data.interior_photo_url) {
      await addImageToPDF(data.interior_photo_url, 'Foto Interior:', 140);
    }

    if (data.exterior_photo_url) {
      await addImageToPDF(data.exterior_photo_url, 'Foto Exterior:', 140);
    }
  }

  // Observações Adicionais
  if (data.additional_notes && data.additional_notes.trim()) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES ADICIONAIS', 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(data.additional_notes, 170);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
  }

  // Assinatura do Inspetor
  if (data.inspector_signature) {
    checkPageBreak(80);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURA DO INSPETOR', 20, yPosition);
    yPosition += 10;

    try {
      // Adicionar assinatura como imagem
      await addImageToPDF(data.inspector_signature, '', 120);
    } catch (error) {
      console.error('Error adding signature:', error);
      doc.setFont('helvetica', 'normal');
      doc.text('(Assinatura não disponível)', 20, yPosition);
      yPosition += 10;
    }

    // Nome do inspetor
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.inspectorInfo.first_name} ${data.inspectorInfo.last_name}`, 20, yPosition);
    yPosition += 6;
    doc.text('Inspetor Responsável', 20, yPosition);
    yPosition += 15;
  }

  // Rodapé
  checkPageBreak(30);
  yPosition = Math.max(yPosition, pageHeight - 40);
  doc.setFontSize(10);
  doc.text('Relatório gerado automaticamente pelo Sistema de Gestão de Frotas', 105, yPosition, { align: 'center' });
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, yPosition + 8, { align: 'center' });

  return doc;
};

export const downloadPDF = async (doc: jsPDF, filename: string) => {
  // Para web - abre a caixa de diálogo "Salvar como"
  doc.save(filename);
};

export const getPDFBlob = (doc: jsPDF): Blob => {
  return doc.output('blob');
};