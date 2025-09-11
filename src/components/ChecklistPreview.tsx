import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ChecklistPreviewProps {
  formData: any;
  vehicles: any[];
  inspectors: any[];
  checklistItems: any[];
  profile: any;
}

export const ChecklistPreview: React.FC<ChecklistPreviewProps> = ({
  formData,
  vehicles,
  inspectors,
  checklistItems,
  profile
}) => {
  const { toast } = useToast();

  console.log('ChecklistPreview - formData:', formData);
  console.log('ChecklistPreview - vehicles:', vehicles);
  console.log('ChecklistPreview - inspectors:', inspectors);

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
  let selectedInspector = inspectors.find(i => i.id === formData.inspector_id);

  // Se não encontrou inspetor mas o usuário é inspetor, tentar identificação automática e, em último caso, usar o próprio perfil
  if (!selectedInspector && profile?.role === 'inspector') {
    selectedInspector = inspectors.find(inspector => 
      inspector.id === profile.id || 
      (inspector.first_name === profile.first_name && inspector.last_name === profile.last_name)
    );

    if (!selectedInspector && profile) {
      selectedInspector = {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name
      } as any;
    }
  }

  console.log('ChecklistPreview - selectedVehicle:', selectedVehicle);
  console.log('ChecklistPreview - selectedInspector:', selectedInspector);

  // Mapear categorias de veículo para unique_id (mesma lógica do DynamicChecklistForm)
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'funcionando': return 'text-green-600 bg-green-50';
      case 'revisao': return 'text-yellow-600 bg-yellow-50';
      case 'ausente': return 'text-red-600 bg-red-50';
      case 'ok': return 'text-green-600 bg-green-50';
      case 'not_ok': return 'text-red-600 bg-red-50';
      case 'not_applicable': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'funcionando': return 'SIM';
      case 'revisao': return 'REVISÃO';
      case 'ausente': return 'AUSENTE';
      case 'ok': return 'OK';
      case 'not_ok': return 'NÃO OK';
      case 'not_applicable': return 'N/A';
      default: return 'Não verificado';
    }
  };

  // Função para gerar uma chave consistente para o campo do formulário (mesma do DynamicChecklistForm)
  const getFieldKey = (itemName: string) => {
    return itemName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .replace(/^_+|_+$/g, ''); // Remove underscores do início e fim
  };

  if (!selectedVehicle || !selectedInspector) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>Selecione um veículo e inspetor para visualizar o preview</p>
      </div>
    );
  }

  // Filtrar itens baseado no unique_id da categoria do veículo
  const vehicleUniqueId = getUniqueIdByCategory(selectedVehicle.vehicle_category);
  const filteredChecklistItems = checklistItems.filter(item => 
    item.unique_id === vehicleUniqueId
  );

  return (
    <div className="w-full bg-white">
      {/* Document Content - Exatamente como será no PDF */}
      <div className="p-8 bg-white text-black" style={{ 
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#000'
      }}>
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { margin: 0 !important; font-size: 14px !important; }
              .print\\:hidden { display: none !important; }
              .page-break { page-break-before: always !important; }
              .no-page-break { page-break-inside: avoid !important; }
              * { color: black !important; }
              .bg-muted { background-color: #f5f5f5 !important; }
              .text-muted-foreground { color: #666 !important; }
              .text-primary { color: #000 !important; }
              .border { border: 1px solid #ddd !important; }
            }
            /* Preview styles to match PDF exactly */
            .preview-document {
              background: white;
              color: black;
              font-family: Arial, sans-serif;
            }
            .preview-document h1 { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
            .preview-document h2 { font-size: 18px; font-weight: bold; margin-bottom: 12px; }
            .preview-document h3 { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
            .preview-document p { font-size: 14px; margin-bottom: 4px; }
            .preview-document .company-header { text-align: center; margin-bottom: 30px; }
            .preview-document .section { margin-bottom: 25px; }
            .preview-document .checklist-item { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              padding: 10px; 
              border: 1px solid #ddd; 
              margin-bottom: 6px;
              background: white;
              font-size: 14px;
            }
            .preview-document .status-badge {
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              white-space: nowrap;
              min-width: 100px;
              text-align: center;
            }
            .preview-document .status-funcionando { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
            .preview-document .status-revisao { background: #fefce8; color: #a16207; border: 1px solid #fef08a; }
            .preview-document .status-ausente { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
            .preview-document .status-not_checked { background: #f9fafb; color: #6b7280; border: 1px solid #e5e7eb; }
          `
        }} />
        {/* Header */}
        <div className="preview-document">
          <div className="company-header">
            <h1 style={{ color: '#000', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
              {profile?.company_name || 'Facilita Serviços e Construções LTDA'}
            </h1>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              CNPJ: {profile?.cnpj || '05.873.924/0001-80'} | Email: {profile?.email || 'contato@fcgestao.com.br'}
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              {profile?.address || 'Rua princesa imperial, 220 - Realengo - RJ'}
            </p>
            <h2 style={{ color: '#000', fontSize: '18px', fontWeight: 'bold' }}>
              CHECKLIST DE INSPEÇÃO VEICULAR
            </h2>
          </div>
        </div>

        {/* General Information */}
        <div className="section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
              Informações Gerais
            </h3>
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '16px', marginBottom: '4px' }}>
                <strong>Data da Inspeção:</strong> {format(new Date(formData.inspection_date || new Date()), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
              <p style={{ fontSize: '16px', marginBottom: '4px' }}>
                <strong>Inspetor:</strong> {selectedInspector.first_name} {selectedInspector.last_name}
              </p>
              <p style={{ fontSize: '16px', marginBottom: '4px' }}>
                <strong>Quilometragem:</strong> {formData.vehicle_mileage || 'Não informado'} km
              </p>
              <p style={{ fontSize: '16px', marginBottom: '4px' }}>
                <strong>Centro de Custo:</strong> {formData.cost_center || 'Não informado'}
              </p>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
              Dados do Veículo
            </h3>
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '14px', marginBottom: '4px' }}>
                <strong>Modelo:</strong> {selectedVehicle.model || 'Não informado'}
              </p>
              <p style={{ fontSize: '14px', marginBottom: '4px' }}>
                <strong>Placa:</strong> {selectedVehicle.license_plate || 'Não informado'}
              </p>
              <p style={{ fontSize: '14px', marginBottom: '4px' }}>
                <strong>Ano:</strong> {selectedVehicle.year || 'Não informado'}
              </p>
              <p style={{ fontSize: '14px', marginBottom: '4px' }}>
                <strong>Categoria:</strong> {selectedVehicle.vehicle_category}
              </p>
            </div>
          </div>
        </div>

        {/* Checklist Items by Category */}
        {Object.entries(
          filteredChecklistItems.reduce((acc, item) => {
            if (!acc[item.category]) {
              acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
          }, {} as Record<string, any[]>)
        ).map(([category, categoryItems]) => {
          return (
            <div key={category} className="section" style={{ marginBottom: '25px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                marginBottom: '12px', 
                borderBottom: '1px solid #ddd', 
                paddingBottom: '8px',
                color: '#000' 
              }}>
                {getCategoryTitle(category)}
              </h3>
              <div>
                {(categoryItems as any[]).map((item) => {
                  const fieldKey = getFieldKey(item.name);
                  const itemData = formData[fieldKey] || {};
                  const status = itemData.status || 'not_checked';
                  const observation = itemData.observation || '';

                  return (
                    <div key={item.name} className="checklist-item" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '10px',
                      border: '1px solid #ddd',
                      marginBottom: '6px',
                      background: 'white',
                      fontSize: '14px'
                    }}>
                      <div style={{ flex: 1, paddingRight: '10px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px' }}>
                          {item.name}
                        </p>
                        {item.description && (
                          <p style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                            {item.description}
                          </p>
                        )}
                        {observation && (
                          <p style={{ fontSize: '12px', color: '#d97706', marginTop: '4px' }}>
                            <strong>Observação:</strong> {observation}
                          </p>
                        )}
                      </div>
                      <div className={`status-badge status-${status}`} style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        minWidth: '100px',
                        textAlign: 'center'
                      }}>
                        {getStatusText(status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Overall Condition */}
        <div className="section" style={{ marginBottom: '25px' }}>
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '12px', 
            borderBottom: '1px solid #ddd', 
            paddingBottom: '8px' 
          }}>
            Condição Geral
          </h3>
          <p style={{ 
            padding: '12px', 
            backgroundColor: '#f5f5f5', 
            border: '1px solid #ddd',
            fontSize: '12px'
          }}>
            {formData.overall_condition || 'Não informado'}
          </p>
        </div>

        {/* Additional Notes */}
        {formData.additional_notes && (
          <div className="section" style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              marginBottom: '12px', 
              borderBottom: '1px solid #ddd', 
              paddingBottom: '8px' 
            }}>
              Observações Adicionais
            </h3>
            <p style={{ 
              padding: '12px', 
              backgroundColor: '#f5f5f5', 
              border: '1px solid #ddd',
              fontSize: '12px',
              whiteSpace: 'pre-wrap'
            }}>
              {formData.additional_notes}
            </p>
          </div>
        )}

        {/* Photos */}
        <div className="section" style={{ marginTop: '30px' }}>
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '12px', 
            borderBottom: '1px solid #ddd', 
            paddingBottom: '8px' 
          }}>
            Documentação Fotográfica
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {formData.exterior_photo_url && (
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '500', marginBottom: '8px' }}>
                  Foto Externa
                </h4>
                <img 
                  src={formData.exterior_photo_url} 
                  alt="Foto Externa do Veículo"
                  style={{ 
                    width: '100%', 
                    height: '200px', 
                    objectFit: 'cover', 
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            )}
            {formData.interior_photo_url && (
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '500', marginBottom: '8px' }}>
                  Foto Interna
                </h4>
                <img 
                  src={formData.interior_photo_url} 
                  alt="Foto Interna do Veículo"
                  style={{ 
                    width: '100%', 
                    height: '200px', 
                    objectFit: 'cover', 
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Signature */}
        {formData.inspector_signature && (
          <div className="section" style={{ marginTop: '30px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              marginBottom: '12px', 
              borderBottom: '1px solid #ddd', 
              paddingBottom: '8px' 
            }}>
              Assinatura do Inspetor
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={formData.inspector_signature} 
                  alt="Assinatura do Inspetor"
                  style={{ 
                    width: '250px', 
                    height: '120px', 
                    objectFit: 'contain', 
                    border: '1px solid #ddd',
                    marginBottom: '8px'
                  }}
                />
                <p style={{ 
                  fontSize: '12px', 
                  borderTop: '1px solid #ddd', 
                  paddingTop: '8px',
                  marginBottom: '4px'
                }}>
                  {selectedInspector.first_name} {selectedInspector.last_name}
                </p>
                <p style={{ fontSize: '10px', color: '#666' }}>
                  Inspetor Responsável
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: '40px', 
          textAlign: 'center', 
          fontSize: '10px', 
          color: '#666',
          borderTop: '1px solid #ddd',
          paddingTop: '16px'
        }}>
          <p style={{ marginBottom: '4px' }}>
            Documento gerado em {format(new Date(), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
          </p>
          <p>Sistema de Gestão de Checklists - FC Gestão Empresarial</p>
        </div>
      </div>
    </div>
  );
};