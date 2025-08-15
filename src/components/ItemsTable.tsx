import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import ItemDetails from "./ItemDetails";
import { Item, ROLES } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getItems } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ItemsTable = () => {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const { data: initialItems = [] } = useQuery({ queryKey: ['items'], queryFn: getItems });

  const filteredItems = useMemo(() => {
    if (!user || hasRole([ROLES.ADMIN, ROLES.MANAGER])) {
      return initialItems;
    }
    return initialItems.filter(item => user.associatedItemIds?.includes(item.id));
  }, [user, hasRole, initialItems]);

  const [items, setItems] = useState<Item[]>(filteredItems);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useState(() => {
    setItems(filteredItems);
  }, [filteredItems]);

  const handleRowClick = (item: Item) => {
    setSelectedItem(item);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
  };

  const handleItemChange = (updatedItem: Item) => {
    setItems(currentItems =>
      currentItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
    setSelectedItem(updatedItem);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("itemsTable.id")}</TableHead>
            <TableHead>{t("itemsTable.name")}</TableHead>
            <TableHead>{t("itemsTable.status")}</TableHead>
            <TableHead>{t("itemsTable.location")}</TableHead>
            <TableHead>Predicted ETA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} onClick={() => handleRowClick(item)} className="cursor-pointer hover:bg-muted/50">
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <Badge>{item.status}</Badge>
              </TableCell>
              <TableCell>{item.location}</TableCell>
              <TableCell>
                {item.predictedEta ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>{item.predictedEta.time}</TooltipTrigger>
                      <TooltipContent>
                        <p>Confidence: {item.predictedEta.confidence}%</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ItemDetails
        item={selectedItem}
        onClose={handleCloseDetails}
        onItemChange={handleItemChange}
      />
    </>
  );
};

export default ItemsTable;
