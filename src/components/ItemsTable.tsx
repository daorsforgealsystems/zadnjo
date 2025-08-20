import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { motion } from "framer-motion";
import { listItem } from "@/lib/motion-variants";
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

// Memoized table row component to prevent unnecessary re-renders
const ItemTableRow = memo(({
  item,
  onClick
}: {
  item: Item;
  onClick: (item: Item) => void;
}) => {
  const { t } = useTranslation();
  
  return (
    <motion.tr
      variants={listItem(0)}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={() => onClick(item)}
      className="cursor-pointer hover:bg-muted/50"
    >
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
    </motion.tr>
  );
});

ItemTableRow.displayName = 'ItemTableRow';

const ItemsTable = () => {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const { data: initialItems = [] } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: getItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredItems = useMemo(() => {
    if (!user || hasRole([ROLES.ADMIN, ROLES.MANAGER])) {
      return initialItems;
    }
    return (initialItems as Item[]).filter((item: Item) => user.associatedItemIds?.includes(item.id));
  }, [user, hasRole, initialItems]);

  const [items, setItems] = useState<Item[]>(filteredItems);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Update items when filteredItems change
  useEffect(() => {
    setItems(filteredItems);
  }, [filteredItems]);

  const handleRowClick = useCallback((item: Item) => {
    setSelectedItem(item);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleItemChange = useCallback((updatedItem: Item) => {
    setItems(currentItems =>
      currentItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
    setSelectedItem(updatedItem);
  }, []);

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
            <ItemTableRow
              key={item.id}
              item={item}
              onClick={handleRowClick}
            />
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
