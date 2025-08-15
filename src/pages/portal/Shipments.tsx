import ItemsTable from '@/components/ItemsTable';
import { useTranslation } from 'react-i18next';

const PortalShipments = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Shipments</h1>
        <p className="text-muted-foreground">
          Here you can find details and history for all your shipments. Click on a row to see more details and manage documents.
        </p>
      </div>
      <ItemsTable />
    </div>
  );
};

export default PortalShipments;
