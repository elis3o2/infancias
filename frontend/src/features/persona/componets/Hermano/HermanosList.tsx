import type { HermanoCreate } from "../../types"
import { Stack, Divider, Box } from "@mui/material"
import { HermanoList } from "./HermanoList"

type Props = {
  hermanos: HermanoCreate[]
  onEliminar?: (n: number) => void
}

export const HermanosList = ({ hermanos, onEliminar }: Props) => {
  return (
    <Stack spacing={2}>
      {hermanos.map((hermano, index) => (
          <Box key={index}>
          <HermanoList
            hermano={hermano}
            onEliminar={() => onEliminar(index)}
          />
          {index < hermanos.length - 1 && (
              <Divider sx={{ mt: 2 }} />
          )}
          </Box>
      ))}
    </Stack>
  )
}