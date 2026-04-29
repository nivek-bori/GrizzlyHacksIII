import { Resource } from "@/lib/prisma/generated/prisma/client";
import { bg_blue, bg_green, bg_yellow } from "@/types/styles";

export default function StatusSelectComponent({ resource }: {resource: Resource}) {
  const bought_clr = bg_green;
  const chosen_clr = bg_blue;
  const potential_clr = bg_yellow;
  
  return (
    <div>
      
    </div>
  );
}