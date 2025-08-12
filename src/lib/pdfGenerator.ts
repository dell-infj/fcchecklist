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
  checklistItems: Record<string, { status: string; observation?: string }>;
  checklist_items: Array<{
    name: string;
    description?: string;
    category: string;
    required: boolean;
  }>;
}

export const generateChecklistPDF = (data: ChecklistPDFData): jsPDF => {
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

  // Rodapé
  checkPageBreak(30);
  yPosition = Math.max(yPosition, pageHeight - 40);
  doc.setFontSize(10);
  doc.text('Relatório gerado automaticamente pelo Sistema de Gestão de Frotas', 105, yPosition, { align: 'center' });
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, yPosition + 8, { align: 'center' });

  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  // Para web - abre a caixa de diálogo "Salvar como"
  doc.save(filename);
};

export const getPDFBlob = (doc: jsPDF): Blob => {
  return doc.output('blob');
};