import { Box, Grid } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

import { BadgeVcCard } from "@/components/ui/card/BadgeVcCard";
import { DisplayBadgeVc } from "@/types/api/credential";

type Props = {
  onSelectionChange?: (selected: DisplayBadgeVc[]) => void;
  badgeList: DisplayBadgeVc[];
};

export const VcList: React.FC<Props> = ({ onSelectionChange, badgeList }) => {
  const [selected, setSelected] = useState<DisplayBadgeVc[]>([]);

  const handleToggleSelect = (badge: DisplayBadgeVc) => {
    const alreadySelected = selected.some((b) => b.badgeVcId === badge.badgeVcId);
    const updated = alreadySelected
      ? selected.filter((b) => b.badgeVcId !== badge.badgeVcId)
      : [...selected, badge];

    setSelected(updated);
    onSelectionChange?.(updated);
  };

  const isSelected = (id: number) => selected.some((b) => b.badgeVcId === id);

  useEffect(() => {
    onSelectionChange?.(selected);
  }, []);

  return (
    <Grid gap={4}>
      {badgeList?.map((badgeVc, idx) => {
        const selectedFlag = isSelected(badgeVc.badgeVcId);
        return (
          <Box
            key={idx}
            border={selectedFlag ? "2px solid #3182CE" : "1px solid #E2E8F0"}
            borderRadius="md"
            padding={2}
            bg={selectedFlag ? "blue.50" : "white"}
            cursor="pointer"
            _hover={{ transform: "translateY(-4px)", transition: "0.3s" }}
            onClick={() => handleToggleSelect(badgeVc)}
          >
            <BadgeVcCard badgeVc={badgeVc} />
          </Box>
        );
      })}
    </Grid>
  );
};

